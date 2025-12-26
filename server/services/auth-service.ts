import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
    id: string;
    email: string;
    role: 'admin' | 'central_office' | 'city_staff' | 'supplier';
    full_name: string | null;
    city: string | null;
    supplier_name: string | null;
    product_types: string[] | null;
    is_active: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): { userId: string } | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
        return null;
    }
};

/**
 * Authenticate user with email and password
 */
export const authenticateUser = async (credentials: LoginCredentials): Promise<AuthResponse | null> => {
    const { email, password } = credentials;

    const result = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true',
        [email]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
        return null;
    }

    // Update last login
    await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
    );

    const token = generateToken(user.id);

    return {
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            city: user.city,
            supplier_name: user.supplier_name,
            product_types: user.product_types,
            is_active: user.is_active,
        },
        token,
    };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
    const result = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        city: user.city,
        supplier_name: user.supplier_name,
        product_types: user.product_types,
        is_active: user.is_active,
    };
};

/**
 * Create initial admin user with hashed password
 */
export const createInitialUsers = async () => {
    const users = [
        { email: 'admin@gmail.com', password: 'admin', role: 'admin', full_name: 'Administrator' },
        { email: 'onicl-saps@gmail.com', password: 'SAPS2026', role: 'central_office', full_name: 'ONICL Central', supplier_name: 'RABAT' },
        { email: 'farine-casa@gmail.com', password: 'FARINE-CA026', role: 'supplier', full_name: 'SNTL Casa', supplier_name: 'SNTL CASA', product_types: ['flour'] },
        { email: 'farine-agadir@gmail.com', password: 'FARINE-A2026', role: 'supplier', full_name: 'SNTL Agadir', supplier_name: 'SNTL AGADIR', product_types: ['flour'] },
        { email: 'cosumar@gmail.com', password: 'COSUMAR2026', role: 'supplier', full_name: 'COSUMAR', supplier_name: 'COSUMAR', product_types: ['sugar'] },
        { email: 'huile@gmail.com', password: 'HUILE2026', role: 'supplier', full_name: 'LESIEUR-CRISTAL', supplier_name: 'LESIEUR-CRISTAL', product_types: ['oil'] },
        { email: 'se-laayoune@gmail.com', password: 'LAAYOUNE01', role: 'city_staff', full_name: 'SE Laayoune', city: 'Laayoune' },
        { email: 'se-essmara@gmail.com', password: 'ESSMARA01', role: 'city_staff', full_name: 'SE Smara', city: 'Smara' },
        { email: 'se-dakhla@gmail.com', password: 'DAKHLA01', role: 'city_staff', full_name: 'SE Dakhla', city: 'Dakhla' },
        { email: 'se-guelmim@gmail.com', password: 'GUELMIM01', role: 'city_staff', full_name: 'SE Guelmim', city: 'Guelmim' },
    ];

    for (const userData of users) {
        try {
            const hashedPassword = await hashPassword(userData.password);

            await pool.query(
                `INSERT INTO users (email, password_hash, role, full_name, city, supplier_name, product_types)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
                [
                    userData.email,
                    hashedPassword,
                    userData.role,
                    userData.full_name,
                    (userData as any).city || null,
                    (userData as any).supplier_name || null,
                    (userData as any).product_types || null,
                ]
            );
            console.log(`✅ User created/updated: ${userData.email}`);
        } catch (error: any) {
            console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
    }
};
