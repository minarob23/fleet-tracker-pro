-- Telegram Bot Security System
-- Migration: Add security tables for whitelist, invitation codes, and pending approvals

-- Table 1: Whitelist for admins (instant access)
CREATE TABLE IF NOT EXISTS telegram_whitelist (
    id SERIAL PRIMARY KEY,
    telegram_user_id VARCHAR(50) UNIQUE NOT NULL,
    user_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    added_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Invitation codes for drivers (24-hour validity, single-use)
CREATE TABLE IF NOT EXISTS telegram_invitation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    telegram_user_id VARCHAR(50),
    driver_name VARCHAR(255),
    truck_id INTEGER,
    created_by VARCHAR(50),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: Pending approvals for emergency access
CREATE TABLE IF NOT EXISTS telegram_pending_approvals (
    id SERIAL PRIMARY KEY,
    telegram_user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255),
    request_message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_whitelist_user_id 
ON telegram_whitelist(telegram_user_id);

CREATE INDEX IF NOT EXISTS idx_invitation_codes_code 
ON telegram_invitation_codes(code);

CREATE INDEX IF NOT EXISTS idx_invitation_codes_used 
ON telegram_invitation_codes(is_used, expires_at);

CREATE INDEX IF NOT EXISTS idx_pending_approvals_status 
ON telegram_pending_approvals(status);

-- Comments
COMMENT ON TABLE telegram_whitelist IS 'Whitelisted users with instant access to Telegram bot';
COMMENT ON TABLE telegram_invitation_codes IS 'Single-use invitation codes for driver registration';
COMMENT ON TABLE telegram_pending_approvals IS 'Pending access requests requiring manual approval';

-- Insert default admin (you can add your Telegram user ID here)
-- INSERT INTO telegram_whitelist (telegram_user_id, user_name, role, added_by)
-- VALUES ('YOUR_TELEGRAM_USER_ID', 'Admin', 'admin', 'system')
-- ON CONFLICT (telegram_user_id) DO NOTHING;
