CREATE TABLE `pin_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `jobs` ADD `group_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `estimated_at` integer;--> statement-breakpoint
ALTER TABLE `jobs` ADD `amount` integer;--> statement-breakpoint
ALTER TABLE `jobs` ADD `paid_at` integer;--> statement-breakpoint
ALTER TABLE `jobs` ADD `payment_method` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_jobs_group` ON `jobs` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_jobs_phone` ON `jobs` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_jobs_paid_at` ON `jobs` (`paid_at`);