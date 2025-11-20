CREATE TABLE `crm_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`next_retry_at` integer,
	`last_error` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processed_at` integer,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `magic_link_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `magic_link_tokens_token_unique` ON `magic_link_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`fingerprint` text NOT NULL,
	`calculator_data` text NOT NULL,
	`total_price` real NOT NULL,
	`currency` text DEFAULT 'HUF' NOT NULL,
	`breakdown` text,
	`name` text,
	`email` text,
	`phone` text,
	`language` text DEFAULT 'en' NOT NULL,
	`ip_address` text,
	`ip_address_hash` text,
	`country` text,
	`city` text,
	`device` text,
	`user_agent` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`utm_term` text,
	`utm_content` text,
	`gclid` text,
	`status` text DEFAULT 'new' NOT NULL,
	`crm_synced` integer DEFAULT false NOT NULL,
	`crm_id` text,
	`crm_synced_at` integer,
	`crm_sync_attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_fingerprint_unique` ON `quotes` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `fingerprint_idx` ON `quotes` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `quotes` (`created_at`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `quotes` (`status`);--> statement-breakpoint
CREATE INDEX `crm_synced_idx` ON `quotes` (`crm_synced`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `quotes` (`email`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`role` text,
	`content` text NOT NULL,
	`rating` integer NOT NULL,
	`image` text,
	`pages` text,
	`featured` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);