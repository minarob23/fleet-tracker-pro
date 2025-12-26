-- Add WhatsApp tracking token columns
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS whatsapp_tracking_token VARCHAR(100);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS whatsapp_tracking_token_created TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trucks_whatsapp_token ON trucks(whatsapp_tracking_token);

COMMENT ON COLUMN trucks.whatsapp_tracking_token IS 'Unique token for WhatsApp tracking link';
COMMENT ON COLUMN trucks.whatsapp_tracking_token_created IS 'When the tracking token was created';
