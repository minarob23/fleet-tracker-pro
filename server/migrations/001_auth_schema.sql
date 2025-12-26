-- Authentication and User Management Schema
-- Migration 001: Create users table with role-based access control

-- Create role enum type
CREATE TYPE user_role AS ENUM ('admin', 'central_office', 'city_staff', 'supplier');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  full_name VARCHAR(255),
  
  -- Role-specific fields
  city VARCHAR(100), -- For city_staff: 'Laayoune', 'Dakhla', 'Smara', 'Guelmim'
  supplier_name VARCHAR(100), -- For suppliers: 'SNTL CASA', 'SNTL AGADIR', 'COSUMAR', 'LESIEUR-CRISTAL'
  product_types TEXT[], -- For suppliers: ['flour'], ['sugar'], ['oil']
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_city ON users(city) WHERE city IS NOT NULL;
CREATE INDEX idx_users_supplier ON users(supplier_name) WHERE supplier_name IS NOT NULL;

-- Insert default users based on the permissions matrix
INSERT INTO users (email, password_hash, role, full_name, city, supplier_name, product_types) VALUES
  -- Admin
  ('admin@gmail.com', '$2b$10$placeholder_hash_admin', 'admin', 'Administrator', NULL, NULL, NULL),
  
  -- Central Office (ONICL)
  ('onicl-saps@gmail.com', '$2b$10$placeholder_hash_saps2026', 'central_office', 'ONICL Central - GPS Monitoring', NULL, 'RABAT', NULL),
  
  -- Flour Suppliers
  ('farine-casa@gmail.com', '$2b$10$placeholder_hash_farineca026', 'supplier', 'SNTL Casa', NULL, 'SNTL CASA', ARRAY['flour']),
  ('farine-agadir@gmail.com', '$2b$10$placeholder_hash_farinea2026', 'supplier', 'SNTL Agadir', NULL, 'SNTL AGADIR', ARRAY['flour']),
  
  -- Sugar Supplier
  ('cosumar@gmail.com', '$2b$10$placeholder_hash_cosumar2026', 'supplier', 'COSUMAR', NULL, 'COSUMAR', ARRAY['sugar']),
  
  -- Oil Supplier
  ('huile@gmail.com', '$2b$10$placeholder_hash_huile2026', 'supplier', 'LESIEUR-CRISTAL', NULL, 'LESIEUR-CRISTAL', ARRAY['oil']),
  
  -- City Staff
  ('se-laayoune@gmail.com', '$2b$10$placeholder_hash_l70000', 'city_staff', 'SE Laayoune', 'Laayoune', NULL, NULL),
  ('se-essmara@gmail.com', '$2b$10$placeholder_hash_e72000', 'city_staff', 'SE Smara', 'Smara', NULL, NULL),
  ('se-dakhla@gmail.com', '$2b$10$placeholder_hash_d73000', 'city_staff', 'SE Dakhla', 'Dakhla', NULL, NULL),
  ('se-guelmim@gmail.com', '$2b$10$placeholder_hash_g81000', 'city_staff', 'SE Guelmim', 'Guelmim', NULL, NULL);

-- Create sessions table for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Create notifications log table
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'sms'
  recipient VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_truck_id ON notifications_log(truck_id);
CREATE INDEX idx_notifications_status ON notifications_log(status);
CREATE INDEX idx_notifications_created_at ON notifications_log(created_at);
