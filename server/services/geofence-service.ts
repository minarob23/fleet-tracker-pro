import pool from '../db.js';
import { sendArrivalNotification } from './whatsapp-service.js';

interface Location {
    latitude: number;
    longitude: number;
}

interface Geofence {
    id: string;
    city_name: string;
    latitude: number;
    longitude: number;
    radius: number;
    geofence_type: 'city_boundary' | 'warehouse';
    color: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = point1.latitude * Math.PI / 180;
    const lat2 = point2.latitude * Math.PI / 180;
    const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const deltaLon = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Check if a point is inside a geofence
 */
export const isInsideGeofence = (point: Location, geofence: Geofence): boolean => {
    const distance = calculateDistance(point, {
        latitude: geofence.latitude,
        longitude: geofence.longitude,
    });
    return distance <= geofence.radius;
};

/**
 * Get all geofences from database
 */
export const getAllGeofences = async (): Promise<Geofence[]> => {
    const result = await pool.query('SELECT * FROM city_geofences ORDER BY city_name, geofence_type');
    return result.rows;
};

/**
 * Get geofences for a specific city
 */
export const getGeofencesByCity = async (cityName: string): Promise<Geofence[]> => {
    const result = await pool.query(
        'SELECT * FROM city_geofences WHERE city_name = $1',
        [cityName]
    );
    return result.rows;
};

/**
 * Check which geofences a truck is currently inside
 */
export const checkTruckGeofences = async (truckLocation: Location): Promise<Geofence[]> => {
    const geofences = await getAllGeofences();
    return geofences.filter(geofence => isInsideGeofence(truckLocation, geofence));
};

/**
 * Update truck status based on geofence detection
 * Returns the new status if changed, null otherwise
 */
export const updateTruckStatusByGeofence = async (
    truckId: string,
    truckLocation: Location,
    destination: string
): Promise<string | null> => {
    const insideGeofences = await checkTruckGeofences(truckLocation);

    // Check if truck is in destination city
    const cityGeofence = insideGeofences.find(
        g => g.city_name === destination && g.geofence_type === 'city_boundary'
    );

    // Check if truck is in warehouse
    const warehouseGeofence = insideGeofences.find(
        g => g.city_name === destination && g.geofence_type === 'warehouse'
    );

    let newStatus: string | null = null;

    if (warehouseGeofence) {
        // Truck is in warehouse
        newStatus = 'depot';
    } else if (cityGeofence) {
        // Truck has arrived in city
        newStatus = 'arrived';
    } else {
        // Truck is en route
        newStatus = 'en_route';
    }

    // Update truck status in database
    await pool.query(
        'UPDATE trucks SET status = $1, updated_at = NOW() WHERE id = $2',
        [newStatus, truckId]
    );

    // If truck just arrived, assign arrival number
    if (newStatus === 'arrived') {
        const result = await pool.query(
            'SELECT arrival_number FROM trucks WHERE id = $1',
            [truckId]
        );

        if (!result.rows[0].arrival_number) {
            // Get next arrival number
            const maxNumResult = await pool.query(
                'SELECT COALESCE(MAX(arrival_number), 0) + 1 as next_num FROM trucks WHERE arrival_number IS NOT NULL'
            );
            const nextArrivalNumber = maxNumResult.rows[0].next_num;

            await pool.query(
                'UPDATE trucks SET arrival_number = $1 WHERE id = $2',
                [nextArrivalNumber, truckId]
            );

            return newStatus;
        }
    }

    return newStatus;
};

/**
 * Process GPS location update and check geofences
 */
export const processGPSLocation = async (
    deviceId: string,
    location: Location,
    speed: number
): Promise<void> => {
    // Find truck associated with this GPS device
    const truckResult = await pool.query(
        `SELECT t.* FROM trucks t
     JOIN gps_devices g ON g.truck_id = t.id
     WHERE g.device_id = $1`,
        [deviceId]
    );

    if (truckResult.rows.length === 0) {
        console.log(`No truck found for GPS device: ${deviceId}`);
        return;
    }

    const truck = truckResult.rows[0];

    // Update truck location
    await pool.query(
        'UPDATE trucks SET latitude = $1, longitude = $2, speed = $3, updated_at = NOW() WHERE id = $4',
        [location.latitude, location.longitude, speed, truck.id]
    );

    // Check and update status based on geofences
    const newStatus = await updateTruckStatusByGeofence(
        truck.id,
        location,
        truck.destination
    );

    if (newStatus === 'arrived') {
        console.log(`🚛 Truck ${truck.plate_number} has arrived at ${truck.destination}`);
        // Send WhatsApp notification to city staff
        await sendArrivalNotification(truck);
    } else if (newStatus === 'depot') {
        console.log(`📦 Truck ${truck.plate_number} has entered warehouse at ${truck.destination}`);
    }
};
