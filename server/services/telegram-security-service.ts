import pool from '../db.js';

interface WhitelistUser {
    id?: number;
    telegram_user_id: string;
    user_name?: string;
    role?: string;
    added_by?: string;
}

interface InvitationCode {
    id?: number;
    code: string;
    telegram_user_id?: string;
    driver_name?: string;
    truck_id?: number;
    created_by?: string;
    expires_at: Date;
    used_at?: Date;
    is_used: boolean;
}

interface PendingApproval {
    id?: number;
    telegram_user_id: string;
    user_name?: string;
    request_message?: string;
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: Date;
}

class TelegramSecurityService {
    /**
     * Check if user is whitelisted
     */
    async isWhitelisted(telegramUserId: string): Promise<boolean> {
        try {
            const result = await pool.query(
                'SELECT id FROM telegram_whitelist WHERE telegram_user_id = $1',
                [telegramUserId]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.error('❌ Error checking whitelist:', error);
            return false;
        }
    }

    /**
     * Add user to whitelist
     */
    async addToWhitelist(data: WhitelistUser): Promise<boolean> {
        try {
            await pool.query(
                `INSERT INTO telegram_whitelist (telegram_user_id, user_name, role, added_by)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (telegram_user_id) DO NOTHING`,
                [data.telegram_user_id, data.user_name, data.role || 'admin', data.added_by]
            );
            console.log(`✅ Added ${data.telegram_user_id} to whitelist`);
            return true;
        } catch (error) {
            console.error('❌ Error adding to whitelist:', error);
            return false;
        }
    }

    /**
     * Remove user from whitelist
     */
    async removeFromWhitelist(telegramUserId: string): Promise<boolean> {
        try {
            await pool.query(
                'DELETE FROM telegram_whitelist WHERE telegram_user_id = $1',
                [telegramUserId]
            );
            console.log(`✅ Removed ${telegramUserId} from whitelist`);
            return true;
        } catch (error) {
            console.error('❌ Error removing from whitelist:', error);
            return false;
        }
    }

    /**
     * Get all whitelisted users
     */
    async getWhitelist(): Promise<WhitelistUser[]> {
        try {
            const result = await pool.query(
                'SELECT * FROM telegram_whitelist ORDER BY created_at DESC'
            );
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting whitelist:', error);
            return [];
        }
    }

    /**
     * Generate unique invitation code
     */
    private generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Create invitation code
     */
    async createInvitationCode(
        driverName: string,
        truckId: number,
        createdBy: string
    ): Promise<string | null> {
        try {
            const code = this.generateCode();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // Valid for 24 hours

            await pool.query(
                `INSERT INTO telegram_invitation_codes 
                 (code, driver_name, truck_id, created_by, expires_at)
                 VALUES ($1, $2, $3, $4, $5)`,
                [code, driverName, truckId, createdBy, expiresAt]
            );

            console.log(`✅ Created invitation code: ${code} for ${driverName}`);
            return code;
        } catch (error) {
            console.error('❌ Error creating invitation code:', error);
            return null;
        }
    }

    /**
     * Validate and use invitation code
     */
    async validateInvitationCode(
        code: string,
        telegramUserId: string
    ): Promise<{ valid: boolean; truckId?: number; message?: string }> {
        try {
            const result = await pool.query(
                `SELECT * FROM telegram_invitation_codes 
                 WHERE code = $1 AND is_used = FALSE AND expires_at > NOW()`,
                [code.toUpperCase()]
            );

            if (result.rows.length === 0) {
                return { valid: false, message: 'كود غير صالح أو منتهي الصلاحية' };
            }

            const invitation = result.rows[0];

            // Mark as used
            await pool.query(
                `UPDATE telegram_invitation_codes 
                 SET is_used = TRUE, used_at = NOW(), telegram_user_id = $1
                 WHERE id = $2`,
                [telegramUserId, invitation.id]
            );

            console.log(`✅ Code ${code} used by ${telegramUserId}`);
            return { valid: true, truckId: invitation.truck_id };
        } catch (error) {
            console.error('❌ Error validating invitation code:', error);
            return { valid: false, message: 'حدث خطأ أثناء التحقق من الكود' };
        }
    }

    /**
     * Get all invitation codes
     */
    async getInvitationCodes(): Promise<InvitationCode[]> {
        try {
            const result = await pool.query(
                `SELECT * FROM telegram_invitation_codes 
                 ORDER BY created_at DESC LIMIT 100`
            );
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting invitation codes:', error);
            return [];
        }
    }

    /**
     * Delete invitation code
     */
    async deleteInvitationCode(id: number): Promise<boolean> {
        try {
            await pool.query(
                'DELETE FROM telegram_invitation_codes WHERE id = $1',
                [id]
            );
            return true;
        } catch (error) {
            console.error('❌ Error deleting invitation code:', error);
            return false;
        }
    }

    /**
     * Request access (for emergency cases)
     */
    async requestAccess(
        telegramUserId: string,
        userName: string,
        message: string
    ): Promise<boolean> {
        try {
            await pool.query(
                `INSERT INTO telegram_pending_approvals 
                 (telegram_user_id, user_name, request_message)
                 VALUES ($1, $2, $3)`,
                [telegramUserId, userName, message]
            );
            console.log(`✅ Access request from ${userName} (${telegramUserId})`);
            return true;
        } catch (error) {
            console.error('❌ Error creating access request:', error);
            return false;
        }
    }

    /**
     * Approve access request
     */
    async approveAccess(requestId: number, approvedBy: string): Promise<boolean> {
        try {
            // Get request details
            const request = await pool.query(
                'SELECT telegram_user_id, user_name FROM telegram_pending_approvals WHERE id = $1',
                [requestId]
            );

            if (request.rows.length === 0) {
                return false;
            }

            const { telegram_user_id, user_name } = request.rows[0];

            // Add to whitelist
            await this.addToWhitelist({
                telegram_user_id,
                user_name,
                role: 'driver',
                added_by: approvedBy
            });

            // Update request status
            await pool.query(
                `UPDATE telegram_pending_approvals 
                 SET status = 'approved', approved_by = $1, approved_at = NOW()
                 WHERE id = $2`,
                [approvedBy, requestId]
            );

            console.log(`✅ Approved access for ${telegram_user_id}`);
            return true;
        } catch (error) {
            console.error('❌ Error approving access:', error);
            return false;
        }
    }

    /**
     * Reject access request
     */
    async rejectAccess(requestId: number, rejectedBy: string): Promise<boolean> {
        try {
            await pool.query(
                `UPDATE telegram_pending_approvals 
                 SET status = 'rejected', approved_by = $1, approved_at = NOW()
                 WHERE id = $2`,
                [rejectedBy, requestId]
            );
            console.log(`✅ Rejected access request ${requestId}`);
            return true;
        } catch (error) {
            console.error('❌ Error rejecting access:', error);
            return false;
        }
    }

    /**
     * Get pending approvals
     */
    async getPendingApprovals(): Promise<PendingApproval[]> {
        try {
            const result = await pool.query(
                `SELECT * FROM telegram_pending_approvals 
                 WHERE status = 'pending'
                 ORDER BY created_at DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting pending approvals:', error);
            return [];
        }
    }

    /**
     * Check if user has any access (whitelist or approved truck)
     */
    async hasAccess(telegramUserId: string): Promise<boolean> {
        // Check whitelist
        if (await this.isWhitelisted(telegramUserId)) {
            return true;
        }

        // Check if linked to a truck
        try {
            const result = await pool.query(
                'SELECT id FROM trucks WHERE telegram_user_id = $1',
                [telegramUserId]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.error('❌ Error checking truck access:', error);
            return false;
        }
    }
}

// Export singleton instance
export const telegramSecurityService = new TelegramSecurityService();
