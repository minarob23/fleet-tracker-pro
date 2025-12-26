import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthResponse } from '@/types/user';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load token and user from localStorage on mount
    useEffect(() => {
        const loadAuth = async () => {
            const storedToken = localStorage.getItem('auth_token');
            if (storedToken) {
                setToken(storedToken);
                try {
                    // Verify token and get user info
                    const response = await apiClient.get<{ user: User }>('/auth/me', {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    setUser(response.user);
                } catch (error) {
                    // Token is invalid, clear it
                    localStorage.removeItem('auth_token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        loadAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('auth_token', response.token);
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout,
                isAuthenticated: !!user && !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
