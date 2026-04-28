-- Add license plate and default reserved seat IDs to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS license_plate text,
  ADD COLUMN IF NOT EXISTS default_reserved_seat_ids text[] DEFAULT '{}' NOT NULL;
