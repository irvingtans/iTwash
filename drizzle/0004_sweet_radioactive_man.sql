CREATE TABLE `pin_settings` (
	`scope` text PRIMARY KEY NOT NULL,
	`pin_hash` text NOT NULL,
	`salt` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `jobs` ADD `voided_at` integer;--> statement-breakpoint
ALTER TABLE `jobs` ADD `void_reason` text DEFAULT '' NOT NULL;