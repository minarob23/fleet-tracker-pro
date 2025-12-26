-- Update Trucks Table Schema
-- Migration 003: Add new fields for role-based access and tracking

-- Add new fields to trucks table
ALTER TABLE trucks 
  ADD COLUMN IF NOT EXISTS bon_livraison VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS product_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS product_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS checked_by UUID,
  ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_checked BOOLEAN DEFAULT false;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trucks_supplier_id_fkey'
  ) THEN
    ALTER TABLE trucks ADD CONSTRAINT trucks_supplier_id_fkey 
      FOREIGN KEY (supplier_id) REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trucks_created_by_fkey'
  ) THEN
    ALTER TABLE trucks ADD CONSTRAINT trucks_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trucks_checked_by_fkey'
  ) THEN
    ALTER TABLE trucks ADD CONSTRAINT trucks_checked_by_fkey 
      FOREIGN KEY (checked_by) REFERENCES users(id);
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trucks_supplier_id ON trucks(supplier_id);
CREATE INDEX IF NOT EXISTS idx_trucks_destination ON trucks(destination);
CREATE INDEX IF NOT EXISTS idx_trucks_product_type ON trucks(product_type);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_is_checked ON trucks(is_checked);
CREATE INDEX IF NOT EXISTS idx_trucks_bon_livraison ON trucks(bon_livraison);

-- Create sequence for bon_livraison if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'bon_livraison_seq') THEN
    CREATE SEQUENCE bon_livraison_seq START 1;
  END IF;
END $$;

-- Create function to auto-generate bon_livraison
CREATE OR REPLACE FUNCTION generate_bon_livraison()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bon_livraison IS NULL THEN
    NEW.bon_livraison := 'BL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('bon_livraison_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate bon_livraison
DROP TRIGGER IF EXISTS trigger_generate_bon_livraison ON trucks;
CREATE TRIGGER trigger_generate_bon_livraison
  BEFORE INSERT ON trucks
  FOR EACH ROW
  EXECUTE FUNCTION generate_bon_livraison();

-- Create arrival history table to preserve arrival numbers even after check
CREATE TABLE IF NOT EXISTS arrival_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID,
  plate_number VARCHAR(50),
  bon_livraison VARCHAR(100),
  arrival_number INTEGER,
  destination VARCHAR(100),
  product_type VARCHAR(50),
  arrived_at TIMESTAMP WITH TIME ZONE,
  checked_at TIMESTAMP WITH TIME ZONE,
  checked_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arrival_history_destination ON arrival_history(destination);
CREATE INDEX IF NOT EXISTS idx_arrival_history_arrival_number ON arrival_history(arrival_number);
CREATE INDEX IF NOT EXISTS idx_arrival_history_arrived_at ON arrival_history(arrived_at);
