CREATE TABLE "operator_presence" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"last_ping" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "operator_presence" ADD CONSTRAINT "operator_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;