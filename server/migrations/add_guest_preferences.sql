-- Create guest preferences table for storing language preferences for non-authenticated users
CREATE TABLE IF NOT EXISTS guest_preferences (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  preferred_language VARCHAR(5) DEFAULT 'ar',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guest_session ON guest_preferences(session_id);

-- Create cleanup function to remove old sessions (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_guest_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM guest_preferences 
  WHERE last_accessed < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup daily
-- This depends on your PostgreSQL setup (pg_cron extension or external scheduler)
-- Example with pg_cron:
-- SELECT cron.schedule('cleanup-guest-sessions', '0 2 * * *', 'SELECT cleanup_old_guest_sessions()');

COMMENT ON TABLE guest_preferences IS 'Stores language preferences for guest users using session IDs';
COMMENT ON COLUMN guest_preferences.session_id IS 'Unique session identifier stored in browser cookie';
COMMENT ON COLUMN guest_preferences.preferred_language IS 'User preferred language (ar or fr)';
COMMENT ON COLUMN guest_preferences.last_accessed IS 'Last time this session was accessed, used for cleanup';
