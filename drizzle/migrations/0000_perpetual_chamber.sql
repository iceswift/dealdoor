CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`shop_id` text NOT NULL,
	`deal_id` text,
	`metadata` text,
	`ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `analytics_shop_idx` ON `analytics_events` (`shop_id`);--> statement-breakpoint
CREATE INDEX `analytics_type_idx` ON `analytics_events` (`type`);--> statement-breakpoint
CREATE INDEX `analytics_created_at_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `daily_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`date` text NOT NULL,
	`page_views` integer DEFAULT 0,
	`deal_views` integer DEFAULT 0,
	`deal_clicks` integer DEFAULT 0,
	`shares` integer DEFAULT 0,
	`contact_clicks` integer DEFAULT 0,
	`unique_visitors` integer DEFAULT 0,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `daily_stats_shop_date_idx` ON `daily_stats` (`shop_id`,`date`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`short_description` text,
	`discount_text` text,
	`conditions` text,
	`coupon_code` text,
	`claim_type` text NOT NULL,
	`image_url` text,
	`start_date` integer,
	`end_date` integer NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `deals_shop_idx` ON `deals` (`shop_id`);--> statement-breakpoint
CREATE INDEX `deals_active_idx` ON `deals` (`is_active`,`end_date`);--> statement-breakpoint
CREATE INDEX `deals_category_idx` ON `deals` (`category`);--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`price` real,
	`description` text,
	`image_url` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `menu_items_shop_idx` ON `menu_items` (`shop_id`);--> statement-breakpoint
CREATE TABLE `merchants` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_email_unique` ON `merchants` (`email`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`shop_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`read` integer DEFAULT false,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_shop_idx` ON `notifications` (`shop_id`);--> statement-breakpoint
CREATE INDEX `notifications_read_idx` ON `notifications` (`read`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending',
	`reviewed_by` text,
	`reviewed_at` integer,
	`resolution` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `reports_target_idx` ON `reports` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `shop_special_hours` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`date` text NOT NULL,
	`is_closed` integer DEFAULT false,
	`open_time` text,
	`close_time` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `shop_special_hours_shop_date_idx` ON `shop_special_hours` (`shop_id`,`date`);--> statement-breakpoint
CREATE INDEX `shop_special_hours_shop_idx` ON `shop_special_hours` (`shop_id`);--> statement-breakpoint
CREATE TABLE `shops` (
	`id` text PRIMARY KEY NOT NULL,
	`merchant_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`cover_image` text,
	`logo_image` text,
	`address` text,
	`latitude` real,
	`longitude` real,
	`phone` text,
	`line_id` text,
	`facebook_url` text,
	`instagram_url` text,
	`tiktok_url` text,
	`website_url` text,
	`opening_hours` text,
	`is_open` integer DEFAULT true,
	`vacation_mode` integer DEFAULT false,
	`vacation_message` text,
	`vacation_until` integer,
	`tier` text DEFAULT 'free',
	`max_active_deals` integer DEFAULT 6,
	`accepts_prompt_pay` integer DEFAULT false,
	`accepts_cash` integer DEFAULT true,
	`accepts_credit_card` integer DEFAULT false,
	`accepts_true_money` integer DEFAULT false,
	`accepts_rabbit_line_pay` integer DEFAULT false,
	`payment_notes` text,
	`wheelchair_accessible` integer DEFAULT false,
	`stroller_accessible` integer DEFAULT false,
	`senior_friendly_restroom` integer DEFAULT false,
	`elevator_available` integer DEFAULT false,
	`braille_menu` integer DEFAULT false,
	`accessibility_notes` text,
	`free_parking` integer DEFAULT false,
	`paid_parking` integer DEFAULT false,
	`motorcycle_parking` integer DEFAULT false,
	`ev_charging` integer DEFAULT false,
	`nearby_bts` text,
	`nearby_mrt` text,
	`parking_notes` text,
	`pet_friendly` integer DEFAULT false,
	`pet_menu` integer DEFAULT false,
	`pet_water_bowl` integer DEFAULT false,
	`pet_notes` text,
	`kids_menu` integer DEFAULT false,
	`high_chairs` integer DEFAULT false,
	`play_area` integer DEFAULT false,
	`baby_changing` integer DEFAULT false,
	`family_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shops_slug_unique` ON `shops` (`slug`);--> statement-breakpoint
CREATE INDEX `shops_slug_idx` ON `shops` (`slug`);--> statement-breakpoint
CREATE INDEX `shops_category_idx` ON `shops` (`category`);--> statement-breakpoint
CREATE INDEX `shops_merchant_idx` ON `shops` (`merchant_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'merchant',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);