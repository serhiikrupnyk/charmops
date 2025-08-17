CREATE TYPE "public"."platform" AS ENUM('sofiadate', 'sakuradate');--> statement-breakpoint
CREATE TABLE "operator_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ping_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_stats_daily" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"replies" integer DEFAULT 0,
	"avg_reply_sec" integer DEFAULT 0,
	"reply_rate_pct" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" "platform" NOT NULL,
	"login" varchar(255) NOT NULL,
	"password_enc" varchar(2048) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"locale" varchar(16) DEFAULT 'en',
	"avatar_url" varchar(1024),
	"status" varchar(32) DEFAULT 'active',
	"assigned_operator_id" integer,
	"created_by_user_id" integer NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "operator_activity" ADD CONSTRAINT "operator_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_stats_daily" ADD CONSTRAINT "operator_stats_daily_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_assigned_operator_id_users_id_fk" FOREIGN KEY ("assigned_operator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "operator_activity_user_idx" ON "operator_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "operator_activity_ping_idx" ON "operator_activity" USING btree ("ping_at");--> statement-breakpoint
CREATE INDEX "operator_stats_user_date_idx" ON "operator_stats_daily" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "profiles_login_idx" ON "profiles" USING btree ("login");--> statement-breakpoint
CREATE INDEX "profiles_operator_idx" ON "profiles" USING btree ("assigned_operator_id");--> statement-breakpoint
CREATE INDEX "profiles_platform_idx" ON "profiles" USING btree ("platform");