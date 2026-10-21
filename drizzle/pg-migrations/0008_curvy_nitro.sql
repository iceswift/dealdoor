CREATE TABLE "boost_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"deal_id" text NOT NULL,
	"created_by_user_id" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"credit_source" text NOT NULL,
	"credits_reserved" integer NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"stopped_at" timestamp,
	"stop_reason" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boost_credit_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text,
	"provider_reference" text,
	"currency" text DEFAULT 'THB' NOT NULL,
	"amount_minor" integer NOT NULL,
	"credit_quantity" integer NOT NULL,
	"expires_at" timestamp,
	"paid_at" timestamp,
	"metadata" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boost_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"shop_id" text NOT NULL,
	"campaign_id" text,
	"order_id" text,
	"type" text NOT NULL,
	"credit_source" text NOT NULL,
	"credit_delta" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"idempotency_key" text,
	"expires_at" timestamp,
	"metadata" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boost_wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"included_credits_balance" integer DEFAULT 0 NOT NULL,
	"purchased_credits_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boost_campaigns" ADD CONSTRAINT "boost_campaigns_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_campaigns" ADD CONSTRAINT "boost_campaigns_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_campaigns" ADD CONSTRAINT "boost_campaigns_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_credit_orders" ADD CONSTRAINT "boost_credit_orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_transactions" ADD CONSTRAINT "boost_transactions_wallet_id_boost_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."boost_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_transactions" ADD CONSTRAINT "boost_transactions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_transactions" ADD CONSTRAINT "boost_transactions_campaign_id_boost_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."boost_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_transactions" ADD CONSTRAINT "boost_transactions_order_id_boost_credit_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."boost_credit_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_wallets" ADD CONSTRAINT "boost_wallets_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "boost_campaigns_shop_status_end_idx" ON "boost_campaigns" USING btree ("shop_id","status","ends_at");--> statement-breakpoint
CREATE INDEX "boost_campaigns_deal_status_end_idx" ON "boost_campaigns" USING btree ("deal_id","status","ends_at");--> statement-breakpoint
CREATE INDEX "boost_credit_orders_shop_status_created_idx" ON "boost_credit_orders" USING btree ("shop_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "boost_credit_orders_provider_reference_unique" ON "boost_credit_orders" USING btree ("provider","provider_reference");--> statement-breakpoint
CREATE INDEX "boost_transactions_wallet_created_idx" ON "boost_transactions" USING btree ("wallet_id","created_at");--> statement-breakpoint
CREATE INDEX "boost_transactions_shop_created_idx" ON "boost_transactions" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "boost_transactions_campaign_created_idx" ON "boost_transactions" USING btree ("campaign_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "boost_transactions_idempotency_key_unique" ON "boost_transactions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "boost_wallets_shop_unique" ON "boost_wallets" USING btree ("shop_id");