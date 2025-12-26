import express from 'express';
import { telegramBotService } from '../services/telegram-bot-service';

const router = express.Router();

/**
 * Telegram webhook endpoint
 * Receives updates from Telegram Bot API
 */
router.post('/webhook', async (req, res) => {
    try {
        const update = req.body;

        // Log incoming update (for debugging)
        console.log('📨 Received Telegram update:', JSON.stringify(update, null, 2));

        // Process the update
        await telegramBotService.processUpdate(update);

        // Respond with 200 OK
        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('❌ Error processing Telegram webhook:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});

/**
 * Set webhook URL
 * Call this endpoint to configure the Telegram webhook
 */
router.post('/set-webhook', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                ok: false,
                error: 'Webhook URL is required'
            });
        }

        const success = await telegramBotService.setWebhook(url);

        if (success) {
            res.json({
                ok: true,
                message: 'Webhook set successfully',
                url
            });
        } else {
            res.status(500).json({
                ok: false,
                error: 'Failed to set webhook'
            });
        }
    } catch (error) {
        console.error('❌ Error setting webhook:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});

/**
 * Get webhook info
 * Check current webhook configuration
 */
router.get('/webhook-info', async (req, res) => {
    try {
        if (!telegramBotService.isReady()) {
            return res.status(503).json({
                ok: false,
                error: 'Telegram bot service not initialized'
            });
        }

        res.json({
            ok: true,
            message: 'Telegram bot service is running',
            ready: telegramBotService.isReady()
        });
    } catch (error) {
        console.error('❌ Error getting webhook info:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'telegram-bot',
        status: telegramBotService.isReady() ? 'ready' : 'not initialized',
        timestamp: new Date().toISOString()
    });
});

export default router;
