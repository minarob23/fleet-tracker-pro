-- Fix gps_number and driver_phone to be nullable
-- Migration 011: Make gps_number and driver_phone optional

ALTER TABLE trucks ALTER COLUMN gps_number DROP NOT NULL;
ALTER TABLE trucks ALTER COLUMN driver_phone DROP NOT NULL;

COMMENT ON COLUMN trucks.gps_number IS 'GPS device number - optional, not used with Telegram/WhatsApp tracking';
COMMENT ON COLUMN trucks.driver_phone IS 'Driver phone number - used for WhatsApp notifications';
