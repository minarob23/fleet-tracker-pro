-- GPS Device and Location Tracking Schema
-- Migration 002: Create GPS devices and location history tables

-- Create GPS devices table
CREATE TABLE IF NOT EXISTS gps_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(100) UNIQUE NOT NULL, -- External GPS device identifier
  device_type VARCHAR(50), -- 'teltonika', 'queclink', 'concox', 'smartphone'
  imei VARCHAR(50),
  phone_number VARCHAR(20),
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_ping TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gps_devices_device_id ON gps_devices(device_id);
CREATE INDEX idx_gps_devices_truck_id ON gps_devices(truck_id);
CREATE INDEX idx_gps_devices_active ON gps_devices(is_active);

-- Create GPS location history table
CREATE TABLE IF NOT EXISTS gps_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(100) NOT NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  heading DECIMAL(5, 2), -- Direction in degrees (0-360)
  altitude DECIMAL(8, 2), -- Meters above sea level
  accuracy DECIMAL(6, 2), -- GPS accuracy in meters
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gps_locations_device_id ON gps_locations(device_id);
CREATE INDEX idx_gps_locations_truck_id ON gps_locations(truck_id);
CREATE INDEX idx_gps_locations_timestamp ON gps_locations(timestamp);

-- Create GPS webhook log for debugging
CREATE TABLE IF NOT EXISTS gps_webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(100),
  payload JSONB NOT NULL,
  headers JSONB,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gps_webhooks_device_id ON gps_webhooks_log(device_id);
CREATE INDEX idx_gps_webhooks_processed ON gps_webhooks_log(processed);
CREATE INDEX idx_gps_webhooks_created_at ON gps_webhooks_log(created_at);

-- Create city and warehouse geofences
CREATE TABLE IF NOT EXISTS city_geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL, -- Radius in meters
  geofence_type VARCHAR(50) NOT NULL, -- 'city_boundary', 'warehouse'
  color VARCHAR(10) DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_city_geofences_city ON city_geofences(city_name);
CREATE INDEX idx_city_geofences_type ON city_geofences(geofence_type);

-- Insert default city geofences (placeholder coordinates - to be updated)
INSERT INTO city_geofences (city_name, latitude, longitude, radius, geofence_type, color) VALUES
  -- City boundaries (approximate coordinates - need real data)
  ('Laayoune', 27.1536, -13.2033, 15000, 'city_boundary', '#3b82f6'),
  ('Dakhla', 23.7185, -15.9582, 12000, 'city_boundary', '#10b981'),
  ('Smara', 26.7386, -11.6719, 10000, 'city_boundary', '#f59e0b'),
  ('Guelmim', 28.9870, -10.0574, 10000, 'city_boundary', '#8b5cf6'),
  
  -- Warehouse locations (placeholder - need real coordinates)
  ('Laayoune', 27.1500, -13.2000, 500, 'warehouse', '#ef4444'),
  ('Dakhla', 23.7150, -15.9500, 500, 'warehouse', '#ef4444'),
  ('Smara', 26.7350, -11.6700, 500, 'warehouse', '#ef4444'),
  ('Guelmim', 28.9850, -10.0550, 500, 'warehouse', '#ef4444');
