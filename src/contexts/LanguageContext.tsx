import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../i18n/translations';
import { useAuth } from './AuthContext';
import { getOrCreateSessionId } from '@/utils/sessionManager';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [language, setLanguageState] = useState<Language>(() => {
        // Get saved language from localStorage as initial value
        const saved = localStorage.getItem('language');
        return (saved === 'ar' || saved === 'fr') ? saved : 'ar';
    });
    const [loading, setLoading] = useState(false);

    // Load language preference from NeonDB (for both authenticated users and guests)
    // DISABLED: API endpoints not implemented yet - using localStorage only
    /*
    useEffect(() => {
        const loadLanguageFromDB = async () => {
            setLoading(true);
            try {
                let endpoint = '/api/user/language';
                const headers: HeadersInit = {};

                if (isAuthenticated) {
                    // For authenticated users - use user token
                    headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
                } else {
                    // For guests - use session ID
                    endpoint = '/api/guest/language';
                    const sessionId = getOrCreateSessionId();
                    headers['X-Session-ID'] = sessionId;
                }

                const response = await fetch(endpoint, { headers });

                if (response.ok) {
                    const data = await response.json();
                    if (data.language === 'ar' || data.language === 'fr') {
                        setLanguageState(data.language);
                        localStorage.setItem('language', data.language);
                        document.documentElement.dir = data.language === 'ar' ? 'rtl' : 'ltr';
                        document.documentElement.lang = data.language;
                    }
                }
            } catch (error) {
                console.error('Failed to load language from DB:', error);
                // Fallback to localStorage (already loaded in initial state)
            } finally {
                setLoading(false);
            }
        };

        loadLanguageFromDB();
    }, [isAuthenticated]);
    */

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);

        // Update document direction and lang attribute
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // Save to NeonDB (for both authenticated users and guests)
        // DISABLED: API endpoints not implemented yet - using localStorage only
        /*
        try {
            let endpoint = '/api/user/language';
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (isAuthenticated) {
                // For authenticated users
                headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
            } else {
                // For guests
                endpoint = '/api/guest/language';
                const sessionId = getOrCreateSessionId();
                headers['X-Session-ID'] = sessionId;
            }

            await fetch(endpoint, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ language: lang }),
            });
        } catch (error) {
            console.error('Failed to save language to DB:', error);
            // Continue anyway - localStorage is already updated
        }
        */
    };

    // Translation function
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        return typeof value === 'string' ? value : key;
    };

    // Set initial direction on mount
    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
