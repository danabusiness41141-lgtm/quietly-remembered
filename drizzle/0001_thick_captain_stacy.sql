CREATE TABLE `noteReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noteId` int NOT NULL,
	`reaction` varchar(32) NOT NULL DEFAULT 'remembered',
	`reactorKeyHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `noteReactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `note_reactions_unique_idx` UNIQUE(`noteId`,`reaction`,`reactorKeyHash`)
);
--> statement-breakpoint
CREATE TABLE `noteReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noteId` int NOT NULL,
	`reason` enum('spam','harassment','private','impersonation','other') NOT NULL,
	`explanation` text,
	`status` enum('open','reviewed','resolved') NOT NULL DEFAULT 'open',
	`reporterKeyHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `noteReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `remembranceNotes` MODIFY COLUMN `status` enum('published','deleted') NOT NULL DEFAULT 'published';--> statement-breakpoint
ALTER TABLE `remembranceNotes` ADD `manageTokenHash` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `remembranceNotes` ADD `scheduledPublishAt` timestamp;--> statement-breakpoint
ALTER TABLE `remembranceNotes` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `remembranceNotes` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `remembranceNotes` ADD CONSTRAINT `remembranceNotes_manageTokenHash_unique` UNIQUE(`manageTokenHash`);--> statement-breakpoint
CREATE INDEX `note_reactions_note_idx` ON `noteReactions` (`noteId`);--> statement-breakpoint
CREATE INDEX `reports_note_status_idx` ON `noteReports` (`noteId`,`status`);--> statement-breakpoint
CREATE INDEX `reports_reporter_idx` ON `noteReports` (`reporterKeyHash`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notes_status_created_idx` ON `remembranceNotes` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notes_schedule_idx` ON `remembranceNotes` (`scheduleCronTaskUid`);