CREATE TYPE "public"."plan" AS ENUM('trial', 'pro', 'premium');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'client', 'user');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"plan" "plan" DEFAULT 'trial',
	"is_active" boolean DEFAULT true NOT NULL,
	"trial_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
