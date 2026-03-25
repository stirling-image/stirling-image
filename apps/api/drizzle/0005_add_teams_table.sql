-- Create teams table
CREATE TABLE IF NOT EXISTS `teams` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX IF NOT EXISTS `teams_name_unique` ON `teams` (`name`);

-- Seed Default team with a known UUID
INSERT OR IGNORE INTO `teams` (`id`, `name`, `created_at`) VALUES ('default-team-00000000', 'Default', unixepoch());

-- Migrate existing users: for each distinct team value, create a team if it doesn't exist
INSERT OR IGNORE INTO `teams` (`id`, `name`, `created_at`)
  SELECT lower(hex(randomblob(16))), `team`, unixepoch()
  FROM `users`
  WHERE `team` != 'Default'
  GROUP BY `team`;

-- Update users to reference team IDs instead of team names
UPDATE `users` SET `team` = (
  SELECT `id` FROM `teams` WHERE `teams`.`name` = `users`.`team`
) WHERE EXISTS (
  SELECT 1 FROM `teams` WHERE `teams`.`name` = `users`.`team`
);
