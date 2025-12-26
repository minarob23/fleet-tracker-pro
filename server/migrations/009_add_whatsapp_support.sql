-- Add WhatsApp support to trucks table
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS whatsapp_user_id VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trucks_whatsapp_user_id ON trucks(whatsapp_user_id);

-- Create WhatsApp user preferences table (similar to Telegram)
CREATE TABLE IF NOT EXISTS whatsapp_user_preferences (
    whatsapp_user_id VARCHAR(50) PRIMARY KEY,
    preferred_language VARCHAR(5) DEFAULT 'ar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for language lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_prefs_language ON whatsapp_user_preferences(preferred_language);

-- Create WhatsApp security tables
CREATE TABLE IF NOT EXISTS whatsapp_whitelist (
    id SERIAL PRIMARY KEY,
    whatsapp_user_id VARCHAR(50) UNIQUE NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS whatsapp_invitation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    driver_name VARCHAR(255),
    truck_id INTEGER REFERENCES trucks(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by VARCHAR(50),
    used_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_pending_approvals (
    id SERIAL PRIMARY KEY,
    whatsapp_user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    request_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_whitelist_user ON whatsapp_whitelist(whatsapp_user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_code ON whatsapp_invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_used ON whatsapp_invitation_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_whatsapp_approvals_status ON whatsapp_pending_approvals(status);

-- Comments
COMMENT ON TABLE whatsapp_user_preferences IS 'User language preferences for WhatsApp bot';
COMMENT ON TABLE whatsapp_whitelist IS 'Pre-approved WhatsApp users with instant access';
COMMENT ON TABLE whatsapp_invitation_codes IS 'One-time invitation codes for new drivers';
COMMENT ON TABLE whatsapp_pending_approvals IS 'Pending access requests requiring manager approval';
COMMENT ON COLUMN trucks.whatsapp_user_id IS 'WhatsApp phone number in international format (e.g., +212612345678)';
