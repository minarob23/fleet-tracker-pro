import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Navigation, Truck, CheckCircle, AlertCircle, RefreshCw, Sun, Moon, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface TruckInfo {
    plateNumber: string;
    driverName: string;
    destination: string;
    status: string;
    trackingActive?: boolean;
    trackingStartedAt?: string;
}

const WhatsAppTracking = () => {
    const { token } = useParams<{ token: string }>();
    const { language, setLanguage } = useLanguage();
    const [truckInfo, setTruckInfo] = useState<TruckInfo | null>(null);
    const [tracking, setTracking] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return false;
    });

    useEffect(() => {
        // Fetch truck info
        const fetchTruckInfo = async () => {
            try {
                const response = await fetch(`/api/whatsapp-tracking/truck-info/${token}`);
                const data = await response.json();

                if (data.success) {
                    setTruckInfo(data.truck);

                    // استعادة التفضيلات من DB
                    if (data.truck.preferredLanguage) {
                        setLanguage(data.truck.preferredLanguage as 'ar' | 'fr');
                        console.log('🌐 Language restored from DB:', data.truck.preferredLanguage);
                    }
                    if (data.truck.preferredTheme) {
                        setIsDarkMode(data.truck.preferredTheme === 'dark');
                        console.log('🎨 Theme restored from DB:', data.truck.preferredTheme);
                    }
                } else {
                    setError('رابط تتبع غير صحيح');
                }
            } catch (err) {
                setError('فشل في تحميل معلومات الشاحنة');
            }
        };

        if (token) {
            fetchTruckInfo();
        }
    }, [token]);

    // Auto-start tracking if it was active
    useEffect(() => {
        if (truckInfo?.trackingActive && !tracking) {
            console.log('🔄 Restoring tracking state from database');
            startTracking();
        }
    }, [truckInfo]);

    // Apply theme
    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Handle language change
    const handleLanguageChange = async (newLanguage: string) => {
        setLanguage(newLanguage as 'ar' | 'fr');

        // حفظ في DB
        try {
            await fetch(`/api/whatsapp-tracking/update-language/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: newLanguage })
            });
            console.log('✅ Language saved to database:', newLanguage);
        } catch (error) {
            console.error('❌ Failed to save language:', error);
        }
    };

    // Handle theme change
    const handleThemeChange = async (isDark: boolean) => {
        setIsDarkMode(isDark);

        // حفظ في DB
        try {
            await fetch(`/api/whatsapp-tracking/update-theme/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: isDark ? 'dark' : 'light' })
            });
            console.log('✅ Theme saved to database:', isDark ? 'dark' : 'light');
        } catch (error) {
            console.error('❌ Failed to save theme:', error);
        }
    };

    const startTracking = async () => {
        if (!navigator.geolocation) {
            setError('المتصفح لا يدعم تحديد الموقع');
            return;
        }

        // Save tracking state to DB
        try {
            await fetch(`/api/whatsapp-tracking/start-tracking/${token}`, {
                method: 'POST'
            });
            console.log('✅ Tracking state saved to database');
        } catch (err) {
            console.error('❌ Failed to save tracking state:', err);
        }

        setTracking(true);
        setError(null);

        // Watch position with high accuracy
        const id = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;

                try {
                    const response = await fetch(`/api/whatsapp-tracking/update-location/${token}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            latitude,
                            longitude,
                            accuracy,
                            speed: speed || 0
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        setLastUpdate(new Date());
                        setError(null);
                    } else {
                        setError('فشل في تحديث الموقع');
                    }
                } catch (err) {
                    setError('خطأ في الاتصال بالخادم');
                }
            },
            (err) => {
                setError(`خطأ في تحديد الموقع: ${err.message}`);
                setTracking(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        setWatchId(id);
    };

    const stopTracking = async () => {
        // Save tracking state to DB
        try {
            await fetch(`/api/whatsapp-tracking/stop-tracking/${token}`, {
                method: 'POST'
            });
            console.log('✅ Tracking stopped and saved to database');
        } catch (err) {
            console.error('❌ Failed to save tracking state:', err);
        }

        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        setTracking(false);
    };

    if (!truckInfo && !error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <Card className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">جاري التحميل...</p>
                </Card>
            </div>
        );
    }

    if (error && !truckInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <Card className="p-8 text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">خطأ</h2>
                    <p className="text-muted-foreground">{error}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-2xl mx-auto pt-8">
                {/* Header */}
                <Card className="p-6 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Truck className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">{language === 'ar' ? 'تتبع الشاحنة' : 'Suivi du camion'}</h1>
                            <p className="text-sm text-muted-foreground">WhatsApp Tracking</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
                                title={language === 'ar' ? 'Passer au français' : 'التبديل للعربية'}
                            >
                                <Languages className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                title={language === 'ar' ? 'تبديل الوضع' : 'Changer le thème'}
                            >
                                {isDarkMode ? (
                                    <Sun className="w-4 h-4 text-yellow-500" />
                                ) : (
                                    <Moon className="w-4 h-4" />
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.location.reload()}
                                title={language === 'ar' ? 'إعادة تحميل الصفحة' : 'Recharger la page'}
                            >
                                <RefreshCw className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {truckInfo && (
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{language === 'ar' ? 'رقم اللوحة:' : 'Numéro de plaque:'}</span>
                                <span className="font-semibold">{truckInfo.plateNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{language === 'ar' ? 'السائق:' : 'Chauffeur:'}</span>
                                <span className="font-semibold">{truckInfo.driverName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{language === 'ar' ? 'الوجهة:' : 'Destination:'}</span>
                                <span className="font-semibold">{truckInfo.destination || (language === 'ar' ? 'غير محددة' : 'Non spécifiée')}</span>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Tracking Control */}
                <Card className="p-6 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <div className="text-center">
                        {!tracking ? (
                            <>
                                <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                                <h2 className="text-xl font-bold mb-2">{language === 'ar' ? 'ابدأ التتبع' : 'Commencer le suivi'}</h2>
                                <p className="text-muted-foreground mb-6">
                                    {language === 'ar' ? 'اضغط على الزر لبدء مشاركة موقعك تلقائياً' : 'Appuyez sur le bouton pour commencer à partager votre position automatiquement'}
                                </p>
                                <Button
                                    onClick={startTracking}
                                    size="lg"
                                    className="w-full"
                                >
                                    <Navigation className="w-5 h-5 ml-2" />
                                    {language === 'ar' ? 'بدء التتبع' : 'Commencer le suivi'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 bg-green-500/20 rounded-full animate-ping"></div>
                                    </div>
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto relative z-10" />
                                </div>
                                <h2 className="text-xl font-bold mb-2 text-green-600">{language === 'ar' ? 'التتبع نشط' : 'Suivi actif'}</h2>
                                <p className="text-muted-foreground mb-2">
                                    {language === 'ar' ? 'يتم مشاركة موقعك تلقائياً' : 'Votre position est partagée automatiquement'}
                                </p>
                                {lastUpdate && (
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {language === 'ar' ? 'آخر تحديث: ' : 'Dernière mise à jour: '}{lastUpdate.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
                                    </p>
                                )}
                                <Button
                                    onClick={stopTracking}
                                    variant="destructive"
                                    size="lg"
                                    className="w-full"
                                >
                                    {language === 'ar' ? 'إيقاف التتبع' : 'Arrêter le suivi'}
                                </Button>
                            </>
                        )}
                    </div>
                </Card>

                {/* Error Message */}
                {error && truckInfo && (
                    <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    </Card>
                )}

                {/* Instructions */}
                <Card className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        {language === 'ar' ? 'تعليمات الاستخدام' : 'Instructions d\'utilisation'}
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">1.</span>
                            <span>{language === 'ar' ? 'اضغط على "بدء التتبع" لمشاركة موقعك' : 'Appuyez sur "Commencer le suivi" pour partager votre position'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">2.</span>
                            <span>{language === 'ar' ? 'اسمح للمتصفح بالوصول إلى موقعك' : 'Autorisez le navigateur à accéder à votre position'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">3.</span>
                            <span>{language === 'ar' ? 'سيتم تحديث موقعك تلقائياً كل بضع ثوانٍ' : 'Votre position sera mise à jour automatiquement toutes les quelques secondes'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">4.</span>
                            <span>{language === 'ar' ? 'احتفظ بهذه الصفحة مفتوحة أثناء القيادة' : 'Gardez cette page ouverte pendant la conduite'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">5.</span>
                            <span>{language === 'ar' ? 'يمكنك إيقاف التتبع في أي وقت' : 'Vous pouvez arrêter le suivi à tout moment'}</span>
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default WhatsAppTracking;
