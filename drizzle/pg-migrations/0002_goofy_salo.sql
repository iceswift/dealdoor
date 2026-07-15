CREATE TABLE "job_locks" (
	"name" text PRIMARY KEY NOT NULL,
	"owner_token" text NOT NULL,
	"locked_until" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"duration_ms" integer,
	"output" text,
	"error" text
);
--> statement-breakpoint
CREATE INDEX "job_runs_name_started_idx" ON "job_runs" USING btree ("name","started_at");--> statement-breakpoint
CREATE INDEX "job_runs_status_started_idx" ON "job_runs" USING btree ("status","started_at");