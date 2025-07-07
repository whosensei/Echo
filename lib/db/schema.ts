import { pgTable, serial, text, timestamp, varchar, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enum for image visibility
export const visibilityEnum = pgEnum('visibility', ['public', 'private']);

// Users table
export const users = pgTable('users', {
  userID: serial('user_id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
});

// Chats table
export const chats = pgTable('chats', {
  chatID: serial('chat_id').primaryKey(),
  userID: integer('user_id').references(() => users.userID).notNull(),
  title: varchar('title', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Versions table
export const versions = pgTable('versions', {
  versionID: serial('version_id').primaryKey(),
  chatID: integer('chat_id').references(() => chats.chatID).notNull(),
  versionNum: integer('version_num').notNull(),
  prompt: text('prompt'),
  settings: text('settings'), // JSON string for settings
  createdAt: timestamp('created_at').defaultNow(),
});

// Images table
export const images = pgTable('images', {
  imageID: serial('image_id').primaryKey(),
  versionID: integer('version_id').references(() => versions.versionID).notNull(),
  userID: integer('user_id').references(() => users.userID).notNull(),
  chatID: integer('chat_id').references(() => chats.chatID).notNull(),
  imageUrl: text('image_url').notNull(),
  prompt: text('prompt'), // Cached from version
  model: varchar('model', { length: 100 }),
  visibility: visibilityEnum('visibility').default('private'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  userID: integer('user_id').references(() => users.userID).primaryKey(),
  subscription: varchar('subscription', { length: 100 }),
  creditsLeft: integer('credits_left').default(0),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;

export type Version = typeof versions.$inferSelect;
export type NewVersion = typeof versions.$inferInsert;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
