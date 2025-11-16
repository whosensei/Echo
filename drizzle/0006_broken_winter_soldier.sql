ALTER TABLE "recording" ADD COLUMN "isEncrypted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recording" ADD COLUMN "encryptionIV" text;--> statement-breakpoint
ALTER TABLE "recording" ADD COLUMN "encryptionSalt" text;