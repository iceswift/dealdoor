CREATE TABLE "notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"in_app_enabled" boolean DEFAULT true,
	"deal_updates" boolean DEFAULT true,
	"milestones" boolean DEFAULT true,
	"reports" boolean DEFAULT true,
	"system_updates" boolean DEFAULT true,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;