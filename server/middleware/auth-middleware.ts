import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById, User } from '../services/auth-service.js';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No token provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded) {
            console.log('❌ Invalid or expired token');
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const user = await getUserById(decoded.userId);

        if (!user) {
            console.log('❌ User not found for ID:', decoded.userId);
            return res.status(401).json({ error: 'User not found' });
        }

        console.log('✅ Authenticated:', user.email, '| User ID:', user.id, '| Role:', user.role);
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: User['role'][]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Filter trucks based on user role and permissions
 */
export const filterTrucksByPermissions = (trucks: any[], user: User): any[] => {
    // Admin and central office can see all trucks
    if (user.role === 'admin' || user.role === 'central_office') {
        return trucks;
    }

    // City staff can only see trucks destined to their city
    if (user.role === 'city_staff' && user.city) {
        return trucks.filter(truck =>
            truck.destination && truck.destination.toLowerCase().includes(user.city!.toLowerCase())
        );
    }

    // Suppliers can see all trucks with matching product types
    if (user.role === 'supplier') {
        return trucks.filter(truck => {
            const hasMatchingProductType = user.product_types && user.product_types.length > 0
                ? user.product_types.includes(truck.product_type)
                : false; // If no product_types defined, show nothing
            return hasMatchingProductType;
        });
    }

    return [];
};

/**
 * Build SQL WHERE clause for truck filtering based on user permissions
 */
export const buildTruckFilterSQL = (user: User): { where: string; params: any[] } => {
    // Admin and central office can see all trucks
    if (user.role === 'admin' || user.role === 'central_office') {
        return { where: '', params: [] };
    }

    // City staff can only see trucks destined to their city
    if (user.role === 'city_staff' && user.city) {
        return {
            where: 'WHERE destination ILIKE $1',
            params: [`%${user.city}%`]
        };
    }

    // Suppliers can see all trucks with matching product types
    if (user.role === 'supplier') {
        // If supplier has product_types defined, filter by product type only
        if (user.product_types && user.product_types.length > 0) {
            return {
                where: 'WHERE product_type = ANY($1)',
                params: [user.product_types]
            };
        }
        // Fallback: if no product_types defined, show no trucks
        return {
            where: 'WHERE 1=0',
            params: []
        };
    }

    // Default: no trucks visible
    return { where: 'WHERE 1=0', params: [] };
};
