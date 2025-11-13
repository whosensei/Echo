import { pgTable, text, timestamp, uuid, integer, jsonb, boolean, varchar, real, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - managed by Better Auth
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Sessions table - managed by Better Auth
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Accounts table - for OAuth providers (Better Auth)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Verification table - for email verification (Better Auth)
export const verification = pgTable("verification", {
  id: text("id").primaryKey().$defaultFn(() => `${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Meetings table - stores meeting information from calendar
export const meeting = pgTable("meeting", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  calendarEventId: text("calendarEventId"), // Google Calendar event ID
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Recordings table - stores audio recordings and transcriptions
export const recording = pgTable("recording", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  meetingId: uuid("meetingId")
    .references(() => meeting.id, { onDelete: "set null" }), // Optional: link to calendar meeting
  title: text("title").notNull(),
  description: text("description"),
  audioFileUrl: text("audioFileUrl").notNull(), // Path to audio file
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  recordedAt: timestamp("recordedAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Transcripts table - stores meeting transcriptions
export const transcript = pgTable("transcript", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordingId: uuid("recordingId")
    .notNull()
    .references(() => recording.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  language: text("language"),
  speakerCount: integer("speakerCount"),
  duration: integer("duration"), // in seconds
  confidence: integer("confidence"), // 0-100
  metadata: jsonb("metadata"), // Additional data like speaker diarization
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Summaries table - stores AI-generated summaries
export const summary = pgTable("summary", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordingId: uuid("recordingId")
    .notNull()
    .references(() => recording.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  actionPoints: jsonb("actionPoints"), // Array of action items
  keyTopics: jsonb("keyTopics"), // Array of key topics discussed
  participants: jsonb("participants"), // Array of participant names/info
  sentiment: text("sentiment"), // overall, positive, negative, neutral
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Email logs table - tracks sent emails
export const emailLog = pgTable("email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meetingId")
    .references(() => meeting.id, { onDelete: "cascade" }),
  recordingId: uuid("recordingId")
    .references(() => recording.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recipientEmail: text("recipientEmail").notNull(),
  subject: text("subject").notNull(),
  type: text("type").notNull(), // transcript, summary, action_points
  status: text("status").notNull().default("pending"), // pending, sent, failed
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// User settings table - stores user preferences
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  gmailEnabled: boolean("gmailEnabled").notNull().default(false),
  calendarEnabled: boolean("calendarEnabled").notNull().default(false),
  emailNotifications: boolean("emailNotifications").notNull().default(true),
  autoSyncCalendar: boolean("autoSyncCalendar").notNull().default(false),
  defaultEmailRecipients: jsonb("defaultEmailRecipients"), // Array of default email addresses
  settings: jsonb("settings"), // Additional custom settings
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// API Keys table - stores user API keys (encrypted)
export const apiKey = pgTable("api_key", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull(), // Encrypted API key
  provider: text("provider").notNull(), // assemblyai, openai, gemini, etc.
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Chat Sessions table - stores chat conversation threads
export const chatSession = pgTable("chat_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  model: text("model").notNull().default("gpt-4o"), // AI model being used
  systemPrompt: text("systemPrompt"), // Custom system prompt
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Chat Messages table - stores individual messages in chat sessions
export const chatMessage = pgTable("chat_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("sessionId")
    .notNull()
    .references(() => chatSession.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // tokens, model info, etc.
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Chat Attachments table - links transcripts/recordings to chat sessions
export const chatAttachment = pgTable("chat_attachment", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("sessionId")
    .notNull()
    .references(() => chatSession.id, { onDelete: "cascade" }),
  recordingId: uuid("recordingId")
    .references(() => recording.id, { onDelete: "cascade" }),
  attachedAt: timestamp("attachedAt").notNull().defaultNow(),
});

// Dodo Payments Subscriptions table - stores subscription data from Dodo Payments
export const subscription = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  dodoCustomerId: text("dodoCustomerId").notNull(), // Dodo customer ID
  dodoSubscriptionId: text("dodoSubscriptionId").notNull().unique(), // Dodo subscription ID
  productId: text("productId").notNull(), // Dodo product ID (pro/enterprise)
  plan: text("plan").notNull(), // "free" | "pro" | "enterprise"
  status: text("status").notNull().default("inactive"), // active, trialing, on_hold, cancelled, expired, inactive
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  canceledAt: timestamp("canceledAt"),
  metadata: jsonb("metadata"), // Store full Dodo subscription object for reference
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Dodo Payments Webhook Events table - logs all webhook events for audit trail
export const webhookEvent = pgTable("webhook_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("eventId").notNull().unique(), // Dodo event ID (for idempotency)
  eventType: text("eventType").notNull(), // subscription.active, payment.succeeded, etc.
  dodoCustomerId: text("dodoCustomerId"), // Associated customer ID if available
  dodoSubscriptionId: text("dodoSubscriptionId"), // Associated subscription ID if available
  payload: jsonb("payload").notNull(), // Full webhook payload
  processed: boolean("processed").notNull().default(false), // Whether we successfully processed it
  processedAt: timestamp("processedAt"),
  errorMessage: text("errorMessage"), // Error if processing failed
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Usage tracking table - tracks user usage per billing period
export const usage = pgTable("usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  periodStart: timestamp("periodStart").notNull(), // Subscription period start
  periodEnd: timestamp("periodEnd").notNull(), // Subscription period end
  transcriptionMinutes: real("transcriptionMinutes").notNull().default(0), // Accumulated transcription minutes
  aiTokens: integer("aiTokens").notNull().default(0), // Accumulated AI tokens
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint on userId + periodStart to prevent duplicates
  uniqueUserPeriod: unique().on(table.userId, table.periodStart),
}));

// Relations
export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  meetings: many(meeting),
  recordings: many(recording),
  emailLogs: many(emailLog),
  settings: one(userSettings),
  apiKeys: many(apiKey),
  chatSessions: many(chatSession),
  subscriptions: many(subscription),
  usage: many(usage),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const meetingRelations = relations(meeting, ({ one, many }) => ({
  user: one(user, {
    fields: [meeting.userId],
    references: [user.id],
  }),
  recordings: many(recording),
  emailLogs: many(emailLog),
}));

export const recordingRelations = relations(recording, ({ one, many }) => ({
  user: one(user, {
    fields: [recording.userId],
    references: [user.id],
  }),
  meeting: one(meeting, {
    fields: [recording.meetingId],
    references: [meeting.id],
  }),
  transcript: one(transcript),
  summary: one(summary),
  emailLogs: many(emailLog),
  chatAttachments: many(chatAttachment),
}));

export const transcriptRelations = relations(transcript, ({ one }) => ({
  recording: one(recording, {
    fields: [transcript.recordingId],
    references: [recording.id],
  }),
}));

export const summaryRelations = relations(summary, ({ one }) => ({
  recording: one(recording, {
    fields: [summary.recordingId],
    references: [recording.id],
  }),
}));

export const emailLogRelations = relations(emailLog, ({ one }) => ({
  meeting: one(meeting, {
    fields: [emailLog.meetingId],
    references: [meeting.id],
  }),
  recording: one(recording, {
    fields: [emailLog.recordingId],
    references: [recording.id],
  }),
  user: one(user, {
    fields: [emailLog.userId],
    references: [user.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
}));

export const chatSessionRelations = relations(chatSession, ({ one, many }) => ({
  user: one(user, {
    fields: [chatSession.userId],
    references: [user.id],
  }),
  messages: many(chatMessage),
  attachments: many(chatAttachment),
}));

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  session: one(chatSession, {
    fields: [chatMessage.sessionId],
    references: [chatSession.id],
  }),
}));

export const chatAttachmentRelations = relations(chatAttachment, ({ one }) => ({
  session: one(chatSession, {
    fields: [chatAttachment.sessionId],
    references: [chatSession.id],
  }),
  recording: one(recording, {
    fields: [chatAttachment.recordingId],
    references: [recording.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}));

export const usageRelations = relations(usage, ({ one }) => ({
  user: one(user, {
    fields: [usage.userId],
    references: [user.id],
  }),
}));

// Type exports for TypeScript
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Meeting = typeof meeting.$inferSelect;
export type NewMeeting = typeof meeting.$inferInsert;

export type Recording = typeof recording.$inferSelect;
export type NewRecording = typeof recording.$inferInsert;

export type Transcript = typeof transcript.$inferSelect;
export type NewTranscript = typeof transcript.$inferInsert;

export type Summary = typeof summary.$inferSelect;
export type NewSummary = typeof summary.$inferInsert;

export type EmailLog = typeof emailLog.$inferSelect;
export type NewEmailLog = typeof emailLog.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export type ApiKey = typeof apiKey.$inferSelect;
export type NewApiKey = typeof apiKey.$inferInsert;

export type ChatSession = typeof chatSession.$inferSelect;
export type NewChatSession = typeof chatSession.$inferInsert;

export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;

export type ChatAttachment = typeof chatAttachment.$inferSelect;
export type NewChatAttachment = typeof chatAttachment.$inferInsert;

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;

export type WebhookEvent = typeof webhookEvent.$inferSelect;
export type NewWebhookEvent = typeof webhookEvent.$inferInsert;

export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
