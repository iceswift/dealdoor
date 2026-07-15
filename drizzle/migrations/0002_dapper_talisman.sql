CREATE TABLE `job_locks` (
	`name` text PRIMARY KEY NOT NULL,
	`owner_token` text NOT NULL,
	`locked_until` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`duration_ms` integer,
	`output` text,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `job_runs_name_started_idx` ON `job_runs` (`name`,`started_at`);--> statement-breakpoint
CREATE INDEX `job_runs_status_started_idx` ON `job_runs` (`status`,`started_at`);