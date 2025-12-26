-- Fix GPS Coordinate Precision
-- Migration 006: Update latitude and longitude columns to support proper GPS coordinates
-- The current NUMERIC(5,2) can only store values from -999.99 to 999.99
-- GPS coordinates need NUMERIC(10,7) to store values like -180.0000000 to 180.0000000

-- Alter latitude column to support proper GPS coordinates
ALTER TABLE trucks 
ALTER COLUMN latitude TYPE NUMERIC(10, 7) USING latitude::NUMERIC(10, 7);

-- Alter longitude column to support proper GPS coordinates
ALTER TABLE trucks 
ALTER COLUMN longitude TYPE NUMERIC(10, 7) USING longitude::NUMERIC(10, 7);

-- Alter speed column to support larger values (can exceed 999 during GPS jumps)
ALTER TABLE trucks 
ALTER COLUMN speed TYPE NUMERIC(6, 2) USING speed::NUMERIC(6, 2);

-- Add comments for documentation
COMMENT ON COLUMN trucks.latitude IS 'GPS latitude coordinate (NUMERIC(10,7) supports -90 to 90 with 7 decimal places)';
COMMENT ON COLUMN trucks.longitude IS 'GPS longitude coordinate (NUMERIC(10,7) supports -180 to 180 with 7 decimal places)';
COMMENT ON COLUMN trucks.speed IS 'Speed in km/h (NUMERIC(6,2) supports up to 9999.99 km/h)';

