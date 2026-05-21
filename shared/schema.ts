import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for improved type safety
export const userRoleEnum = pgEnum("user_role", ["admin", "claim_agent", "technician", "service", "client", "financement"]);
export const jobTypeEnum = pgEnum("job_type", ["DAF", "PDI", "warranty", "extended_warranty", "insurance", "seasonal", "regular"]);
export const jobStatusEnum = pgEnum("job_status", ["scheduled", "in_progress", "awaiting_parts", "awaiting_approval", "completed"]);
export const claimStatusEnum = pgEnum("claim_status", ["pending", "approved", "rejected"]);
export const notificationTypeEnum = pgEnum("notification_type", ["claim", "job", "schedule", "system"]);
export const entityTypeEnum = pgEnum("entity_type", ["job", "unit", "claim"]);
export const chatTypeEnum = pgEnum("chat_type", ["internal", "client"]);
export const documentEntityTypeEnum = pgEnum("document_entity_type", ["unit", "client"]);

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull(),
  phone: text("phone"),
  workPhone: text("work_phone"),
  avatarUrl: text("avatar_url"),
  // Address
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  // Co-owner
  coOwnerFirstName: text("co_owner_first_name"),
  coOwnerLastName: text("co_owner_last_name"),
  coOwnerEmail: text("co_owner_email"),
  coOwnerPhone: text("co_owner_phone"),
  coOwnerWorkPhone: text("co_owner_work_phone"),
});

// User relations will be defined after all tables are declared

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true });

// Unit/RV Schema
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  vin: text("vin").notNull().unique(),
  shortVin: text("short_vin"),
  color: text("color"),
  clientId: integer("client_id").notNull().references(() => users.id),
  dateAdded: timestamp("date_added").notNull().defaultNow(),
  activationDate: timestamp("activation_date"),
  internalUnitNumber: text("internal_unit_number"),
  saleDate: timestamp("sale_date"),
  baseWarrantyDate: timestamp("base_warranty_date"),
  warrantyDate: timestamp("warranty_date"),
  extendedWarranty: boolean("extended_warranty").default(false),
  extendedWarrantyStart: timestamp("extended_warranty_start"),
  extendedWarrantyEnd: timestamp("extended_warranty_end"),
  notes: text("notes"),
});

export const insertUnitSchema = createInsertSchema(units)
  .omit({ id: true, dateAdded: true });

// Job Schema
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobNumber: text("job_number").notNull().unique(),
  unitId: integer("unit_id").notNull().references(() => units.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  type: jobTypeEnum("type").notNull(), // "DAF", "PDI", "warranty", "insurance", "seasonal", "regular"
  status: jobStatusEnum("status").notNull(), // "scheduled", "in_progress", "awaiting_parts", "awaiting_approval", "completed"
  description: text("description").notNull(),
  dateCreated: timestamp("date_created").notNull().defaultNow(),
  dateScheduled: timestamp("date_scheduled"),
  dateStarted: timestamp("date_started"),
  dateCompleted: timestamp("date_completed"),
  technicianId: integer("technician_id").references(() => users.id),
  notes: text("notes"),
  partsRequired: text("parts_required"),
  timeStart: text("time_start"),
  timeEnd: text("time_end"),
  clientVisible: boolean("client_visible").default(true),
});

export const insertJobSchema = createInsertSchema(jobs)
  .omit({ id: true, dateCreated: true, dateStarted: true, dateCompleted: true });

// Claim Schema
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  claimNumber: text("claim_number").notNull().unique(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  status: claimStatusEnum("status").notNull(), // "pending", "approved", "rejected"
  dateSubmitted: timestamp("date_submitted").notNull().defaultNow(),
  dateUpdated: timestamp("date_updated"),
  agentId: integer("agent_id").references(() => users.id),
  details: text("details"),
  clientVisible: boolean("client_visible").default(false),
});

export const insertClaimSchema = createInsertSchema(claims)
  .omit({ id: true, dateSubmitted: true, dateUpdated: true });

