import { Router } from 'express';
import pool from '../db.js';
import crypto from 'crypto';

const router = Router();

/**
 * Create tracking link for WhatsApp driver
 */
router.post('/create-link/:truckId', async (req, res) => {
    try {
        const { truckId } = req.params;

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');

        // Store token in database
        await pool.query(
            `UPDATE trucks 
             SET whatsapp_tracking_token = $1, 
                 whatsapp_tracking_token_created = NOW()
             WHERE id = $2`,
            [token, truckId]
        );

        const trackingUrl = `${process.env.APP_URL || 'http://localhost:8080'}/track-whatsapp/${token}`;

        res.json({
            success: true,
            trackingUrl,
            token
        });
    } catch (error) {
        console.error('Error creating tracking link:', error);
        res.status(500).json({ error: 'Failed to create tracking link' });
    }
});

/**
 * Update location from WhatsApp tracking page
 */
router.post('/update-location/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { latitude, longitude, accuracy, speed } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude required' });
        }

        // Find truck by token
        const truckResult = await pool.query(
            'SELECT * FROM trucks WHERE whatsapp_tracking_token = $1',
            [token]
        );

        if (truckResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid tracking link' });
        }

        const truck = truckResult.rows[0];

        // Calculate speed if not provided
        let calculatedSpeed = speed || 0;
        if (!speed) {
            const prevResult = await pool.query(
                'SELECT latitude, longitude, updated_at FROM trucks WHERE id = $1',
                [truck.id]
            );

            if (prevResult.rows.length > 0 && prevResult.rows[0].latitude) {
                const prev = prevResult.rows[0];
                const timeDiff = (new Date().getTime() - new Date(prev.updated_at).getTime()) / 1000;

                if (timeDiff >= 5) {
                    const R = 6371;
                    const dLat = (latitude - prev.latitude) * Math.PI / 180;
                    const dLon = (longitude - prev.longitude) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(prev.latitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distance = R * c;
                    calculatedSpeed = Math.min(Math.round((distance / timeDiff) * 3600), 200);
                }
            }
        }

        // Update truck location
        await pool.query(
            `UPDATE trucks 
             SET latitude = $1, 
                 longitude = $2, 
                 speed = $3,
                 tracking_method = 'whatsapp',
                 status = 'in_transit',
                 updated_at = NOW()
             WHERE id = $4`,
            [latitude, longitude, calculatedSpeed, truck.id]
        );

        console.log(`📍 WhatsApp location updated for truck ${truck.plate_number}: ${latitude}, ${longitude}`);

        res.json({
            success: true,
            message: 'Location updated successfully',
            truck: {
                plateNumber: truck.plate_number,
                speed: calculatedSpeed
            }
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

/**
 * Get truck info by token (for tracking page)
 */
router.get('/truck-info/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const result = await pool.query(
            `SELECT id, plate_number, driver_name, destination, status,
                    whatsapp_tracking_active, whatsapp_tracking_started_at,
                    preferred_language, preferred_theme
             FROM trucks 
             WHERE whatsapp_tracking_token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid tracking link' });
        }

        const truck = result.rows[0];

        res.json({
            success: true,
            truck: {
                plateNumber: truck.plate_number,
                driverName: truck.driver_name,
                destination: truck.destination,
                status: truck.status,
                trackingActive: truck.whatsapp_tracking_active || false,
                trackingStartedAt: truck.whatsapp_tracking_started_at,
                preferredLanguage: truck.preferred_language || 'ar',
                preferredTheme: truck.preferred_theme || 'light'
            }
        });
    } catch (error) {
        console.error('Error fetching truck info:', error);
        res.status(500).json({ error: 'Failed to fetch truck info' });
    }
});


// Mark truck as arrived
router.post('/mark-arrived/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const result = await pool.query(
            'SELECT id, plate_number FROM trucks WHERE whatsapp_tracking_token = $1',
            [token]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid tracking link' });
        }
        await pool.query(
            'UPDATE trucks SET status = $1, updated_at = NOW() WHERE id = $2',
            ['arrived', result.rows[0].id]
        );
        console.log(`✅ Truck ${result.rows[0].plate_number} marked as arrived`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Start tracking
router.post('/start-tracking/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const result = await pool.query(
            'SELECT id FROM trucks WHERE whatsapp_tracking_token = $1',
            [token]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid tracking link' });
        }
        await pool.query(
            `UPDATE trucks 
             SET whatsapp_tracking_active = TRUE,
                 whatsapp_tracking_started_at = NOW()
             WHERE whatsapp_tracking_token = $1`,
            [token]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Stop tracking
router.post('/stop-tracking/:token', async (req, res) => {
    try {
        const { token } = req.params;
        await pool.query(
            `UPDATE trucks 
             SET whatsapp_tracking_active = FALSE
             WHERE whatsapp_tracking_token = $1`,
            [token]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Update language preference
router.post('/update-language/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { language } = req.body;

        if (!['ar', 'fr'].includes(language)) {
            return res.status(400).json({ error: 'Invalid language' });
        }

        await pool.query(
            'UPDATE trucks SET preferred_language = $1 WHERE whatsapp_tracking_token = $2',
            [language, token]
        );

        console.log(`🌐 Language updated to ${language} for token ${token}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to update language' });
    }
});

// Update theme preference
router.post('/update-theme/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { theme } = req.body;

        if (!['light', 'dark'].includes(theme)) {
            return res.status(400).json({ error: 'Invalid theme' });
        }

        await pool.query(
            'UPDATE trucks SET preferred_theme = $1 WHERE whatsapp_tracking_token = $2',
            [theme, token]
        );

        console.log(`🎨 Theme updated to ${theme} for token ${token}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to update theme' });
    }
});

export default router;

