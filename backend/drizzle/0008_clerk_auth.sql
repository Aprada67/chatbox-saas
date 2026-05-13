ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_id" varchar(100) UNIQUE;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_token";
ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_expires";
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_code";
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_expires";
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified";
