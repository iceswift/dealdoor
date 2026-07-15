CREATE TABLE `notification_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`in_app_enabled` integer DEFAULT true,
	`deal_updates` integer DEFAULT true,
	`milestones` integer DEFAULT true,
	`reports` integer DEFAULT true,
	`system_updates` integer DEFAULT true,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
