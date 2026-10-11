CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bank` text NOT NULL,
	`account` text NOT NULL,
	`rate` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `salaries` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`week` text NOT NULL,
	`date` text NOT NULL,
	`detail` text NOT NULL,
	`total` integer NOT NULL,
	`paid_at` integer,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_salaries_paid` ON `salaries` (`paid_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_salaries_employee_week` ON `salaries` (`employee_id`,`week`);