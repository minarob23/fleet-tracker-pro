import express from 'express';
import { authenticateUser, getUserById, createInitialUsers } from '../services/auth-service.js';
import { authenticate } from '../middleware/auth-middleware.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await authenticateUser({ email, password });

        if (!result) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json(result);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        res.json({ user: req.user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        // In a JWT-based system, logout is primarily client-side
        // The client should remove the token from storage
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

/**
 * POST /api/auth/init-users
 * Initialize default users (development only)
 */
router.post('/init-users', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Not available in production' });
        }

        await createInitialUsers();
        res.json({ success: true, message: 'Users initialized' });
    } catch (error) {
        console.error('Init users error:', error);
        res.status(500).json({ error: 'Failed to initialize users' });
    }
});

export default router;
