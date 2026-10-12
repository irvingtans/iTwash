CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`detail` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
DROP INDEX `idx_salaries_employee_week`;--> statement-breakpoint
ALTER TABLE `salaries` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `salaries` ADD `delete_reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_salaries_employee_week` ON `salaries` (`employee_id`,`week`) WHERE "salaries"."deleted_at" IS NULL;