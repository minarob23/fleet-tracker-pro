import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UserPlus, Ticket, Clock, Check, X, Copy, Plus, Trash2, ArrowLeft, Sparkles, Moon, Sun, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface WhitelistUser {
    id: number;
    telegram_user_id: string;
    user_name: string;
    role: string;
    created_at: string;
}

interface InvitationCode {
    id: number;
    code: string;
    driver_name: string;
    expires_at: string;
    is_used: boolean;
    used_at?: string;
}

interface PendingApproval {
    id: number;
    telegram_user_id: string;
    user_name: string;
    request_message: string;
    created_at: string;
}

const TelegramSecurity = () => {
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [whitelist, setWhitelist] = useState<WhitelistUser[]>([]);
    const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newUserName, setNewUserName] = useState('');
    const [newUserId, setNewUserId] = useState('');
    const [newDriverName, setNewDriverName] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return false;
    });

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

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [whitelistRes, codesRes, approvalsRes] = await Promise.all([
                fetch('/api/telegram-security/whitelist', { headers }),
                fetch('/api/telegram-security/invitation-codes', { headers }),
                fetch('/api/telegram-security/pending-approvals', { headers })
            ]);

            const whitelistData = await whitelistRes.json();
            const codesData = await codesRes.json();
            const approvalsData = await approvalsRes.json();

            setWhitelist(whitelistData.whitelist || []);
            setInvitationCodes(codesData.codes || []);
            setPendingApprovals(approvalsData.approvals || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToWhitelist = async () => {
        if (!newUserName || !newUserId) {
            toast.error('يرجى ملء جميع الحقول');
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/telegram-security/whitelist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    telegram_user_id: newUserId,
                    user_name: newUserName,
                    role: 'driver'
                })
            });

            if (response.ok) {
                toast.success('✅ تمت الإضافة بنجاح');
                setNewUserName('');
                setNewUserId('');
                fetchData();
            }
        } catch (error) {
            toast.error('❌ فشل في الإضافة');
        }
    };

    const createInvitationCode = async () => {
        if (!newDriverName) {
            toast.error('يرجى إدخال اسم السائق');
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/telegram-security/invitation-codes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ driver_name: newDriverName })
            });

            const data = await response.json();
            if (data.code) {
                toast.success(`🎉 تم إنشاء الكود: ${data.code}`);
                navigator.clipboard.writeText(data.code);
                toast.info('📋 تم نسخ الكود تلقائياً');
                setNewDriverName('');
                fetchData();
            }
        } catch (error) {
            toast.error('❌ فشل في إنشاء الكود');
        }
    };

    const approveRequest = async (id: number) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/telegram-security/approve/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('✅ تمت الموافقة بنجاح');
                fetchData();
            }
        } catch (error) {
            toast.error('❌ فشل في الموافقة');
        }
    };

    const rejectRequest = async (id: number) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/telegram-security/reject/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('تم الرفض');
                fetchData();
            }
        } catch (error) {
            toast.error('❌ فشل في الرفض');
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('📋 تم نسخ الكود');
    };

    const deleteCode = async (id: number) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/telegram-security/invitation-codes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success('🗑️ تم حذف الكود');
                fetchData();
            }
        } catch (error) {
            toast.error('❌ فشل في الحذف');
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/telegram-security/whitelist/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success('🗑️ تم حذف المستخدم');
                fetchData();
            }
        } catch (error) {
            toast.error('❌ فشل في الحذف');
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (diff < 0) return 'منتهي';
        if (hours > 0) return `${hours} ساعة`;
        return `${minutes} دقيقة`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h2 className="text-xl font-bold mb-2">جاري تحميل البيانات</h2>
                    <p className="text-muted-foreground">يرجى الانتظار...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header - Same style as Dashboard */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="glass-card sticky top-0 z-50 border-b border-border"
            >
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <Shield className="w-8 h-8 text-primary" />
                        <div>
                            <h1 className="text-xl font-bold">{t('telegramSecurity.title')}</h1>
                            <p className="text-sm text-muted-foreground">{t('telegramSecurity.subtitle')}</p>
                        </div>
                    </div>

                    {/* Stats - Same style as Dashboard */}
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-card/50 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-500" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('telegramSecurity.pendingRequests')}</div>
                                    <div className="text-lg font-bold">{pendingApprovals.length}</div>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-card/50 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-primary" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('telegramSecurity.activeCodes')}</div>
                                    <div className="text-lg font-bold">{invitationCodes.filter(c => !c.is_used).length}</div>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-card/50 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-green-500" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('telegramSecurity.authorizedUsers')}</div>
                                    <div className="text-lg font-bold">{whitelist.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Language Toggle Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
                            className="gap-2"
                            title={language === 'ar' ? 'Passer au français' : 'التبديل للعربية'}
                        >
                            <Languages className="w-4 h-4" />
                            <span className="hidden lg:inline">
                                {language === 'ar' ? '🇫🇷 Français' : '🇪🇬 العربية'}
                            </span>
                            <span className="lg:hidden">
                                {language === 'ar' ? 'FR' : 'AR'}
                            </span>
                        </Button>

                        {/* Theme Toggle Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="relative"
                            title={isDarkMode ? (language === 'ar' ? 'الوضع النهاري' : 'Mode clair') : (language === 'ar' ? 'الوضع الليلي' : 'Mode sombre')}
                        >
                            {isDarkMode ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-slate-700" />
                            )}
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <div className="container mx-auto p-6 space-y-6 max-w-7xl">
                {/* Pending Approvals */}
                {pendingApprovals.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 border-2 border-yellow-500/30"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-xl font-bold">{t('telegramSecurity.requestsNeedApproval')} ({pendingApprovals.length})</h2>
                        </div>
                        <div className="space-y-4">
                            {pendingApprovals.map((approval, index) => (
                                <motion.div
                                    key={approval.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass-card p-4 border border-border hover:border-primary/50 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                                                    {approval.user_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{approval.user_name}</div>
                                                    <Badge variant="outline" className="font-mono text-xs">{approval.telegram_user_id}</Badge>
                                                </div>
                                            </div>
                                            <div className="glass-card p-3 bg-muted/50">
                                                <p className="text-sm">{approval.request_message}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(approval.created_at).toLocaleString('ar-SA')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                onClick={() => approveRequest(approval.id)}
                                                className="bg-green-500 hover:bg-green-600"
                                            >
                                                <Check className="w-4 h-4 ml-1" />
                                                {t('telegramSecurity.approve')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => rejectRequest(approval.id)}
                                                className="border-red-500/50 hover:bg-red-500/10"
                                            >
                                                <X className="w-4 h-4 ml-1" />
                                                {t('telegramSecurity.reject')}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Invitation Codes */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Ticket className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold">{t('telegramSecurity.invitationCodes')}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{t('telegramSecurity.invitationCodesDesc')}</p>

                        {/* Create Form */}
                        <div className="glass-card p-4 mb-4 bg-primary/5">
                            <Label className="text-sm font-medium mb-2 block">{t('telegramSecurity.createNewCode')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t('telegramSecurity.driverName')}
                                    value={newDriverName}
                                    onChange={(e) => setNewDriverName(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={createInvitationCode}>
                                    <Plus className="w-4 h-4 ml-1" />
                                    {t('telegramSecurity.create')}
                                </Button>
                            </div>
                        </div>

                        {/* Codes List */}
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {invitationCodes.slice(0, 10).map((code, index) => (
                                <motion.div
                                    key={code.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-4 hover:border-primary/50 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <code className="text-xl font-mono font-bold text-primary">
                                                    {code.code}
                                                </code>
                                                {code.is_used ? (
                                                    <Badge variant="secondary">{t('telegramSecurity.used')} ✓</Badge>
                                                ) : (
                                                    <Badge className="bg-green-500">{t('telegramSecurity.active')}</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <div>👤 {code.driver_name}</div>
                                                <div>⏰ {t('telegramSecurity.expiresIn')}: {getTimeRemaining(code.expires_at)}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => copyCode(code.code)}
                                                disabled={code.is_used}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteCode(code.id)}
                                                className="border-red-500/50 hover:bg-red-500/10 text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Whitelist */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="w-5 h-5 text-green-500" />
                            <h2 className="text-xl font-bold">{t('telegramSecurity.whitelist')} ({whitelist.length})</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{t('telegramSecurity.whitelistDesc')}</p>

                        {/* Add Form */}
                        <div className="glass-card p-4 mb-4 bg-green-500/5">
                            <Label className="text-sm font-medium mb-2 block">{t('telegramSecurity.addNewUser')}</Label>
                            <div className="space-y-2">
                                <Input
                                    placeholder={t('telegramSecurity.userName')}
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                />
                                <Input
                                    placeholder={t('telegramSecurity.telegramId')}
                                    value={newUserId}
                                    onChange={(e) => setNewUserId(e.target.value)}
                                />
                                <Button onClick={addToWhitelist} className="w-full bg-green-500 hover:bg-green-600">
                                    <Plus className="w-4 h-4 ml-1" />
                                    {t('telegramSecurity.addToList')}
                                </Button>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {whitelist.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-4 hover:border-green-500/50 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                                                {user.user_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{user.user_name}</p>
                                                <p className="text-sm text-muted-foreground font-mono">{user.telegram_user_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-500">{user.role}</Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteUser(user.telegram_user_id)}
                                                className="border-red-500/50 hover:bg-red-500/10 text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default TelegramSecurity;
