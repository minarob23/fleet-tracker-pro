import express from 'express';
import { processGPSLocation } from '../services/geofence-service.js';
import pool from '../db.js';

const router = express.Router();

/**
 * POST /api/gps/webhook
 * Receive GPS location updates from devices
 * 
 * Expected payload formats:
 * - Generic: { device_id, latitude, longitude, speed, timestamp }
 * - Teltonika: Custom format
 * - Queclink: Custom format
 * - Concox: Custom format
 */
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;

        // Log webhook for debugging
        await pool.query(
            'INSERT INTO gps_webhooks_log (device_id, payload, headers) VALUES ($1, $2, $3)',
            [payload.device_id || 'unknown', JSON.stringify(payload), JSON.stringify(req.headers)]
        );

        // Parse payload based on device type
        const gpsData = parseGPSPayload(payload);

        if (!gpsData) {
            return res.status(400).json({ error: 'Invalid GPS payload' });
        }

        // Store location in history
        await pool.query(
            `INSERT INTO gps_locations (device_id, latitude, longitude, speed, heading, altitude, accuracy, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                gpsData.device_id,
                gpsData.latitude,
                gpsData.longitude,
                gpsData.speed || 0,
                gpsData.heading || null,
                gpsData.altitude || null,
                gpsData.accuracy || null,
                gpsData.timestamp || new Date(),
            ]
        );

        // Process location and update truck status
        await processGPSLocation(
            gpsData.device_id,
            { latitude: gpsData.latitude, longitude: gpsData.longitude },
            gpsData.speed || 0
        );

        // Mark webhook as processed
        await pool.query(
            'UPDATE gps_webhooks_log SET processed = true WHERE device_id = $1 AND created_at > NOW() - INTERVAL \'1 minute\'',
            [gpsData.device_id]
        );

        res.json({ success: true, message: 'GPS location updated' });
    } catch (error: any) {
        console.error('GPS webhook error:', error);

        // Log error
        await pool.query(
            'UPDATE gps_webhooks_log SET error_message = $1 WHERE created_at > NOW() - INTERVAL \'1 minute\' AND processed = false',
            [error.message]
        );

        res.status(500).json({ error: 'Failed to process GPS data' });
    }
});

/**
 * GET /api/gps/devices
 * Get all GPS devices
 */
router.get('/devices', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT g.*, t.plate_number, t.driver_name
       FROM gps_devices g
       LEFT JOIN trucks t ON t.id = g.truck_id
       ORDER BY g.created_at DESC`
        );
        res.json({ devices: result.rows });
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ error: 'Failed to get devices' });
    }
});

/**
 * POST /api/gps/devices
 * Register a new GPS device
 */
router.post('/devices', async (req, res) => {
    try {
        const { device_id, device_type, imei, phone_number, truck_id } = req.body;

        const result = await pool.query(
            `INSERT INTO gps_devices (device_id, device_type, imei, phone_number, truck_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [device_id, device_type, imei, phone_number, truck_id]
        );

        res.json({ device: result.rows[0] });
    } catch (error) {
        console.error('Create device error:', error);
        res.status(500).json({ error: 'Failed to create device' });
    }
});

/**
 * Parse GPS payload from different device types
 */
function parseGPSPayload(payload: any): {
    device_id: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    accuracy?: number;
    timestamp?: Date;
} | null {
    // Generic format
    if (payload.device_id && payload.latitude && payload.longitude) {
        return {
            device_id: payload.device_id,
            latitude: parseFloat(payload.latitude),
            longitude: parseFloat(payload.longitude),
            speed: payload.speed ? parseFloat(payload.speed) : undefined,
            heading: payload.heading ? parseFloat(payload.heading) : undefined,
            altitude: payload.altitude ? parseFloat(payload.altitude) : undefined,
            accuracy: payload.accuracy ? parseFloat(payload.accuracy) : undefined,
            timestamp: payload.timestamp ? new Date(payload.timestamp) : undefined,
        };
    }

    // Teltonika format (example)
    if (payload.imei && payload.records) {
        const record = payload.records[0];
        return {
            device_id: payload.imei,
            latitude: record.lat,
            longitude: record.lng,
            speed: record.speed,
            heading: record.direction,
            altitude: record.altitude,
            timestamp: new Date(record.timestamp),
        };
    }

    // Queclink format (example)
    if (payload.deviceId && payload.location) {
        return {
            device_id: payload.deviceId,
            latitude: payload.location.latitude,
            longitude: payload.location.longitude,
            speed: payload.location.speed,
            heading: payload.location.heading,
            timestamp: new Date(payload.timestamp),
        };
    }

    // Add more formats as needed

    return null;
}

export default router;
