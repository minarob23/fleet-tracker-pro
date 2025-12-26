-- Update City Geofences with Real GPS Coordinates
-- Run this SQL script in your Neon database to update geofence coordinates

-- Update Laayoune (العيون) coordinates
UPDATE city_geofences SET 
  latitude = 27.1536, 
  longitude = -13.2033, 
  radius = 15000  -- 15km radius for city boundary
WHERE city_name = 'Laayoune' AND geofence_type = 'city_boundary';

UPDATE city_geofences SET 
  latitude = 27.1500, 
  longitude = -13.2000, 
  radius = 500  -- 500m radius for warehouse
WHERE city_name = 'Laayoune' AND geofence_type = 'warehouse';

-- Update Dakhla (الداخلة) coordinates
UPDATE city_geofences SET 
  latitude = 23.7185, 
  longitude = -15.9582, 
  radius = 12000  -- 12km radius for city boundary
WHERE city_name = 'Dakhla' AND geofence_type = 'city_boundary';

UPDATE city_geofences SET 
  latitude = 23.7150, 
  longitude = -15.9500, 
  radius = 500  -- 500m radius for warehouse
WHERE city_name = 'Dakhla' AND geofence_type = 'warehouse';

-- Update Smara (السمارة) coordinates
UPDATE city_geofences SET 
  latitude = 26.7386, 
  longitude = -11.6719, 
  radius = 10000  -- 10km radius for city boundary
WHERE city_name = 'Smara' AND geofence_type = 'city_boundary';

UPDATE city_geofences SET 
  latitude = 26.7350, 
  longitude = -11.6700, 
  radius = 500  -- 500m radius for warehouse
WHERE city_name = 'Smara' AND geofence_type = 'warehouse';

-- Update Guelmim (كلميم) coordinates
UPDATE city_geofences SET 
  latitude = 28.9870, 
  longitude = -10.0574, 
  radius = 10000  -- 10km radius for city boundary
WHERE city_name = 'Guelmim' AND geofence_type = 'city_boundary';

UPDATE city_geofences SET 
  latitude = 28.9850, 
  longitude = -10.0550, 
  radius = 500  -- 500m radius for warehouse
WHERE city_name = 'Guelmim' AND geofence_type = 'warehouse';

-- Verify the updates
SELECT 
  city_name,
  geofence_type,
  latitude,
  longitude,
  radius,
  color
FROM city_geofences
ORDER BY city_name, geofence_type;
