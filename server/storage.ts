import { 
  users, type User, type InsertUser,
  units, type Unit, type InsertUnit,
  jobs, type Job, type InsertJob,
  claims, type Claim, type InsertClaim,
  notifications, type Notification, type InsertNotification,
  photos, type Photo, type InsertPhoto,
  chatRooms, type ChatRoom, type InsertChatRoom,
  chatMessages, type ChatMessage, type InsertChatMessage,
  chatParticipants, type ChatParticipant, type InsertChatParticipant
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Unit methods
  getUnit(id: number): Promise<Unit | undefined>;
  getUnits(): Promise<Unit[]>;
  getUnitsByClient(clientId: number): Promise<Unit[]>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: number, unit: Partial<Unit>): Promise<Unit | undefined>;
  deleteUnit(id: number): Promise<void>;
  getJobsByUnit(unitId: number): Promise<Job[]>;
  
  // Job methods
  getJob(id: number): Promise<Job | undefined>;
  getJobs(): Promise<Job[]>;
  getJobsByClient(clientId: number): Promise<Job[]>;
  getJobsByTechnician(technicianId: number): Promise<Job[]>;
  getJobsByStatus(status: string): Promise<Job[]>;
  getJobsByType(type: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<Job>): Promise<Job | undefined>;
  
  // Claim methods
  getClaim(id: number): Promise<Claim | undefined>;
  getClaims(): Promise<Claim[]>;
  getClaimsByJob(jobId: number): Promise<Claim[]>;
  getClaimsByStatus(status: string): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: number, claim: Partial<Claim>): Promise<Claim | undefined>;
  
  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  getNotifications(): Promise<Notification[]>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Photo methods
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByEntity(entityType: string, entityId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhotoVisibility(id: number, clientVisible: boolean): Promise<Photo | undefined>;
  
  // Chat Room methods
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  getChatRooms(): Promise<ChatRoom[]>;
  getChatRoomsByType(type: string): Promise<ChatRoom[]>;
  getChatRoomsByUser(userId: number): Promise<ChatRoom[]>; // Rooms where user is participant
  getChatRoomsByCreator(creatorId: number): Promise<ChatRoom[]>;
  getChatRoomsByClient(clientId: number): Promise<ChatRoom[]>; // Client chat rooms
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  updateChatRoom(id: number, chatRoom: Partial<ChatRoom>): Promise<ChatRoom | undefined>;
  
  // Chat Message methods
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesByRoom(roomId: number): Promise<ChatMessage[]>;
  getChatMessagesBySender(senderId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markChatMessagesAsRead(roomId: number, userId: number): Promise<void>;
  
  // Chat Participant methods
  getChatParticipant(id: number): Promise<ChatParticipant | undefined>;
  getChatParticipantsByRoom(roomId: number): Promise<ChatParticipant[]>;
  getChatParticipantsByUser(userId: number): Promise<ChatParticipant[]>;
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  removeChatParticipant(roomId: number, userId: number): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private units: Map<number, Unit>;
  private jobs: Map<number, Job>;
  private claims: Map<number, Claim>;
  private notifications: Map<number, Notification>;
  private photos: Map<number, Photo>;
  private chatRooms: Map<number, ChatRoom>;
  private chatMessages: Map<number, ChatMessage>;
  private chatParticipants: Map<number, ChatParticipant>;
  
  private userIdCounter: number;
  private unitIdCounter: number;
  private jobIdCounter: number;
  private claimIdCounter: number;
  private notificationIdCounter: number;
  private photoIdCounter: number;
  private chatRoomIdCounter: number;
  private chatMessageIdCounter: number;
  private chatParticipantIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.units = new Map();
    this.jobs = new Map();
    this.claims = new Map();
    this.notifications = new Map();
    this.photos = new Map();
    this.chatRooms = new Map();
    this.chatMessages = new Map();
    this.chatParticipants = new Map();
    
    this.userIdCounter = 1;
    this.unitIdCounter = 1;
    this.jobIdCounter = 1;
    this.claimIdCounter = 1;
    this.notificationIdCounter = 1;
    this.photoIdCounter = 1;
    this.chatRoomIdCounter = 1;
    this.chatMessageIdCounter = 1;
    this.chatParticipantIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
    
    // Don't create default users here as passwords need to be hashed
    // Default users will be created in routes.ts
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User> {
    const existingUser = await this.getUser(id);
    
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Create updated user by merging existing data with updates
    const updatedUser = { ...existingUser, ...userUpdate };
    
    // Save back to storage
    this.users.set(id, updatedUser);
    
    // For debugging
    console.log(`User ${id} updated:`, updatedUser);
    
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Vérifier si l'utilisateur existe
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    
    // Vérifier les dépendances (jobs, unités, etc.)
    // Dans un environnement de production, nous pourrions vouloir vérifier 
    // si l'utilisateur est associé à des jobs, des unités, etc. et empêcher la suppression
    // ou effectuer des actions de nettoyage
    
    // Supprimer l'utilisateur
    return this.users.delete(id);
  }

  // Unit methods
  async getUnit(id: number): Promise<Unit | undefined> {
    return this.units.get(id);
  }
  
  async getUnits(): Promise<Unit[]> {
    return Array.from(this.units.values());
  }
  
  async getUnitsByClient(clientId: number): Promise<Unit[]> {
    return Array.from(this.units.values()).filter(unit => unit.clientId === clientId);
  }
  
  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const id = this.unitIdCounter++;
    const unit: Unit = { 
      ...insertUnit, 
      id, 
      dateAdded: new Date(), 
      photos: [] 
    };
    this.units.set(id, unit);
    return unit;
  }
  
  async updateUnit(id: number, unitUpdate: Partial<Unit>): Promise<Unit | undefined> {
    const unit = this.units.get(id);
    if (!unit) return undefined;
    
    const updatedUnit = { ...unit, ...unitUpdate };
    this.units.set(id, updatedUnit);
    return updatedUnit;
  }
  
  async deleteUnit(id: number): Promise<void> {
    // Check if the unit exists
    if (!this.units.has(id)) {
      throw new Error("Véhicule non trouvé");
    }
    
    // Delete the unit
    this.units.delete(id);
  }
  
  async getJobsByUnit(unitId: number): Promise<Job[]> {
    // Return all jobs associated with a specific unit
    return Array.from(this.jobs.values()).filter(job => job.unitId === unitId);
  }

  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }
  
  async getJobsByClient(clientId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.clientId === clientId);
  }
  
  async getJobsByTechnician(technicianId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.technicianId === technicianId);
  }
  
  async getJobsByStatus(status: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }
  
  async getJobsByType(type: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.type === type);
  }
  
  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    // Generate job number
    const jobNumber = `JOB-${new Date().getFullYear()}-${id.toString().padStart(4, '0')}`;
    
    const job: Job = {
      ...insertJob,
      id,
      jobNumber,
      dateCreated: new Date(),
      dateStarted: null,
      dateCompleted: null,
      photos: []
    };
    this.jobs.set(id, job);
    return job;
  }
  
  async updateJob(id: number, jobUpdate: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...jobUpdate };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  // Claim methods
  async getClaim(id: number): Promise<Claim | undefined> {
    return this.claims.get(id);
  }
  
  async getClaims(): Promise<Claim[]> {
    return Array.from(this.claims.values());
  }
  
  async getClaimsByJob(jobId: number): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(claim => claim.jobId === jobId);
  }
  
  async getClaimsByStatus(status: string): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(claim => claim.status === status);
  }
  
  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    const id = this.claimIdCounter++;
    // Generate claim number
    const claimNumber = `WC-${10000 + id}`;
    
    const claim: Claim = {
      ...insertClaim,
      id,
      claimNumber,
      dateSubmitted: new Date(),
      dateUpdated: null,
      photos: []
    };
    this.claims.set(id, claim);
    return claim;
  }
  
  async updateClaim(id: number, claimUpdate: Partial<Claim>): Promise<Claim | undefined> {
    const claim = this.claims.get(id);
    if (!claim) return undefined;
    
    const updatedClaim = { 
      ...claim, 
      ...claimUpdate,
      dateUpdated: new Date()
    };
    this.claims.set(id, updatedClaim);
    return updatedClaim;
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async getNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values());
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime()); // Sort by newest first
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const notification: Notification = {
      ...insertNotification,
      id,
      dateCreated: new Date(),
      isRead: false
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.userId === userId) {
        this.notifications.set(id, { ...notification, isRead: true });
      }
    }
  }

  // Photo methods
  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }
  
  async getPhotosByEntity(entityType: string, entityId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.entityType === entityType && photo.entityId === entityId);
  }
  
  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.photoIdCounter++;
    const photo: Photo = {
      ...insertPhoto,
      id,
      dateUploaded: new Date()
    };
    this.photos.set(id, photo);
    
    // Also add to the related entity
    if (photo.entityType === 'unit') {
      const unit = this.units.get(photo.entityId);
      if (unit) {
        const updatedPhotos = [...unit.photos, { id: photo.id, url: photo.url }];
        this.units.set(unit.id, { ...unit, photos: updatedPhotos });
      }
    } else if (photo.entityType === 'job') {
      const job = this.jobs.get(photo.entityId);
      if (job) {
        const updatedPhotos = [...job.photos, { id: photo.id, url: photo.url }];
        this.jobs.set(job.id, { ...job, photos: updatedPhotos });
      }
    } else if (photo.entityType === 'claim') {
      const claim = this.claims.get(photo.entityId);
      if (claim) {
        const updatedPhotos = [...claim.photos, { id: photo.id, url: photo.url }];
        this.claims.set(claim.id, { ...claim, photos: updatedPhotos });
      }
    }
    
    return photo;
  }
  
  async updatePhotoVisibility(id: number, clientVisible: boolean): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    
    const updatedPhoto = { ...photo, clientVisible };
    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }

  // Chat Room methods
  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values());
  }

  async getChatRoomsByType(type: string): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values()).filter(room => room.type === type);
  }

  async getChatRoomsByUser(userId: number): Promise<ChatRoom[]> {
    const participations = Array.from(this.chatParticipants.values())
      .filter(p => p.userId === userId && p.isActive);
    
    return Promise.all(participations.map(p => this.getChatRoom(p.roomId)))
      .then(rooms => rooms.filter(room => room !== undefined) as ChatRoom[]);
  }

  async getChatRoomsByCreator(creatorId: number): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values())
      .filter(room => room.createdBy === creatorId);
  }

  async getChatRoomsByClient(clientId: number): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values())
      .filter(room => room.clientId === clientId && room.type === 'client');
  }

  async createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom> {
    const id = this.chatRoomIdCounter++;
    const now = new Date();

    const newRoom: ChatRoom = {
      ...chatRoom,
      id,
      createdAt: now,
      isActive: true
    };

    this.chatRooms.set(id, newRoom);
    return newRoom;
  }

  async updateChatRoom(id: number, chatRoomUpdate: Partial<ChatRoom>): Promise<ChatRoom | undefined> {
    const room = this.chatRooms.get(id);
    if (!room) {
      return undefined;
    }

    const updatedRoom = {
      ...room,
      ...chatRoomUpdate
    };

    this.chatRooms.set(id, updatedRoom);
    return updatedRoom;
  }

  // Chat Message methods
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }

  async getChatMessagesByRoom(roomId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.roomId === roomId)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }

  async getChatMessagesBySender(senderId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.senderId === senderId);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const now = new Date();

    const newMessage: ChatMessage = {
      ...message,
      id,
      sentAt: now,
      isRead: false
    };

    this.chatMessages.set(id, newMessage);
    return newMessage;
  }

  async markChatMessagesAsRead(roomId: number, userId: number): Promise<void> {
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.roomId === roomId && message.senderId !== userId && !message.isRead);
    
    messages.forEach(message => {
      const updatedMessage = { ...message, isRead: true };
      this.chatMessages.set(message.id, updatedMessage);
    });
  }

  // Chat Participant methods
  async getChatParticipant(id: number): Promise<ChatParticipant | undefined> {
    return this.chatParticipants.get(id);
  }

  async getChatParticipantsByRoom(roomId: number): Promise<ChatParticipant[]> {
    return Array.from(this.chatParticipants.values())
      .filter(participant => participant.roomId === roomId && participant.isActive);
  }

  async getChatParticipantsByUser(userId: number): Promise<ChatParticipant[]> {
    return Array.from(this.chatParticipants.values())
      .filter(participant => participant.userId === userId && participant.isActive);
  }

  async addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const id = this.chatParticipantIdCounter++;
    const now = new Date();

    const newParticipant: ChatParticipant = {
      ...participant,
      id,
      joinedAt: now,
      isActive: true
    };

    this.chatParticipants.set(id, newParticipant);
    return newParticipant;
  }

  async removeChatParticipant(roomId: number, userId: number): Promise<void> {
    const participant = Array.from(this.chatParticipants.values())
      .find(p => p.roomId === roomId && p.userId === userId && p.isActive);
    
    if (participant) {
      const updatedParticipant = {
        ...participant,
        isActive: false
      };
      this.chatParticipants.set(participant.id, updatedParticipant);
    }
  }
}

// Import the DatabaseStorage class
import { DatabaseStorage } from "./database-storage";

export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
