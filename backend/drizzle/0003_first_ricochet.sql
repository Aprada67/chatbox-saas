ALTER TABLE "chatbots" ADD COLUMN "language" varchar(5) DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" varchar(100);