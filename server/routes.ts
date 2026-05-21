import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { notificationsController } from "./controllers/notifications-controller";
import { z } from "zod";
import { 
  insertJobSchema, 
  insertUnitSchema, 
  insertClaimSchema, 
  insertPhotoSchema, 
  insertNotificationSchema,
  insertChatRoomSchema,
  insertChatMessageSchema,
  insertChatParticipantSchema,
  insertUserSchema,
  User
} from "@shared/schema";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_disk = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_disk });

// Middleware to check authentication
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check role authorization
function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
}

// Middleware to validate request body
function validateBody(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ message: "Invalid request body", error });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Authentication
  setupAuth(app);
  
  // Create default users for testing
  try {
    const adminExists = await storage.getUserByUsername("admin");
    if (!adminExists) {
      await storage.createUser({
        username: "admin",
        password: await hashPassword("admin"),
        fullName: "System Administrator",
        email: "admin@escalevr.com",
        role: "admin",
        phone: "555-123-4567",
        avatarUrl: null
      });
      console.log("Default admin user created");
    }
    
    const techExists = await storage.getUserByUsername("tech");
    if (!techExists) {
      await storage.createUser({
        username: "tech",
        password: await hashPassword("tech"),
        fullName: "Tech User",
        email: "tech@escalevr.com",
        role: "technician",
        phone: "555-234-5678",
        avatarUrl: null
      });
      console.log("Default technician user created");
    }
    
    const clientExists = await storage.getUserByUsername("client");
    if (!clientExists) {
      await storage.createUser({
        username: "client",
        password: await hashPassword("client"),
        fullName: "Client User",
        email: "client@example.com",
        role: "client",
        phone: "555-345-6789",
        avatarUrl: null
      });
      console.log("Default client user created");
    }
    
    const serviceExists = await storage.getUserByUsername("service");
    if (!serviceExists) {
      await storage.createUser({
        username: "service",
        password: await hashPassword("service"),
        fullName: "Service User",
        email: "service@escalevr.com",
        role: "service",
        phone: "555-456-7890",
        avatarUrl: null
      });
      console.log("Default service user created");
    }
    
    const claimAgentExists = await storage.getUserByUsername("agent");
    if (!claimAgentExists) {
      await storage.createUser({
        username: "agent",
        password: await hashPassword("agent"),
        fullName: "Agent de Réclamation",
        email: "agent@escalevr.com",
        role: "claim_agent",
        phone: "555-567-8901",
        avatarUrl: null
      });
      console.log("Default claim agent user created");
    }
  } catch (error) {
    console.error("Error creating default users:", error);
  }
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));
  
  // User routes
  app.get('/api/users', 
    isAuthenticated, 
    hasRole(['admin', 'service']), 
    async (req, res) => {
      try {
        const users = await storage.getUsers();
        // Remove passwords from response
        const sanitizedUsers = users.map(({ password, ...user }) => user);
        res.json(sanitizedUsers);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );
  
  app.get('/api/users/role/:role', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const users = await storage.getUsersByRole(req.params.role);
        // Remove passwords from response
        const sanitizedUsers = users.map(({ password, ...user }) => user);
        res.json(sanitizedUsers);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );
  
  // User profile update endpoint
  app.patch('/api/users/:id', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        
        // Users can only update their own profile unless they're admin
        if (userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
        }
        
        // Get current user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Update allowed fields only (prevent role changes unless admin)
        const allowedFields = ['fullName', 'email', 'phone', 'avatarUrl'];
        
        // Create update object with only allowed fields
        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
          if (field in req.body) {
            updates[field] = req.body[field];
          }
        }
        
        // For debugging
        console.log(`Updating user ${userId} with:`, updates);
        
        // Update user in storage
        const updatedUser = await storage.updateUser(userId, updates);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser;
        
        // Return the updated user data
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user profile" });
      }
    }
  );
  
  // Avatar photo upload
  app.post('/api/users/:id/avatar',
    isAuthenticated,
    upload.single('photo'),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        if (userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "Aucun fichier reçu" });
        }
        const avatarUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await storage.updateUser(userId, { avatarUrl });
        const { password, ...safe } = updatedUser;
        res.json({ avatarUrl, user: safe });
      } catch (error) {
        res.status(500).json({ message: "Échec du téléversement de la photo" });
      }
    }
  );

  // Unit routes
  app.get('/api/units',
    isAuthenticated, 
    async (req, res) => {
      try {
        let units;
        
        // For clients, only return their own units
        if (req.user!.role === 'client') {
          units = await storage.getUnitsByClient(req.user!.id);
        } else {
          units = await storage.getUnits();
        }
        
        res.json(units);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch units" });
      }
    }
  );
  
  app.get('/api/units/:id', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const unit = await storage.getUnit(parseInt(req.params.id));
        
        if (!unit) {
          return res.status(404).json({ message: "Unit not found" });
        }
        
        // Check if client is trying to access a unit that isn't theirs
        if (req.user!.role === 'client' && unit.clientId !== req.user!.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        res.json(unit);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch unit" });
      }
    }
  );
  
  app.post('/api/units', 
    isAuthenticated, 
    hasRole(['admin', 'service']), 
    validateBody(insertUnitSchema), 
    async (req, res) => {
      try {
        const unit = await storage.createUnit(req.body);
        res.status(201).json(unit);
      } catch (error) {
        res.status(500).json({ message: "Failed to create unit" });
      }
    }
  );
  
  app.patch('/api/units/:id', 
    isAuthenticated, 
    hasRole(['admin', 'service']), 
    async (req, res) => {
      try {
        const unitId = parseInt(req.params.id);
        const updatedUnit = await storage.updateUnit(unitId, req.body);
        
        if (!updatedUnit) {
          return res.status(404).json({ message: "Unit not found" });
        }
        
        res.json(updatedUnit);
      } catch (error) {
        res.status(500).json({ message: "Failed to update unit" });
      }
    }
  );
  
  // Delete unit - admin only
  app.delete('/api/units/:id',
    isAuthenticated,
    hasRole(['admin']), // Restricted to admin role only
    async (req, res) => {
      try {
        const unitId = parseInt(req.params.id);
        
        // Check if the unit exists
        const unit = await storage.getUnit(unitId);
        if (!unit) {
          return res.status(404).json({ message: "Véhicule non trouvé" });
        }
        
        // Check if there are associated jobs
        const jobs = await storage.getJobsByUnit(unitId);
        if (jobs && jobs.length > 0) {
          return res.status(400).json({ 
            message: "Impossible de supprimer ce véhicule car il a des services associés"
          });
        }
        
        // Delete unit
        await storage.deleteUnit(unitId);
        
        res.status(200).json({ message: "Véhicule supprimé avec succès" });
      } catch (error) {
        res.status(500).json({ message: "Échec de la suppression du véhicule" });
      }
    }
  );
  
  // Job routes
  app.get('/api/jobs', 
    isAuthenticated, 
    async (req, res) => {
      try {
        let jobs;
        
        // Different filtering based on role
        if (req.user!.role === 'client') {
          jobs = await storage.getJobsByClient(req.user!.id);
        } else if (req.user!.role === 'technician') {
          jobs = await storage.getJobsByTechnician(req.user!.id);
        } else {
          jobs = await storage.getJobs();
        }
        
        // Filter out non-visible jobs for clients
        if (req.user!.role === 'client') {
          jobs = jobs.filter(job => job.clientVisible);
        }
        
        res.json(jobs);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch jobs" });
      }
    }
  );
  
  app.get('/api/jobs/status/:status', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const jobs = await storage.getJobsByStatus(req.params.status);
        
        // Filter for client's jobs only if client
        let filteredJobs = jobs;
        if (req.user!.role === 'client') {
          filteredJobs = jobs.filter(job => job.clientId === req.user!.id && job.clientVisible);
        }
        
        res.json(filteredJobs);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch jobs" });
      }
    }
  );
  
  app.get('/api/jobs/type/:type', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const jobs = await storage.getJobsByType(req.params.type);
        
        // Filter for client's jobs only if client
        let filteredJobs = jobs;
        if (req.user!.role === 'client') {
          filteredJobs = jobs.filter(job => job.clientId === req.user!.id && job.clientVisible);
        }
        
        res.json(filteredJobs);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch jobs" });
      }
    }
  );
  
  app.get('/api/jobs/:id', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const job = await storage.getJob(parseInt(req.params.id));
        
        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }
        
        // Check if client is trying to access a job that isn't theirs or isn't visible
        if (req.user!.role === 'client' && (job.clientId !== req.user!.id || !job.clientVisible)) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        res.json(job);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch job" });
      }
    }
  );
  
  app.post('/api/jobs', 
    isAuthenticated, 
    hasRole(['admin', 'service']), 
    validateBody(insertJobSchema), 
    async (req, res) => {
      try {
        const job = await storage.createJob(req.body);
        
        // Notify claim agents for warranty jobs
        if (job.type === 'warranty' || job.type === 'extended_warranty') {
          const claimAgents = await storage.getUsersByRole('claim_agent');
          for (const agent of claimAgents) {
            await storage.createNotification({
              userId: agent.id,
              type: 'claim',
              title: 'Nouveau service de garantie',
              message: `Un nouveau service de garantie (#${job.jobNumber}) a été créé et nécessite votre attention.`,
              relatedId: job.id
            });
          }
        }

        // Notify assigned technician
        if (job.technicianId) {
          await storage.createNotification({
            userId: job.technicianId,
            type: 'job',
            title: 'Nouveau service assigné',
            message: `Un nouveau service (#${job.jobNumber}) vous a été assigné.`,
            relatedId: job.id
          });
        }

        res.status(201).json(job);
      } catch (error) {
        res.status(500).json({ message: "Failed to create job" });
      }
    }
  );
  
  app.patch('/api/jobs/:id', 
    isAuthenticated, 
    hasRole(['admin', 'service', 'technician']), 
    async (req, res) => {
      try {
        const jobId = parseInt(req.params.id);
        const originalJob = await storage.getJob(jobId);
        
        if (!originalJob) {
          return res.status(404).json({ message: "Job not found" });
        }
        
        // Technicians can only update their assigned jobs
        if (req.user!.role === 'technician' && originalJob.technicianId !== req.user!.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        const updatedJob = await storage.updateJob(jobId, req.body);
        
        if (!updatedJob) {
          return res.status(404).json({ message: "Job not found" });
        }
        
        // Send notification to client if status changed and job is visible to client
        if (originalJob.status !== updatedJob.status && updatedJob.clientVisible) {
          await storage.createNotification({
            userId: updatedJob.clientId,
            type: 'job',
            title: 'Job Status Updated',
            message: `Your job (#${updatedJob.jobNumber}) has been updated to: ${updatedJob.status.replace('_', ' ')}.`,
            relatedId: updatedJob.id
          });
        }
        
        // Send notification to technician if newly assigned
        if ((!originalJob.technicianId || originalJob.technicianId !== updatedJob.technicianId) && updatedJob.technicianId) {
          await storage.createNotification({
            userId: updatedJob.technicianId,
            type: 'job',
            title: 'New Job Assignment',
            message: `You have been assigned to job #${updatedJob.jobNumber}.`,
            relatedId: updatedJob.id
          });
        }
        
        res.json(updatedJob);
      } catch (error) {
        res.status(500).json({ message: "Failed to update job" });
      }
    }
  );
  
  // Claim routes
  app.get('/api/claims', 
    isAuthenticated, 
    async (req, res) => {
      try {
        let claims;
        
        if (req.user!.role === 'claim_agent') {
          claims = await storage.getClaims();
        } else if (req.user!.role === 'admin' || req.user!.role === 'service') {
          claims = await storage.getClaims();
        } else {
          // Get jobs for this client
          const clientJobs = await storage.getJobsByClient(req.user!.id);
          const clientJobIds = clientJobs.map(job => job.id);
          
          // Get all claims
          const allClaims = await storage.getClaims();
          
          // Filter to only include claims for client's jobs that are marked visible
          claims = allClaims.filter(claim => 
            clientJobIds.includes(claim.jobId) && claim.clientVisible
          );
        }
        
        res.json(claims);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch claims" });
      }
    }
  );
  
  app.get('/api/claims/:id', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const claim = await storage.getClaim(parseInt(req.params.id));
        
        if (!claim) {
          return res.status(404).json({ message: "Claim not found" });
        }
        
        // For clients, verify claim is for their job and is visible
        if (req.user!.role === 'client') {
          const job = await storage.getJob(claim.jobId);
          
          if (!job || job.clientId !== req.user!.id || !claim.clientVisible) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
        
        res.json(claim);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch claim" });
      }
    }
  );
  
  app.post('/api/claims', 
    isAuthenticated, 
    hasRole(['admin', 'service', 'claim_agent', 'technician']), 
    validateBody(insertClaimSchema), 
    async (req, res) => {
      try {
        const claim = await storage.createClaim(req.body);
        
        // Notify claim agents about new claim
        const claimAgents = await storage.getUsersByRole('claim_agent');
        
        for (const agent of claimAgents) {
          await storage.createNotification({
            userId: agent.id,
            type: 'claim',
            title: 'New Warranty Claim',
            message: `A new warranty claim (#${claim.claimNumber}) has been submitted and needs review.`,
            relatedId: claim.id
          });
        }
        
        res.status(201).json(claim);
      } catch (error) {
        res.status(500).json({ message: "Failed to create claim" });
      }
    }
  );
  
  app.patch('/api/claims/:id', 
    isAuthenticated, 
    hasRole(['admin', 'claim_agent']), 
    async (req, res) => {
      try {
        const claimId = parseInt(req.params.id);
        const originalClaim = await storage.getClaim(claimId);
        
        if (!originalClaim) {
          return res.status(404).json({ message: "Claim not found" });
        }
        
        const updatedClaim = await storage.updateClaim(claimId, req.body);
        
        if (!updatedClaim) {
          return res.status(404).json({ message: "Claim not found" });
        }
        
        // If status changed, notify relevant parties
        if (originalClaim.status !== updatedClaim.status) {
          // Get associated job
          const job = await storage.getJob(updatedClaim.jobId);
          
          if (job) {
            // Notify client if claim is visible to them
            if (updatedClaim.clientVisible) {
              await storage.createNotification({
                userId: job.clientId,
                type: 'claim',
                title: 'Warranty Claim Updated',
                message: `Your warranty claim (#${updatedClaim.claimNumber}) status has been updated to: ${updatedClaim.status}.`,
                relatedId: updatedClaim.id
              });
            }
            
            // Notify technician assigned to the job
            if (job.technicianId) {
              await storage.createNotification({
                userId: job.technicianId,
                type: 'claim',
                title: 'Warranty Claim Updated',
                message: `Warranty claim (#${updatedClaim.claimNumber}) for job #${job.jobNumber} has been updated to: ${updatedClaim.status}.`,
                relatedId: updatedClaim.id
              });
            }
          }
        }
        
        res.json(updatedClaim);
      } catch (error) {
        res.status(500).json({ message: "Failed to update claim" });
      }
    }
  );
  
  // Photo upload route
  app.post('/api/photos', 
    isAuthenticated, 
    upload.single('photo'), 
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        const filePath = `/uploads/${req.file.filename}`;
        
        const photoData = {
          entityType: req.body.entityType,
          entityId: parseInt(req.body.entityId),
          url: filePath,
          caption: req.body.caption || "",
          uploadedBy: req.user!.id,
          clientVisible: req.body.clientVisible === 'true'
        };
        
        // Validate photo data
        const validatedData = insertPhotoSchema.parse(photoData);
        
        // Check permissions based on entityType
        if (photoData.entityType === 'job') {
          const job = await storage.getJob(photoData.entityId);
          
          if (!job) {
            return res.status(404).json({ message: "Job not found" });
          }
          
          // Technicians can only upload photos to their assigned jobs
          if (req.user!.role === 'technician' && job.technicianId !== req.user!.id) {
            return res.status(403).json({ message: "Forbidden" });
          }
        } else if (photoData.entityType === 'claim') {
          const claim = await storage.getClaim(photoData.entityId);
          
          if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
          }
          
          // Only claim agents, admins, and service can upload photos to claims
          if (!['admin', 'claim_agent', 'service'].includes(req.user!.role)) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
        
        const photo = await storage.createPhoto(validatedData);
        res.status(201).json(photo);
      } catch (error) {
        res.status(500).json({ message: "Failed to upload photo" });
      }
    }
  );
  
  // Get photos for an entity (job, unit, claim)
  app.get('/api/photos/:entityType/:entityId', 
    isAuthenticated,
    async (req, res) => {
      try {
        const entityType = req.params.entityType;
        const entityId = parseInt(req.params.entityId);
        
        // Validate entity type
        if (!['job', 'unit', 'claim'].includes(entityType)) {
          return res.status(400).json({ message: "Invalid entity type" });
        }
        
        // Get photos for the entity
        const photos = await storage.getPhotosByEntity(entityType, entityId);
        
        // For clients, filter out non-visible photos
        if (req.user!.role === 'client') {
          const visiblePhotos = photos.filter(photo => photo.clientVisible);
          return res.json(visiblePhotos);
        }
        
        res.json(photos);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch photos" });
      }
    }
  );

  // Photo visibility update
  app.patch('/api/photos/:id/visibility', 
    isAuthenticated, 
    hasRole(['admin', 'service', 'technician']), 
    async (req, res) => {
      try {
        const photoId = parseInt(req.params.id);
        const { clientVisible } = req.body;
        
        if (typeof clientVisible !== 'boolean') {
          return res.status(400).json({ message: "clientVisible must be a boolean" });
        }
        
        const updatedPhoto = await storage.updatePhotoVisibility(photoId, clientVisible);
        
        if (!updatedPhoto) {
          return res.status(404).json({ message: "Photo not found" });
        }
        
        res.json(updatedPhoto);
      } catch (error) {
        res.status(500).json({ message: "Failed to update photo" });
      }
    }
  );
  
  // Notification routes
  app.get('/api/notifications', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const notifications = await storage.getNotificationsByUser(req.user!.id);
        res.json(notifications);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch notifications" });
      }
    }
  );
  
  app.post('/api/notifications/read/:id', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const notificationId = parseInt(req.params.id);
        const notification = await storage.getNotification(notificationId);
        
        if (!notification) {
          return res.status(404).json({ message: "Notification not found" });
        }
        
        // Users can only mark their own notifications as read
        if (notification.userId !== req.user!.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        const updatedNotification = await storage.markNotificationAsRead(notificationId);
        res.json(updatedNotification);
      } catch (error) {
        res.status(500).json({ message: "Failed to mark notification as read" });
      }
    }
  );
  
  app.post('/api/notifications/read-all', 
    isAuthenticated, 
    async (req, res) => {
      try {
        await storage.markAllNotificationsAsRead(req.user!.id);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to mark all notifications as read" });
      }
    }
  );
  
  // Calendar/Schedule routes
  app.get('/api/schedule', 
    isAuthenticated, 
    async (req, res) => {
      try {
        // Get all jobs with scheduled dates
        let scheduledJobs = (await storage.getJobs())
          .filter(job => job.dateScheduled !== null);
        
        // Filter based on user role
        if (req.user!.role === 'client') {
          scheduledJobs = scheduledJobs.filter(job => 
            job.clientId === req.user!.id && job.clientVisible
          );
        } else if (req.user!.role === 'technician') {
          scheduledJobs = scheduledJobs.filter(job => 
            job.technicianId === req.user!.id
          );
        }
        
        // Format as calendar events
        const events = scheduledJobs.map(job => ({
          id: job.id,
          title: job.description,
          jobNumber: job.jobNumber,
          start: job.dateScheduled,
          end: job.dateScheduled,
          status: job.status,
          type: job.type,
          timeStart: (job as any).timeStart || null,
          timeEnd: (job as any).timeEnd || null,
          unitId: job.unitId,
        }));
        
        res.json(events);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch schedule" });
      }
    }
  );
  
  // Dashboard data route
  app.get('/api/dashboard', 
    isAuthenticated, 
    async (req, res) => {
      try {
        const allJobs = await storage.getJobs();
        const allClaims = await storage.getClaims();
        const allUnits = await storage.getUnits();
        const allTechnicians = await storage.getUsersByRole('technician');
        
        // Filter based on user role
        let stats = {};
        let recentJobs = [];
        let technicianStatus = [];
        let pendingClaims = [];
        
        if (req.user!.role === 'client') {
          // Client dashboard shows only their jobs and units
          const clientJobs = allJobs.filter(job => job.clientId === req.user!.id && job.clientVisible);
          const clientUnits = allUnits.filter(unit => unit.clientId === req.user!.id);
          
          stats = {
            totalJobs: clientJobs.length,
            activeJobs: clientJobs.filter(job => job.status === 'in_progress').length,
            completedJobs: clientJobs.filter(job => job.status === 'completed').length,
            totalUnits: clientUnits.length
          };
          
          recentJobs = clientJobs
            .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
            .slice(0, 5);
        } else {
          // Admin, service, technician, claim_agent get more comprehensive data
          stats = {
            activeJobs: allJobs.filter(job => job.status === 'in_progress').length,
            scheduledJobs: allJobs.filter(job => job.status === 'scheduled').length,
            unitsInShop: allUnits.length,
            pendingApprovals: allClaims.filter(claim => claim.status === 'pending').length
          };
          
          // For technicians, only show their jobs
          if (req.user!.role === 'technician') {
            recentJobs = allJobs
              .filter(job => job.technicianId === req.user!.id)
              .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
              .slice(0, 5);
          } else {
            recentJobs = allJobs
              .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
              .slice(0, 5);
          }
          
          // All technicians with their current jobs
          technicianStatus = await Promise.all(allTechnicians.map(async tech => {
            const techJobs = allJobs.filter(job => job.technicianId === tech.id);
            const activeJobs = techJobs.filter(job => job.status === 'in_progress');
            const todayJobs = techJobs.filter(job => {
              if (!job.dateScheduled) return false;
              const jobDate = new Date(job.dateScheduled);
              const today = new Date();
              return jobDate.toDateString() === today.toDateString();
            });
            
            return {
              id: tech.id,
              name: tech.fullName,
              status: activeJobs.length > 0 ? 'active' : 'idle',
              todayJobCount: todayJobs.length
            };
          }));
          
          // Recent claims for admin, service, claim_agent
          if (['admin', 'service', 'claim_agent'].includes(req.user!.role)) {
            pendingClaims = allClaims
              .filter(claim => claim.status === 'pending')
              .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime())
              .slice(0, 5);
          }
        }
        
        res.json({
          stats,
          recentJobs,
          technicianStatus,
          pendingClaims
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch dashboard data" });
      }
    }
  );

  // Get all users (needed for chat functionality)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Get all users
      const users = await storage.getUsers();
      
      // Filter sensitive information based on role
      const filteredUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        avatarUrl: user.avatarUrl
      }));
      
      res.json(filteredUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Chat API routes
  app.get(
    "/api/chat/rooms",
    isAuthenticated,
    async (req, res) => {
      try {
        const { user } = req;
        const userId = user.id;
        const userRole = user.role;
        let rooms = [];
        
        // Clients only see client chat rooms where they are the client
        if (userRole === "client") {
          rooms = await storage.getChatRoomsByClient(userId);
        } else {
          // Staff users (admin, technician, service, claim_agent) see:
          // 1. All internal chat rooms where they are participants
          // 2. All client chat rooms they created or are assigned to
          const internalRooms = await storage.getChatRoomsByUser(userId);
          const clientRoomsCreated = await storage.getChatRoomsByCreator(userId);
          
          // Remove duplicates by creating a Map with room ID as key
          const roomMap = new Map();
          [...internalRooms, ...clientRoomsCreated].forEach(room => {
            roomMap.set(room.id, room);
          });
          
          rooms = Array.from(roomMap.values());
        }
        
        res.json(rooms);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch chat rooms" });
      }
    }
  );

  // Get chat room by ID
  app.get(
    "/api/chat/rooms/:id",
    isAuthenticated,
    async (req, res) => {
      try {
        const roomId = parseInt(req.params.id);
        const room = await storage.getChatRoom(roomId);
        
        if (!room) {
          return res.status(404).json({ message: "Chat room not found" });
        }
        
        // Check access rights
        const { user } = req;
        const userId = user.id;
        const userRole = user.role;
        
        // For client chat rooms, only the client or staff that are participants can access
        if (room.type === "client") {
          if (userRole === "client" && room.clientId !== userId) {
            return res.status(403).json({ message: "Access denied" });
          }
          
          if (userRole !== "client") {
            // Staff can access if they created the chat or are participants
            const participants = await storage.getChatParticipantsByRoom(roomId);
            const isParticipant = participants.some(p => p.userId === userId);
            const isCreator = room.createdBy === userId;
            
            if (!isParticipant && !isCreator) {
              return res.status(403).json({ message: "Access denied" });
            }
          }
        } else {
          // For internal chats, only staff who are participants can access
          if (userRole === "client") {
            return res.status(403).json({ message: "Access denied" });
          }
          
          const participants = await storage.getChatParticipantsByRoom(roomId);
          const isParticipant = participants.some(p => p.userId === userId);
          
          if (!isParticipant && user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
          }
        }
        
        // Get all messages and participants for the room
        const messages = await storage.getChatMessagesByRoom(roomId);
        const participants = await storage.getChatParticipantsByRoom(roomId);
        
        // Mark messages as read for the current user
        await storage.markChatMessagesAsRead(roomId, userId);
        
        res.json({
          room,
          messages,
          participants
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch chat room" });
      }
    }
  );

  // Create a new chat room
  app.post(
    "/api/chat/rooms",
    isAuthenticated,
    validateBody(insertChatRoomSchema),
    async (req, res) => {
      try {
        const { user } = req;
        const userId = user.id;
        const userRole = user.role;
        
        // Only staff can create chat rooms, clients cannot
        if (userRole === "client") {
          return res.status(403).json({ message: "Clients cannot create chat rooms" });
        }
        
        // Create the chat room
        const roomData = {
          ...req.body,
          createdBy: userId
        };
        
        const room = await storage.createChatRoom(roomData);
        
        // For internal chats, add the creator as a participant
        if (room.type === "internal") {
          await storage.addChatParticipant({
            roomId: room.id,
            userId
          });
          
          // If participants are specified, add them
          if (req.body.participants && Array.isArray(req.body.participants)) {
            for (const participantId of req.body.participants) {
              if (participantId !== userId) { // Skip creator, already added
                await storage.addChatParticipant({
                  roomId: room.id,
                  userId: participantId
                });
              }
            }
          }
        }
        
        res.status(201).json(room);
      } catch (error) {
        res.status(500).json({ message: "Failed to create chat room" });
      }
    }
  );

  // Add a message to a chat room
  app.post(
    "/api/chat/rooms/:id/messages",
    isAuthenticated,
    validateBody(insertChatMessageSchema.omit({ roomId: true })),
    async (req, res) => {
      try {
        const roomId = parseInt(req.params.id);
        const { user } = req;
        const userId = user.id;
        
        const room = await storage.getChatRoom(roomId);
        if (!room) {
          return res.status(404).json({ message: "Chat room not found" });
        }
        
        // Check access for sending messages
        if (room.type === "client") {
          // For client chat, only the client and staff participants can send messages
          if (user.role === "client" && room.clientId !== userId) {
            return res.status(403).json({ message: "Access denied" });
          }
          
          if (user.role !== "client") {
            // Staff need to be participants
            const participants = await storage.getChatParticipantsByRoom(roomId);
            const isParticipant = participants.some(p => p.userId === userId);
            const isCreator = room.createdBy === userId;
            
            if (!isParticipant && !isCreator && user.role !== "admin") {
              return res.status(403).json({ message: "Access denied" });
            }
          }
        } else {
          // Internal chat, only staff who are participants can send messages
          if (user.role === "client") {
            return res.status(403).json({ message: "Access denied" });
          }
          
          const participants = await storage.getChatParticipantsByRoom(roomId);
          const isParticipant = participants.some(p => p.userId === userId);
          
          if (!isParticipant && user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
          }
        }
        
        // Create the message
        const message = await storage.createChatMessage({
          roomId,
          senderId: userId,
          message: req.body.message
        });
        
        // Also create a notification for all participants except the sender
        const participants = await storage.getChatParticipantsByRoom(roomId);
        for (const participant of participants) {
          if (participant.userId !== userId) {
            await storage.createNotification({
              userId: participant.userId,
              type: "system",
              title: `${user.fullName} vous a envoyé un message`,
              message: `Nouveau message dans "${room.name}"`,
              relatedId: roomId
            });
          }
        }

        // If this is a client chat, also notify the client if the sender is not the client
        if (room.type === "client" && room.clientId && room.clientId !== userId) {
          await storage.createNotification({
            userId: room.clientId,
            type: "system",
            title: `${user.fullName} vous a envoyé un message`,
            message: `Nouveau message dans "${room.name}"`,
            relatedId: roomId
          });
        }
        
        res.status(201).json(message);
      } catch (error) {
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  );

  // Upload a file in a chat room
  app.post(
    "/api/chat/upload",
    isAuthenticated,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Aucun fichier reçu" });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const originalName = req.file.originalname;
        res.json({ url: fileUrl, name: originalName });
      } catch (error) {
        res.status(500).json({ message: "Échec du téléversement" });
      }
    }
  );

  // Add a participant to a chat room (internal chats only)
  app.post(
    "/api/chat/rooms/:id/participants",
    isAuthenticated,
    validateBody(z.object({ userId: z.number() })),
    async (req, res) => {
      try {
        const roomId = parseInt(req.params.id);
        const { userId } = req.body;
        const { user } = req;
        
        // Only staff can add participants and only to internal chats
        if (user.role === "client") {
          return res.status(403).json({ message: "Access denied" });
        }
        
        const room = await storage.getChatRoom(roomId);
        if (!room) {
          return res.status(404).json({ message: "Chat room not found" });
        }
        
        if (room.type !== "internal") {
          return res.status(400).json({ message: "Cannot add participants to client chats" });
        }
        
        // Only room creator or admin can add participants
        if (room.createdBy !== user.id && user.role !== "admin") {
          return res.status(403).json({ message: "Only the room creator or admin can add participants" });
        }
        
        // Check if user to be added exists
        const userToAdd = await storage.getUser(userId);
        if (!userToAdd) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Check if user is already a participant
        const participants = await storage.getChatParticipantsByRoom(roomId);
        if (participants.some(p => p.userId === userId)) {
          return res.status(400).json({ message: "User is already a participant" });
        }
        
        // Add participant
        const participant = await storage.addChatParticipant({
          roomId,
          userId
        });
        
        // Notify the added user
        await storage.createNotification({
          userId,
          type: "system",
          title: "Added to chat room",
          message: `You were added to the chat room: ${room.name}`,
          relatedId: roomId
        });
        
        res.status(201).json(participant);
      } catch (error) {
        res.status(500).json({ message: "Failed to add participant" });
      }
    }
  );

  // Remove a participant from a chat room
  app.delete(
    "/api/chat/rooms/:roomId/participants/:userId",
    isAuthenticated,
    async (req, res) => {
      try {
        const roomId = parseInt(req.params.roomId);
        const participantId = parseInt(req.params.userId);
        const { user } = req;
        
        // Only staff can remove participants
        if (user.role === "client") {
          return res.status(403).json({ message: "Access denied" });
        }
        
        const room = await storage.getChatRoom(roomId);
        if (!room) {
          return res.status(404).json({ message: "Chat room not found" });
        }
        
        if (room.type !== "internal") {
          return res.status(400).json({ message: "Cannot remove participants from client chats" });
        }
        
        // Only room creator, admin, or self-removal is allowed
        if (room.createdBy !== user.id && user.role !== "admin" && participantId !== user.id) {
          return res.status(403).json({ message: "Only the room creator or admin can remove participants" });
        }
        
        // Remove participant
        await storage.removeChatParticipant(roomId, participantId);
        
        // If it's not self-removal, notify the removed user
        if (participantId !== user.id) {
          await storage.createNotification({
            userId: participantId,
            type: "system",
            title: "Removed from chat room",
            message: `You were removed from the chat room: ${room.name}`,
            relatedId: roomId
          });
        }
        
        res.status(200).json({ message: "Participant removed successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove participant" });
      }
    }
  );

  // Routes pour les notifications SMS
  // Vérifier le statut du service SMS
  app.get('/api/notifications/sms/status',
    isAuthenticated,
    hasRole(['admin', 'service']),
    (req, res) => notificationsController.checkSMSServiceStatus(req, res)
  );

  // Envoyer un SMS directement
  app.post('/api/notifications/sms/send',
    isAuthenticated,
    hasRole(['admin', 'service']),
    (req, res) => notificationsController.sendSMS(req, res)
  );

  // Envoyer une notification de changement de statut
  app.post('/api/notifications/sms/job-status',
    isAuthenticated,
    hasRole(['admin', 'service', 'technician']),
    (req, res) => notificationsController.sendJobStatusNotification(req, res)
  );

  // Envoyer un rappel de rendez-vous
  app.post('/api/notifications/sms/appointment-reminder',
    isAuthenticated,
    hasRole(['admin', 'service']),
    (req, res) => notificationsController.sendAppointmentReminder(req, res)
  );

  // Routes de gestion des utilisateurs (protégées, réservées aux admins)
  // Récupérer tous les utilisateurs
  app.get('/api/users',
    isAuthenticated,
    hasRole(['admin']),
    async (req, res) => {
      try {
        const users = await storage.getUsers();
        res.json(users);
      } catch (error) {
        res.status(500).json({ message: "Impossible de récupérer les utilisateurs" });
      }
    }
  );

  // Récupérer un utilisateur spécifique
  app.get('/api/users/:id',
    isAuthenticated,
    hasRole(['admin']),
    async (req, res) => {
      try {
        const user = await storage.getUser(parseInt(req.params.id));
        
        if (!user) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        
        res.json(user);
      } catch (error) {
        res.status(500).json({ message: "Impossible de récupérer l'utilisateur" });
      }
    }
  );

  // Créer un nouvel utilisateur (admin uniquement)
  app.post('/api/users',
    isAuthenticated,
    hasRole(['admin']),
    validateBody(insertUserSchema),
    async (req, res) => {
      try {
        // Vérifier si le nom d'utilisateur existe déjà
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).json({ message: "Ce nom d'utilisateur existe déjà" });
        }

        // Hashage du mot de passe
        const hashedPassword = await hashPassword(req.body.password);
        
        // Création de l'utilisateur avec mot de passe hashé
        const newUser = await storage.createUser({
          ...req.body,
          password: hashedPassword
        });
        
        // On retire le mot de passe de la réponse
        const { password, ...userWithoutPassword } = newUser;
        
        res.status(201).json(userWithoutPassword);
      } catch (error) {
        res.status(500).json({ message: "Impossible de créer l'utilisateur" });
      }
    }
  );

  // Mettre à jour un utilisateur
  app.patch('/api/users/:id',
    isAuthenticated,
    hasRole(['admin']),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        
        // Préparer les données de mise à jour
        const updateData: Partial<User> = { ...req.body };
        
        // Si un mot de passe est fourni (et qu'il n'est pas vide), le hasher
        if (updateData.password && updateData.password.trim() !== '') {
          updateData.password = await hashPassword(updateData.password);
        } else if (updateData.password === '') {
          // Si le mot de passe est une chaîne vide, le supprimer de l'objet
          // pour conserver le mot de passe actuel
          delete updateData.password;
        }
        
        // Mettre à jour l'utilisateur
        const updatedUser = await storage.updateUser(userId, updateData);
        
        // Retirer le mot de passe de la réponse
        const { password, ...userWithoutPassword } = updatedUser;
        
        res.json(userWithoutPassword);
      } catch (error) {
        res.status(500).json({ message: "Impossible de mettre à jour l'utilisateur" });
      }
    }
  );

  // Supprimer un utilisateur
  app.delete('/api/users/:id',
    isAuthenticated,
    hasRole(['admin']),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        
        // Empêcher la suppression de son propre compte
        if (userId === req.user!.id) {
          return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
        }

        // Vérifier si des entités dépendent de cet utilisateur (jobs, units, etc.)
        // Cette vérification varie selon votre modèle de données

        // Supprimer l'utilisateur
        // Note: implémentons cette méthode dans storage si elle n'existe pas
        const deleted = await storage.deleteUser(userId);
        
        res.json({ success: true, message: "Utilisateur supprimé avec succès" });
      } catch (error) {
        res.status(500).json({ message: "Impossible de supprimer l'utilisateur" });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
