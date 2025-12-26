-- Add user preferences for WhatsApp tracking
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'ar';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS preferred_theme VARCHAR(10) DEFAULT 'light';

-- Update existing records to have default values
UPDATE trucks SET preferred_language = 'ar' WHERE preferred_language IS NULL;
UPDATE trucks SET preferred_theme = 'light' WHERE preferred_theme IS NULL;
