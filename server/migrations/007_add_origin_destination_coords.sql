-- Add origin and destination coordinate columns to trucks table
-- Migration: 007_add_origin_destination_coords.sql

-- Add origin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trucks' AND column_name = 'origin') THEN
        ALTER TABLE trucks ADD COLUMN origin TEXT;
    END IF;
END $$;

-- Add origin_latitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trucks' AND column_name = 'origin_latitude') THEN
        ALTER TABLE trucks ADD COLUMN origin_latitude NUMERIC(10,7);
    END IF;
END $$;

-- Add origin_longitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trucks' AND column_name = 'origin_longitude') THEN
        ALTER TABLE trucks ADD COLUMN origin_longitude NUMERIC(10,7);
    END IF;
END $$;

-- Add destination_latitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trucks' AND column_name = 'destination_latitude') THEN
        ALTER TABLE trucks ADD COLUMN destination_latitude NUMERIC(10,7);
    END IF;
END $$;

-- Add destination_longitude column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trucks' AND column_name = 'destination_longitude') THEN
        ALTER TABLE trucks ADD COLUMN destination_longitude NUMERIC(10,7);
    END IF;
END $$;

-- Create index on destination coordinates for faster queries
CREATE INDEX IF NOT EXISTS idx_trucks_destination_coords 
ON trucks(destination_latitude, destination_longitude);

-- Create index on origin coordinates for faster queries
CREATE INDEX IF NOT EXISTS idx_trucks_origin_coords 
ON trucks(origin_latitude, origin_longitude);
