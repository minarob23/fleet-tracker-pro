import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool, { initDatabase } from './db.js';
import { createInitialUsers } from './services/auth-service.js';
import { authenticate, buildTruckFilterSQL } from './middleware/auth-middleware.js';
import { sendArrivalNotification } from './services/whatsapp-service.js';

// Import routes
import authRoutes from './routes/auth.js';
import gpsWebhookRoutes from './routes/gps-webhook.js';
import telegramWebhookRoutes from './routes/telegram-webhook.js';
import telegramSecurityRoutes from './routes/telegram-security.js';
import whatsappTrackingRoutes from './routes/whatsapp-tracking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env FIRST
dotenv.config({ path: join(__dirname, '.env') });

// NOW import Telegram bot service (after env vars are loaded)
import './services/telegram-bot-service.js';

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory (Vite build output)
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Initialize database and create users on startup
initDatabase()
    .then(() => createInitialUsers())
    .catch(console.error);

// Helper function to transform truck data from snake_case to camelCase
function transformTruckData(dbTruck: any) {
    return {
        id: dbTruck.id,
        plateNumber: dbTruck.plate_number,
        gpsNumber: dbTruck.gps_number,
        driverName: dbTruck.driver_name,
        driverPhone: dbTruck.driver_phone,
        preferredContact: dbTruck.preferred_contact,
        telegramUserId: dbTruck.telegram_user_id,
        whatsappUserId: dbTruck.whatsapp_user_id,
        trackingMethod: dbTruck.tracking_method,
        status: dbTruck.status,
        arrivalNumber: dbTruck.arrival_number,
        latitude: dbTruck.latitude,
        longitude: dbTruck.longitude,
        speed: dbTruck.speed,
        lastUpdate: dbTruck.updated_at,
        origin: dbTruck.origin,
        destination: dbTruck.destination,
        cargoType: dbTruck.cargo_type,
        bonLivraison: dbTruck.bon_livraison,
        productType: dbTruck.product_type,
        productCode: dbTruck.product_code,
        supplierId: dbTruck.supplier_id,
        supplierName: dbTruck.supplier_name,
        createdBy: dbTruck.created_by,
        isChecked: dbTruck.is_checked,
        checkedBy: dbTruck.checked_by,
        checkedAt: dbTruck.checked_at,
        originLatitude: dbTruck.origin_latitude,
        originLongitude: dbTruck.origin_longitude,
        destinationLatitude: dbTruck.destination_latitude,
        destinationLongitude: dbTruck.destination_longitude,
    };
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'neon' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/gps', gpsWebhookRoutes);
app.use('/api/telegram', telegramWebhookRoutes);
app.use('/api/telegram-security', telegramSecurityRoutes);
app.use('/api/whatsapp-tracking', whatsappTrackingRoutes);

// Get all trucks (with role-based filtering)
app.get('/api/trucks', authenticate, async (req, res) => {
    try {
        const { where, params } = buildTruckFilterSQL(req.user!);
        const whereClause = where ? `${where} AND` : 'WHERE';
        const query = `SELECT * FROM trucks ${whereClause} is_checked = false ORDER BY created_at DESC`;
        const result = await pool.query(query, params);
        const trucks = result.rows.map(transformTruckData);
        res.json({ trucks });
    } catch (error) {
        console.error('Error fetching trucks:', error);
        res.status(500).json({ error: 'Failed to fetch trucks' });
    }
});

// Add new truck (authenticated)
app.post('/api/trucks', authenticate, async (req, res) => {
    try {
        const {
            plateNumber, gpsNumber, driverName, driverPhone, destination,
            cargoType, productType, latitude, longitude,
            telegramUserId, whatsappUserId, preferredContact, trackingMethod
        } = req.body;

        // Auto-set product_type for suppliers based on their product_types
        let finalProductType = productType || cargoType;
        if (req.user!.role === 'supplier' && req.user!.product_types && req.user!.product_types.length > 0) {
            // Use the first product type from the supplier's allowed types
            finalProductType = req.user!.product_types[0];
        }

        const result = await pool.query(
            `INSERT INTO trucks (
        plate_number, gps_number, driver_name, driver_phone, destination, 
        cargo_type, product_type, latitude, longitude, created_by, supplier_id, status,
        telegram_user_id, whatsapp_user_id, preferred_contact, tracking_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
            [
                plateNumber,
                gpsNumber,
                driverName,
                driverPhone,
                destination,
                cargoType,
                finalProductType,
                latitude || 24.7136,
                longitude || 46.6753,
                req.user!.id,
                req.user!.role === 'supplier' ? req.user!.id : null,
                'waiting',
                telegramUserId || null,
                whatsappUserId || null,
                preferredContact || 'whatsapp',
                trackingMethod || 'web'
            ]
        );

        res.json({ truck: result.rows[0] });
    } catch (error) {
        console.error('Error adding truck:', error);
        res.status(500).json({ error: 'Failed to add truck' });
    }
});

// Update truck (authenticated)
app.patch('/api/trucks/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            plateNumber, gpsNumber, driverName, driverPhone, destination, cargoType, productType,
            origin, originLatitude, originLongitude, destinationLatitude, destinationLongitude,
            preferredContact, telegramUserId, whatsappUserId
        } = req.body;

        // Check if user has permission to edit this truck
        const truckCheck = await pool.query('SELECT * FROM trucks WHERE id = $1', [id]);
        if (truckCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Truck not found' });
        }

        const truck = truckCheck.rows[0];

        // Only admin or creator can edit
        if (req.user!.role !== 'admin' &&
            truck.created_by !== req.user!.id) {
            return res.status(403).json({ error: 'Not authorized to edit this truck' });
        }

        // Auto-set product_type for suppliers if not provided
        let finalProductType = productType;
        if (!finalProductType && req.user!.role === 'supplier' && req.user!.product_types && req.user!.product_types.length > 0) {
            // Use the first product type from the supplier's allowed types
            finalProductType = req.user!.product_types[0];
        }

        const result = await pool.query(
            `UPDATE trucks SET
        plate_number = COALESCE($1, plate_number),
        gps_number = COALESCE($2, gps_number),
        driver_name = COALESCE($3, driver_name),
        driver_phone = COALESCE($4, driver_phone),
        destination = COALESCE($5, destination),
        cargo_type = COALESCE($6, cargo_type),
        product_type = COALESCE($7, product_type),
        preferred_contact = COALESCE($8, preferred_contact),
        telegram_user_id = COALESCE($9, telegram_user_id),
        whatsapp_user_id = COALESCE($10, whatsapp_user_id),
        origin = COALESCE($11, origin),
        origin_latitude = COALESCE($12, origin_latitude),
        origin_longitude = COALESCE($13, origin_longitude),
        destination_latitude = COALESCE($14, destination_latitude),
        destination_longitude = COALESCE($15, destination_longitude),
        updated_at = NOW()
      WHERE id = $16
      RETURNING *`,
            [
                plateNumber,
                gpsNumber,
                driverName,
                driverPhone,
                destination,
                cargoType,
                finalProductType,
                preferredContact,
                telegramUserId,
                whatsappUserId,
                origin,
                originLatitude,
                originLongitude,
                destinationLatitude,
                destinationLongitude,
                id
            ]
        );

        res.json({ truck: result.rows[0] });
    } catch (error) {
        console.error('Error updating truck:', error);
        res.status(500).json({ error: 'Failed to update truck' });
    }
});

// Update truck status
app.patch('/api/trucks/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query(
            'UPDATE trucks SET status = $1, updated_at = NOW() WHERE id = $2',
            [status, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating truck status:', error);
        res.status(500).json({ error: 'Failed to update truck status' });
    }
});

// Mark truck as arrived
app.post('/api/trucks/:id/arrived', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Get next arrival number
        const maxNumResult = await pool.query(
            'SELECT COALESCE(MAX(arrival_number), 0) + 1 as next_num FROM trucks WHERE arrival_number IS NOT NULL'
        );
        const nextArrivalNumber = maxNumResult.rows[0].next_num;

        await pool.query(
            'UPDATE trucks SET status = $1, arrival_number = $2, speed = 0, updated_at = NOW() WHERE id = $3',
            ['arrived', nextArrivalNumber, id]
        );

        // Get truck details for notification
        const truckResult = await pool.query('SELECT * FROM trucks WHERE id = $1', [id]);
        const truck = truckResult.rows[0];

        // Send WhatsApp notification
        if (truck) {
            await sendArrivalNotification({
                id: truck.id,
                plateNumber: truck.plate_number,
                driverName: truck.driver_name,
                destination: truck.destination,
                arrivalNumber: nextArrivalNumber,
                bonLivraison: truck.bon_livraison,
                productType: truck.product_type,
            });
        }

        res.json({ success: true, arrivalNumber: nextArrivalNumber });
    } catch (error) {
        console.error('Error marking truck as arrived:', error);
        res.status(500).json({ error: 'Failed to mark truck as arrived' });
    }
});

// Check/verify truck (mark as discharged and hide from view)
app.post('/api/trucks/:id/check', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Only city staff can check trucks
        if (req.user!.role !== 'city_staff' && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Only city staff can check trucks' });
        }

        // Get truck details before checking
        const truckResult = await pool.query('SELECT * FROM trucks WHERE id = $1', [id]);
        const truck = truckResult.rows[0];

        if (!truck) {
            return res.status(404).json({ error: 'Truck not found' });
        }

        // Save to arrival history
        await pool.query(
            `INSERT INTO arrival_history (
        truck_id, plate_number, bon_livraison, arrival_number, 
        destination, product_type, arrived_at, checked_at, checked_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)`,
            [
                truck.id,
                truck.plate_number,
                truck.bon_livraison,
                truck.arrival_number,
                truck.destination,
                truck.product_type,
                truck.updated_at,
                req.user!.id
            ]
        );

        // Mark truck as checked
        await pool.query(
            'UPDATE trucks SET is_checked = true, checked_by = $1, checked_at = NOW(), status = $2 WHERE id = $3',
            [req.user!.id, 'discharged', id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error checking truck:', error);
        res.status(500).json({ error: 'Failed to check truck' });
    }
});

// Update truck location
app.patch('/api/trucks/:id/location', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude, speed } = req.body;
        await pool.query(
            'UPDATE trucks SET latitude = $1, longitude = $2, speed = $3, updated_at = NOW() WHERE id = $4',
            [latitude, longitude, speed, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating truck location:', error);
        res.status(500).json({ error: 'Failed to update truck location' });
    }
});

// Delete truck
app.delete('/api/trucks/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Only admin can delete trucks
        if (req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can delete trucks' });
        }

        await pool.query('DELETE FROM trucks WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting truck:', error);
        res.status(500).json({ error: 'Failed to delete truck' });
    }
});

// Get all geofences
app.get('/api/geofences', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM geofences ORDER BY created_at DESC');
        res.json({ geofences: result.rows });
    } catch (error) {
        console.error('Error fetching geofences:', error);
        res.status(500).json({ error: 'Failed to fetch geofences' });
    }
});

// Get city geofences
app.get('/api/city-geofences', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM city_geofences ORDER BY city_name, geofence_type');
        res.json({ geofences: result.rows });
    } catch (error) {
        console.error('Error fetching city geofences:', error);
        res.status(500).json({ error: 'Failed to fetch city geofences' });
    }
});

// Add geofence
app.post('/api/geofences', authenticate, async (req, res) => {
    try {
        const { name, latitude, longitude, radius, color } = req.body;
        const result = await pool.query(
            `INSERT INTO geofences (name, latitude, longitude, radius, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [name, latitude, longitude, radius, color]
        );
        res.json({ geofence: result.rows[0] });
    } catch (error) {
        console.error('Error adding geofence:', error);
        res.status(500).json({ error: 'Failed to add geofence' });
    }
});

// Delete geofence
app.delete('/api/geofences/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM geofences WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting geofence:', error);
        res.status(500).json({ error: 'Failed to delete geofence' });
    }
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: Neon PostgreSQL`);
    console.log(`🔐 Authentication: Enabled`);
    console.log(`📡 GPS Webhook: /api/gps/webhook`);
    console.log(`🤖 Telegram Webhook: /api/telegram/webhook`);
});
