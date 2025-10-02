-- Fix verification table to allow default ID generation
ALTER TABLE "verification" ALTER COLUMN "id" DROP NOT NULL;
ALTER TABLE "verification" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "verification" ALTER COLUMN "id" SET NOT NULL;
