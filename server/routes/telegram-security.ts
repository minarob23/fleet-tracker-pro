import express from 'express';
import { telegramSecurityService } from '../services/telegram-security-service.js';
import { authenticate } from '../middleware/auth-middleware.js';

const router = express.Router();

// Get whitelist
router.get('/whitelist', authenticate, async (req, res) => {
    try {
        const whitelist = await telegramSecurityService.getWhitelist();
        res.json({ whitelist });
    } catch (error) {
        console.error('Error getting whitelist:', error);
        res.status(500).json({ error: 'Failed to get whitelist' });
    }
});

// Add to whitelist
router.post('/whitelist', authenticate, async (req, res) => {
    try {
        const { telegram_user_id, user_name, role } = req.body;
        const success = await telegramSecurityService.addToWhitelist({
            telegram_user_id,
            user_name,
            role: role || 'driver',
            added_by: req.user!.id
        });
        res.json({ success });
    } catch (error) {
        console.error('Error adding to whitelist:', error);
        res.status(500).json({ error: 'Failed to add to whitelist' });
    }
});

// Remove from whitelist
router.delete('/whitelist/:userId', authenticate, async (req, res) => {
    try {
        const success = await telegramSecurityService.removeFromWhitelist(req.params.userId);
        res.json({ success });
    } catch (error) {
        console.error('Error removing from whitelist:', error);
        res.status(500).json({ error: 'Failed to remove from whitelist' });
    }
});

// Create invitation code
router.post('/invitation-codes', authenticate, async (req, res) => {
    try {
        const { driver_name, truck_id } = req.body;
        const code = await telegramSecurityService.createInvitationCode(
            driver_name,
            truck_id || null,
            req.user!.id
        );
        res.json({ code });
    } catch (error) {
        console.error('Error creating invitation code:', error);
        res.status(500).json({ error: 'Failed to create invitation code' });
    }
});

// Get invitation codes
router.get('/invitation-codes', authenticate, async (req, res) => {
    try {
        const codes = await telegramSecurityService.getInvitationCodes();
        res.json({ codes });
    } catch (error) {
        console.error('Error getting invitation codes:', error);
        res.status(500).json({ error: 'Failed to get invitation codes' });
    }
});

// Delete invitation code
router.delete('/invitation-codes/:id', authenticate, async (req, res) => {
    try {
        const success = await telegramSecurityService.deleteInvitationCode(parseInt(req.params.id));
        res.json({ success });
    } catch (error) {
        console.error('Error deleting invitation code:', error);
        res.status(500).json({ error: 'Failed to delete invitation code' });
    }
});

// Get pending approvals
router.get('/pending-approvals', authenticate, async (req, res) => {
    try {
        const approvals = await telegramSecurityService.getPendingApprovals();
        res.json({ approvals });
    } catch (error) {
        console.error('Error getting pending approvals:', error);
        res.status(500).json({ error: 'Failed to get pending approvals' });
    }
});

// Approve access
router.post('/approve/:id', authenticate, async (req, res) => {
    try {
        // Get the approval data BEFORE approving (it will be deleted after approval)
        const approvals = await telegramSecurityService.getPendingApprovals();
        const approvalToProcess = approvals.find(a => a.id === parseInt(req.params.id));

        const success = await telegramSecurityService.approveAccess(
            parseInt(req.params.id),
            req.user!.id
        );

        if (success && approvalToProcess) {
            // Send notification to user
            import('../services/telegram-bot-service.js').then(({ telegramBotService }) => {
                telegramBotService.sendMessage(
                    parseInt(approvalToProcess.telegram_user_id),
                    `✅ *تمت الموافقة على طلبك!*\n\nمرحباً ${approvalToProcess.user_name}!\n\nتم قبول طلبك للوصول إلى نظام تتبع الشاحنات.\n\nيمكنك الآن استخدام البوت بإرسال:\n/start`,
                    { parse_mode: 'Markdown' }
                );
            }).catch(err => console.error('Failed to send notification:', err));
        }

        res.json({ success });
    } catch (error) {
        console.error('Error approving access:', error);
        res.status(500).json({ error: 'Failed to approve access' });
    }
});

// Reject access
router.post('/reject/:id', authenticate, async (req, res) => {
    try {
        // Get the approval data BEFORE rejecting
        const approvals = await telegramSecurityService.getPendingApprovals();
        const approvalToReject = approvals.find(a => a.id === parseInt(req.params.id));

        const success = await telegramSecurityService.rejectAccess(
            parseInt(req.params.id),
            req.user!.id
        );

        if (success && approvalToReject) {
            // Send notification to user
            import('../services/telegram-bot-service.js').then(({ telegramBotService }) => {
                telegramBotService.sendMessage(
                    parseInt(approvalToReject.telegram_user_id),
                    `❌ *تم رفض طلبك*\n\nعذراً ${approvalToReject.user_name}،\n\nتم رفض طلبك للوصول إلى نظام تتبع الشاحنات.\n\nإذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المدير.`,
                    { parse_mode: 'Markdown' }
                );
            }).catch(err => console.error('Failed to send notification:', err));
        }

        res.json({ success });
    } catch (error) {
        console.error('Error rejecting access:', error);
        res.status(500).json({ error: 'Failed to reject access' });
    }
});

export default router;
