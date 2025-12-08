import { db } from "./db";
import {
  users, type User, type InsertUser,
  units, type Unit, type InsertUnit,
  jobs, type Job, type InsertJob,
  claims, type Claim, type InsertClaim,
  notifications, type Notification, type InsertNotification,
  photos, type Photo, type InsertPhoto
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";
import { eq, and, desc } from "drizzle-orm";

// Create a PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  // Unit methods
  async getUnit(id: number): Promise<Unit | undefined> {
    const result = await db.select().from(units).where(eq(units.id, id));
    return result[0];
  }

  async getUnits(): Promise<Unit[]> {
    return await db.select().from(units);
  }

  async getUnitsByClient(clientId: number): Promise<Unit[]> {
    return await db.select().from(units).where(eq(units.clientId, clientId));
  }

  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const result = await db.insert(units).values(insertUnit).returning();
    return result[0];
  }

  async updateUnit(id: number, unitUpdate: Partial<Unit>): Promise<Unit | undefined> {
    const result = await db.update(units)
      .set(unitUpdate)
      .where(eq(units.id, id))
      .returning();
    return result[0];
  }
  
  async deleteUnit(id: number): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }
  
  async getJobsByUnit(unitId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.unitId, unitId));
  }

  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result[0];
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJobsByClient(clientId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.clientId, clientId));
  }

  async getJobsByTechnician(technicianId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.technicianId, technicianId));
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.status, status as any));
  }

  async getJobsByType(type: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.type, type as any));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(insertJob).returning();
    return result[0];
  }

  async updateJob(id: number, jobUpdate: Partial<Job>): Promise<Job | undefined> {
    const result = await db.update(jobs)
      .set(jobUpdate)
      .where(eq(jobs.id, id))
      .returning();
    return result[0];
  }

  // Claim methods
  async getClaim(id: number): Promise<Claim | undefined> {
    const result = await db.select().from(claims).where(eq(claims.id, id));
    return result[0];
  }

  async getClaims(): Promise<Claim[]> {
    return await db.select().from(claims);
  }

  async getClaimsByJob(jobId: number): Promise<Claim[]> {
    return await db.select().from(claims).where(eq(claims.jobId, jobId));
  }

  async getClaimsByStatus(status: string): Promise<Claim[]> {
    return await db.select().from(claims).where(eq(claims.status, status as any));
  }

  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    const result = await db.insert(claims).values(insertClaim).returning();
    return result[0];
  }

  async updateClaim(id: number, claimUpdate: Partial<Claim>): Promise<Claim | undefined> {
    const result = await db.update(claims)
      .set(claimUpdate)
      .where(eq(claims.id, id))
      .returning();
    return result[0];
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id));
    return result[0];
  }

  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.dateCreated));
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.dateCreated));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Photo methods
  async getPhoto(id: number): Promise<Photo | undefined> {
    const result = await db.select().from(photos).where(eq(photos.id, id));
    return result[0];
  }

  async getPhotosByEntity(entityType: string, entityId: number): Promise<Photo[]> {
    return await db.select()
      .from(photos)
      .where(
        and(
          eq(photos.entityType, entityType as any),
          eq(photos.entityId, entityId)
        )
      );
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const result = await db.insert(photos).values(insertPhoto).returning();
    return result[0];
  }

  async updatePhotoVisibility(id: number, clientVisible: boolean): Promise<Photo | undefined> {
    const result = await db.update(photos)
      .set({ clientVisible })
      .where(eq(photos.id, id))
      .returning();
    return result[0];
  }
}