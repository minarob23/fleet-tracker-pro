-- Add Telegram support to trucks table
-- Migration: Add telegram_user_id and tracking_method fields

-- Add telegram_user_id column
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS telegram_user_id VARCHAR(50);

-- Add tracking_method column
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS tracking_method VARCHAR(20) DEFAULT 'web';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trucks_telegram_user_id 
ON trucks(telegram_user_id);

-- Add comment
COMMENT ON COLUMN trucks.telegram_user_id IS 'Telegram user ID for bot integration';
COMMENT ON COLUMN trucks.tracking_method IS 'GPS tracking method: web, telegram, whatsapp, or app';

-- Update existing trucks to have 'web' as default tracking method
UPDATE trucks 
SET tracking_method = 'web' 
WHERE tracking_method IS NULL;
