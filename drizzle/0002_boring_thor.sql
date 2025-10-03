CREATE TABLE "recording" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"meetingId" uuid,
	"title" text NOT NULL,
	"description" text,
	"audioFileUrl" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "summary" DROP CONSTRAINT "summary_meetingId_meeting_id_fk";
--> statement-breakpoint
ALTER TABLE "transcript" DROP CONSTRAINT "transcript_meetingId_meeting_id_fk";
--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "recordingId" uuid;--> statement-breakpoint
ALTER TABLE "summary" ADD COLUMN "recordingId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "transcript" ADD COLUMN "recordingId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "recording" ADD CONSTRAINT "recording_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording" ADD CONSTRAINT "recording_meetingId_meeting_id_fk" FOREIGN KEY ("meetingId") REFERENCES "public"."meeting"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_recordingId_recording_id_fk" FOREIGN KEY ("recordingId") REFERENCES "public"."recording"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary" ADD CONSTRAINT "summary_recordingId_recording_id_fk" FOREIGN KEY ("recordingId") REFERENCES "public"."recording"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript" ADD CONSTRAINT "transcript_recordingId_recording_id_fk" FOREIGN KEY ("recordingId") REFERENCES "public"."recording"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" DROP COLUMN "audioFileUrl";--> statement-breakpoint
ALTER TABLE "meeting" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "summary" DROP COLUMN "meetingId";--> statement-breakpoint
ALTER TABLE "transcript" DROP COLUMN "meetingId";