-- Update email_done table to include incoming_email_id field
ALTER TABLE `email_done` 
ADD COLUMN `incoming_email_id` int NULL AFTER `category`,
ADD INDEX `idx_incoming_email_id` (`incoming_email_id`);

-- This will allow us to track which emails from incoming_emails have been processed
-- and avoid processing the same email multiple times 