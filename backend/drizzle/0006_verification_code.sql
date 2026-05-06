ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_token";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_code" varchar(6);
