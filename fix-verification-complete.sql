-- Drop and recreate verification table with proper default
DROP TABLE IF EXISTS "verification" CASCADE;

CREATE TABLE "verification" (
  "id" text PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
