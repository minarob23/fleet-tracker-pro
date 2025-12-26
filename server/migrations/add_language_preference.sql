-- Add language preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'ar';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_language ON users(preferred_language);

-- Update existing users to have default language
UPDATE users SET preferred_language = 'ar' WHERE preferred_language IS NULL;
