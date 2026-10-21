CREATE TABLE `boost_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`deal_id` text NOT NULL,
	`created_by_user_id` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`credit_source` text NOT NULL,
	`credits_reserved` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`stopped_at` integer,
	`stop_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `boost_campaigns_shop_status_end_idx` ON `boost_campaigns` (`shop_id`,`status`,`ends_at`);--> statement-breakpoint
CREATE INDEX `boost_campaigns_deal_status_end_idx` ON `boost_campaigns` (`deal_id`,`status`,`ends_at`);--> statement-breakpoint
CREATE TABLE `boost_credit_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider` text,
	`provider_reference` text,
	`currency` text DEFAULT 'THB' NOT NULL,
	`amount_minor` integer NOT NULL,
	`credit_quantity` integer NOT NULL,
	`expires_at` integer,
	`paid_at` integer,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `boost_credit_orders_shop_status_created_idx` ON `boost_credit_orders` (`shop_id`,`status`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `boost_credit_orders_provider_reference_unique` ON `boost_credit_orders` (`provider`,`provider_reference`);--> statement-breakpoint
CREATE TABLE `boost_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`campaign_id` text,
	`order_id` text,
	`type` text NOT NULL,
	`credit_source` text NOT NULL,
	`credit_delta` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`idempotency_key` text,
	`expires_at` integer,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wallet_id`) REFERENCES `boost_wallets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campaign_id`) REFERENCES `boost_campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `boost_credit_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `boost_transactions_wallet_created_idx` ON `boost_transactions` (`wallet_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `boost_transactions_shop_created_idx` ON `boost_transactions` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `boost_transactions_campaign_created_idx` ON `boost_transactions` (`campaign_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `boost_transactions_idempotency_key_unique` ON `boost_transactions` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `boost_wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`included_credits_balance` integer DEFAULT 0 NOT NULL,
	`purchased_credits_balance` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `boost_wallets_shop_unique` ON `boost_wallets` (`shop_id`);