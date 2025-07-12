CREATE TABLE "predictions" (
	"prediction_id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL,
	"replicate_id" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"output" text,
	"error" text,
	"model" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "predictions_replicate_id_unique" UNIQUE("replicate_id")
);
--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "prediction_id" integer;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_version_id_versions_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."versions"("version_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_prediction_id_predictions_prediction_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("prediction_id") ON DELETE no action ON UPDATE no action;