// Notification Schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(), // "claim", "job", "schedule", "system"
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of related entity (job, claim, etc.)
  dateCreated: timestamp("date_created").notNull().defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, dateCreated: true, isRead: true });

// Photos/Media Schema
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  entityType: entityTypeEnum("entity_type").notNull(), // "job", "unit", "claim"
  entityId: integer("entity_id").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  dateUploaded: timestamp("date_uploaded").notNull().defaultNow(),
  clientVisible: boolean("client_visible").default(true),
});

export const insertPhotoSchema = createInsertSchema(photos)
  .omit({ id: true, dateUploaded: true });

// Documents Schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  entityType: documentEntityTypeEnum("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  dateUploaded: timestamp("date_uploaded").notNull().defaultNow(),
  clientVisible: boolean("client_visible").default(false),
});

export const insertDocumentSchema = createInsertSchema(documents)
  .omit({ id: true, dateUploaded: true });

// Chat Rooms Schema
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: chatTypeEnum("type").notNull(), // "internal" ou "client"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => users.id), // Uniquement pour les chats de type "client"
  isActive: boolean("is_active").default(true),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms)
  .omit({ id: true, createdAt: true });

// Chat Messages Schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => chatRooms.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages)
  .omit({ id: true, sentAt: true, isRead: true });

// Chat Room Participants (Pour les chats internes)
export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => chatRooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants)
  .omit({ id: true, joinedAt: true });

// Define table relations
export const usersRelations = relations(users, ({ many }) => ({
  units: many(units, { relationName: "clientUnits" }),
  jobsAsClient: many(jobs, { relationName: "clientJobs" }),
  jobsAsTechnician: many(jobs, { relationName: "technicianJobs" }),
  claimsAsAgent: many(claims, { relationName: "agentClaims" }),
  notifications: many(notifications),
  uploadedPhotos: many(photos, { relationName: "uploaderPhotos" }),
  createdChatRooms: many(chatRooms, { relationName: "roomCreator" }),
  clientChats: many(chatRooms, { relationName: "clientChats" }),
  chatParticipations: many(chatParticipants, { relationName: "userParticipations" }),
  sentMessages: many(chatMessages, { relationName: "messageSender" }),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  client: one(users, {
    fields: [units.clientId],
    references: [users.id],
    relationName: "clientUnits"
  }),
  jobs: many(jobs),
  photos: many(photos, {
    relationName: "unitPhotos",
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(users, {
    fields: [jobs.clientId],
    references: [users.id],
    relationName: "clientJobs",
  }),
  technician: one(users, {
    fields: [jobs.technicianId],
    references: [users.id],
    relationName: "technicianJobs",
  }),
  unit: one(units, {
    fields: [jobs.unitId],
    references: [units.id],
  }),
  claims: many(claims),
  photos: many(photos, {
    relationName: "jobPhotos",
  }),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  job: one(jobs, {
    fields: [claims.jobId],
    references: [jobs.id],
  }),
  agent: one(users, {
    fields: [claims.agentId],
    references: [users.id],
    relationName: "agentClaims"
  }),
  photos: many(photos, {
    relationName: "claimPhotos",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  uploader: one(users, {
    fields: [photos.uploadedBy],
    references: [users.id],
    relationName: "uploaderPhotos"
  }),
}));

// Relations pour le chat
export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  creator: one(users, {
    fields: [chatRooms.createdBy],
    references: [users.id],
    relationName: "roomCreator"
  }),
  client: one(users, {
    fields: [chatRooms.clientId],
    references: [users.id],
    relationName: "clientChats"
  }),
  participants: many(chatParticipants),
  messages: many(chatMessages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatParticipants.roomId],
    references: [chatRooms.id]
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
    relationName: "userParticipations"
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id]
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id], 
    relationName: "messageSender"
  }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type DocumentFile = typeof documents.$inferSelect;
export type InsertDocumentFile = z.infer<typeof insertDocumentSchema>;

// Chat types
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
