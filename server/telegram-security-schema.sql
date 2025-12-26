-- Telegram Bot Security Tables

-- Table for invite codes
CREATE TABLE IF NOT EXISTS telegram_invites (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_by BIGINT,
  used_at TIMESTAMP
);

-- Table for authorized users
CREATE TABLE IF NOT EXISTS telegram_users (
  chat_id BIGINT PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  username VARCHAR(100),
  first_name VARCHAR(100),
  authorized BOOLEAN DEFAULT false,
  authorization_method VARCHAR(20), -- 'invite_code', 'admin_approval', 'whitelist'
  authorized_at TIMESTAMP,
  authorized_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_invites_code ON telegram_invites(code);
CREATE INDEX IF NOT EXISTS idx_telegram_invites_used ON telegram_invites(used, expires_at);
CREATE INDEX IF NOT EXISTS idx_telegram_users_device ON telegram_users(device_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_authorized ON telegram_users(authorized);

-- Sample data (optional)
-- INSERT INTO telegram_invites (code, device_id, created_by, expires_at) 
-- VALUES ('QT-SAMPLE-ABC123', 'GPS001', 'admin', NOW() + INTERVAL '24 hours');
