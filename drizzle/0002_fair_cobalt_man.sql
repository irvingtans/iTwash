CREATE INDEX `idx_jobs_plate_lookup` ON `jobs` (UPPER(REPLACE("plate",' ','')));
