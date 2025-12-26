import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, Loader2, Moon, Sun, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const { login } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

    // Apply theme
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login({ email, password });
            toast.success('تم تسجيل الدخول بنجاح');
            navigate('/');
        } catch (error: any) {
            toast.error(error.message || 'فشل تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Theme and Language Toggle - Top Right */}
            <div className="fixed top-4 right-4 flex gap-2 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="rounded-full"
                >
                    {isDarkMode ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
                    className="rounded-full"
                >
                    <Languages className="w-5 h-5" />
                </Button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="glass-card p-8 rounded-2xl">
                    {/* Logo and Title */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                            <Truck className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            {language === 'ar' ? 'المكتب الوطني للحبوب والقطاني' : 'ONICL'}
                        </h1>
                        <p className="text-muted-foreground">
                            {language === 'ar' ? 'نظام تتبع الشاحنات' : 'Système de suivi des camions'}
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="example@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="text-left"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {language === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="text-left pr-10"
                                    dir="ltr"
                                />
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    {language === 'ar' ? 'جاري تسجيل الدخول...' : 'Connexion en cours...'}
                                </>
                            ) : (
                                language === 'ar' ? 'تسجيل الدخول' : 'Se connecter'
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            {language === 'ar'
                                ? 'جميع الحقوق محفوظة © 2026 المكتب الوطني للحبوب والقطاني'
                                : 'Tous droits réservés © 2026 ONICL'
                            }
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
