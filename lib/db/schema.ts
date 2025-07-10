import { pgTable, serial, text, timestamp, varchar, integer, pgEnum, boolean} from 'drizzle-orm/pg-core';

// Enum for image visibility
export const visibilityEnum = pgEnum('visibility', ['public', 'private']);

//users

export const user = pgTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
});

export const session = pgTable("session", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
});


// Chats table
export const chats = pgTable('chats', {
  chatID: serial('chat_id').primaryKey(),
  userID: text('user_id').references(() => user.id).notNull(),
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
  userID: text('user_id').references(() => user.id).notNull(),
  chatID: integer('chat_id').references(() => chats.chatID).notNull(),
  imageUrl: text('image_url').notNull(),
  prompt: text('prompt'), // Cached from version
  model: varchar('model', { length: 100 }),
  visibility: visibilityEnum('visibility').default('private'),
  createdAt: timestamp('created_at').defaultNow(),
});

// // Type exports for TypeScript
// export type User = typeof users.$inferSelect;
// export type NewUser = typeof users.$inferInsert;

// export type Chat = typeof chats.$inferSelect;
// export type NewChat = typeof chats.$inferInsert;

// export type Version = typeof versions.$inferSelect;
// export type NewVersion = typeof versions.$inferInsert;

// export type Image = typeof images.$inferSelect;
// export type NewImage = typeof images.$inferInsert;
