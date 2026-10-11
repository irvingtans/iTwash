CREATE TABLE `job_edits` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`scope` text NOT NULL,
	`before` text NOT NULL,
	`after` text NOT NULL,
	`reason` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_job_edits_job` ON `job_edits` (`job_id`,`created`);--> statement-breakpoint
ALTER TABLE `employees` ADD `pay_type` text DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `monthly_rate` integer DEFAULT 0 NOT NULL;