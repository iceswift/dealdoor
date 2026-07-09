CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"shop_id" text NOT NULL,
	"deal_id" text,
	"metadata" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"date" text NOT NULL,
	"page_views" integer DEFAULT 0,
	"deal_views" integer DEFAULT 0,
	"deal_clicks" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"contact_clicks" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"short_description" text,
	"discount_text" text,
	"conditions" text,
	"coupon_code" text,
	"claim_type" text NOT NULL,
	"image_url" text,
	"start_date" timestamp,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"name" text NOT NULL,
	"price" double precision,
	"description" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "merchants_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"shop_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" text,
	"read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_id" text,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"resolution" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_special_hours" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"date" text NOT NULL,
	"is_closed" boolean DEFAULT false,
	"open_time" text,
	"close_time" text,
	"note" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"cover_image" text,
	"logo_image" text,
	"address" text,
	"latitude" double precision,
	"longitude" double precision,
	"phone" text,
	"line_id" text,
	"facebook_url" text,
	"instagram_url" text,
	"tiktok_url" text,
	"website_url" text,
	"opening_hours" text,
	"is_open" boolean DEFAULT true,
	"vacation_mode" boolean DEFAULT false,
	"vacation_message" text,
	"vacation_until" timestamp,
	"tier" text DEFAULT 'free',
	"max_active_deals" integer DEFAULT 6,
	"accepts_prompt_pay" boolean DEFAULT false,
	"accepts_cash" boolean DEFAULT true,
	"accepts_credit_card" boolean DEFAULT false,
	"accepts_true_money" boolean DEFAULT false,
	"accepts_rabbit_line_pay" boolean DEFAULT false,
	"payment_notes" text,
	"wheelchair_accessible" boolean DEFAULT false,
	"stroller_accessible" boolean DEFAULT false,
	"senior_friendly_restroom" boolean DEFAULT false,
	"elevator_available" boolean DEFAULT false,
	"braille_menu" boolean DEFAULT false,
	"accessibility_notes" text,
	"free_parking" boolean DEFAULT false,
	"paid_parking" boolean DEFAULT false,
	"motorcycle_parking" boolean DEFAULT false,
	"ev_charging" boolean DEFAULT false,
	"nearby_bts" text,
	"nearby_mrt" text,
	"parking_notes" text,
	"pet_friendly" boolean DEFAULT false,
	"pet_menu" boolean DEFAULT false,
	"pet_water_bowl" boolean DEFAULT false,
	"pet_notes" text,
	"kids_menu" boolean DEFAULT false,
	"high_chairs" boolean DEFAULT false,
	"play_area" boolean DEFAULT false,
	"baby_changing" boolean DEFAULT false,
	"family_notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'merchant',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_special_hours" ADD CONSTRAINT "shop_special_hours_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_shop_idx" ON "analytics_events" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "analytics_type_idx" ON "analytics_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "analytics_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "daily_stats_shop_date_idx" ON "daily_stats" USING btree ("shop_id","date");--> statement-breakpoint
CREATE INDEX "deals_shop_idx" ON "deals" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "deals_active_idx" ON "deals" USING btree ("is_active","end_date");--> statement-breakpoint
CREATE INDEX "deals_category_idx" ON "deals" USING btree ("category");--> statement-breakpoint
CREATE INDEX "menu_items_shop_idx" ON "menu_items" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_shop_idx" ON "notifications" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","read","created_at");--> statement-breakpoint
CREATE INDEX "notifications_shop_read_created_idx" ON "notifications" USING btree ("shop_id","read","created_at");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_target_idx" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "shop_special_hours_shop_date_idx" ON "shop_special_hours" USING btree ("shop_id","date");--> statement-breakpoint
CREATE INDEX "shop_special_hours_shop_idx" ON "shop_special_hours" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shops_slug_idx" ON "shops" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "shops_category_idx" ON "shops" USING btree ("category");--> statement-breakpoint
CREATE INDEX "shops_merchant_idx" ON "shops" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");