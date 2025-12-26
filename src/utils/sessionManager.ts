/**
 * Session Manager Utility
 * Handles session ID generation and cookie management for guest users
 */

/**
 * Get existing session ID from cookie or create a new one
 * @returns Session ID string
 */
export const getOrCreateSessionId = (): string => {
    // Check if session ID exists in cookie
    let sessionId = getCookie('guest_session_id');

    if (!sessionId) {
        // Create new UUID for session
        sessionId = generateUUID();
        // Save to cookie (30 days expiry)
        setCookie('guest_session_id', sessionId, 30);
    }

    return sessionId;
};

/**
 * Get a cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null if not found
 */
export const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
};

/**
 * Set a cookie with expiration
 * @param name Cookie name
 * @param value Cookie value
 * @param days Days until expiration
 */
export const setCookie = (name: string, value: string, days: number): void => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

/**
 * Delete a cookie
 * @param name Cookie name
 */
export const deleteCookie = (name: string): void => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Generate a UUID v4
 * @returns UUID string
 */
const generateUUID = (): string => {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
