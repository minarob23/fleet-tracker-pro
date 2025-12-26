-- Add language preference for Telegram users
CREATE TABLE IF NOT EXISTS telegram_user_preferences (
    telegram_user_id VARCHAR(50) PRIMARY KEY,
    preferred_language VARCHAR(5) DEFAULT 'ar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_prefs_language ON telegram_user_preferences(preferred_language);
