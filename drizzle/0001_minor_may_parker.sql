CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "chats" (
	"chat_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(200),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"subscription" varchar(100),
	"credits_left" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "versions" (
	"version_id" serial PRIMARY KEY NOT NULL,
	"chat_id" integer NOT NULL,
	"version_num" integer NOT NULL,
	"prompt" text,
	"settings" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "images" DROP CONSTRAINT "images_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "image_id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "version_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "chat_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "image_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "model" varchar(100);--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "visibility" "visibility" DEFAULT 'private';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar(255);--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versions" ADD CONSTRAINT "versions_chat_id_chats_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("chat_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_version_id_versions_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."versions"("version_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_chat_id_chats_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("chat_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");