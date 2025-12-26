-- Add WhatsApp tracking status fields
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS whatsapp_tracking_active BOOLEAN DEFAULT FALSE;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS whatsapp_tracking_started_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trucks_whatsapp_tracking ON trucks(whatsapp_tracking_token) WHERE whatsapp_tracking_active = TRUE;
