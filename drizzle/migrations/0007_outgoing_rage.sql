ALTER TABLE `deals` ADD `redemption_availability_display` text DEFAULT 'low_stock' NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `low_stock_threshold` integer DEFAULT 10 NOT NULL;