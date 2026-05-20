import { db } from "./db";
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
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";
import { eq, and, desc } from "drizzle-orm";

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

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    if (!result[0]) throw new Error(`User with ID ${id} not found`);
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
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

  // Chat Room methods
  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const result = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return result[0];
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms);
  }

  async getChatRoomsByType(type: string): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms).where(eq(chatRooms.type, type as any));
  }

  async getChatRoomsByUser(userId: number): Promise<ChatRoom[]> {
    const participations = await db.select()
      .from(chatParticipants)
      .where(and(eq(chatParticipants.userId, userId), eq(chatParticipants.isActive, true)));

    const roomIds = participations.map(p => p.roomId);
    if (roomIds.length === 0) return [];

    const rooms: ChatRoom[] = [];
    for (const roomId of roomIds) {
      const room = await this.getChatRoom(roomId);
      if (room) rooms.push(room);
    }
    return rooms;
  }

  async getChatRoomsByCreator(creatorId: number): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms).where(eq(chatRooms.createdBy, creatorId));
  }

  async getChatRoomsByClient(clientId: number): Promise<ChatRoom[]> {
    return await db.select()
      .from(chatRooms)
      .where(and(eq(chatRooms.clientId, clientId), eq(chatRooms.type, "client")));
  }

  async createChatRoom(insertRoom: InsertChatRoom): Promise<ChatRoom> {
    const result = await db.insert(chatRooms).values(insertRoom).returning();
    return result[0];
  }

  async updateChatRoom(id: number, chatRoomUpdate: Partial<ChatRoom>): Promise<ChatRoom | undefined> {
    const result = await db.update(chatRooms)
      .set(chatRoomUpdate)
      .where(eq(chatRooms.id, id))
      .returning();
    return result[0];
  }

  // Chat Message methods
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const result = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return result[0];
  }

  async getChatMessagesByRoom(roomId: number): Promise<ChatMessage[]> {
    return await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(chatMessages.sentAt);
  }

  async getChatMessagesBySender(senderId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.senderId, senderId));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async markChatMessagesAsRead(roomId: number, userId: number): Promise<void> {
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.roomId, roomId),
          eq(chatMessages.isRead, false)
        )
      );
  }

  // Chat Participant methods
  async getChatParticipant(id: number): Promise<ChatParticipant | undefined> {
    const result = await db.select().from(chatParticipants).where(eq(chatParticipants.id, id));
    return result[0];
  }

  async getChatParticipantsByRoom(roomId: number): Promise<ChatParticipant[]> {
    return await db.select()
      .from(chatParticipants)
      .where(and(eq(chatParticipants.roomId, roomId), eq(chatParticipants.isActive, true)));
  }

  async getChatParticipantsByUser(userId: number): Promise<ChatParticipant[]> {
    return await db.select()
      .from(chatParticipants)
      .where(and(eq(chatParticipants.userId, userId), eq(chatParticipants.isActive, true)));
  }

  async addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const result = await db.insert(chatParticipants).values(participant).returning();
    return result[0];
  }

  async removeChatParticipant(roomId: number, userId: number): Promise<void> {
    await db.update(chatParticipants)
      .set({ isActive: false })
      .where(
        and(
          eq(chatParticipants.roomId, roomId),
          eq(chatParticipants.userId, userId)
        )
      );
  }
}
