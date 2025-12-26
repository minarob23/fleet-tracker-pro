import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Bell, X, LogOut, MessageSquare, Menu, Truck, Loader2, Database, CheckCircle, RefreshCw, BarChart3, MapIcon, TrendingUp, FileText, Smartphone, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ArrivalQueue from '@/components/dashboard/ArrivalQueue';
import AddTruckForm from '@/components/dashboard/AddTruckForm';
import ReportingTable from '@/components/dashboard/ReportingTable';
import FilterableReportsTable from '@/components/dashboard/FilterableReportsTable';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import TrackingMap from '@/components/dashboard/TrackingMap';
import TruckCheckModal from '@/components/dashboard/TruckCheckModal';
import TruckList from '@/components/dashboard/TruckList';
import StatsCards from '@/components/dashboard/StatsCards';
import WhatsAppSender from '@/components/dashboard/WhatsAppSender';
import GeofenceManager from '@/components/dashboard/GeofenceManager';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNeonDB } from '@/hooks/useNeonDB';
import { Truck as TruckType } from '@/types/truck';
import GPSDeviceManager from '@/components/dashboard/GPSDeviceManager';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<TruckType | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Default to light mode
    return false;
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'stats' | 'analytics' | 'reports'>('map');

  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const {
    trucks,
    geofences,
    loading,
    error,
    addTruck,
    updateTruck,
    deleteTruck,
    markAsArrived,
    updateTruckLocation,
    updateTruckStatus,
    addGeofence,
    deleteGeofence,
    sendWhatsApp,
    refreshData,
    dbStatus
  } = useNeonDB();

  // Real GPS updates come from webhook endpoint: /api/gps/webhook

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

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('تم الاتصال بالإنترنت');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('انقطع الاتصال بالإنترنت');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendWhatsApp = (truck: TruckType) => {
    const defaultMessage = `مرحباً ${truck.driverName}،\nأنت الآن في الطريق إلى ${truck.destination || 'الوجهة'}.\nيرجى التواصل معنا عند الوصول.`;
    sendWhatsApp(truck, defaultMessage);
  };

  // Navigate to truck on map with zoom and pan
  const navigateToTruckOnMap = (truck: TruckType) => {
    // Switch to map tab
    setActiveTab('map');
    // Select the truck (this will trigger map to focus on it)
    setSelectedTruck(truck);
    // Open sidebar to show truck details
    setSidebarOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-bold mb-2">جاري تحميل البيانات</h2>
          <p className="text-muted-foreground">يرجى الانتظار...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-card sticky top-0 z-50 border-b border-border"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">نظام تتبع الشاحنات</h1>
              <p className="text-sm text-muted-foreground">ONICL</p>
            </div>

            {/* Toggle Sidebar Button - Next to Title */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="gap-2 mr-2"
            >
              <Menu className="w-4 h-4" />
              قائمة الشاحنات
            </Button>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Date and Time Display */}
            <div className="hidden lg:flex flex-col items-end px-4 py-2 bg-card/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span>{currentTime.toLocaleDateString('ar-SA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="text-2xl font-bold text-primary tabular-nums">
                {currentTime.toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>

            {/* Connection Status - Beautiful Animated with Frame */}
            <div className="px-4 py-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-lg shadow-green-500/10">
              <div className="flex items-center gap-3">
                {/* Animated Connection Indicator */}
                <div className="relative">
                  {/* Pulse rings */}
                  {isOnline && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                      <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse"
                        style={{ animationDelay: '0.5s' }} />
                    </>
                  )}

                  {/* Main indicator */}
                  <div className={`relative w-3 h-3 rounded-full ${isOnline
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/50'
                    : 'bg-gradient-to-r from-red-400 to-rose-500 shadow-lg shadow-red-500/50'
                    }`}>
                    {/* Inner glow */}
                    <div className={`absolute inset-0 rounded-full blur-sm ${isOnline ? 'bg-green-300' : 'bg-red-300'
                      }`} />
                  </div>
                </div>

                {/* Status Text with gradient */}
                <span className={`font-bold text-lg ${isOnline
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent'
                  }`}>
                  {isOnline ? (language === 'ar' ? 'متصل' : 'Connecté') : (language === 'ar' ? 'غير متصل' : 'Déconnecté')}
                </span>
              </div>
            </div>

            {/* Database Status - Beautiful Animated with Frame */}
            <div className={`px-4 py-2 rounded-xl border-2 shadow-lg ${dbStatus === 'connected'
              ? 'bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-200 dark:border-sky-800 shadow-sky-500/10'
              : dbStatus === 'connecting'
                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800 shadow-amber-500/10'
                : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border-gray-200 dark:border-gray-800 shadow-gray-500/10'
              }`}>
              <div className="flex items-center gap-3">
                {/* Animated DB Indicator */}
                <div className="relative">
                  {/* Pulse rings */}
                  {dbStatus === 'connected' && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-sky-500/30 animate-ping" />
                      <div className="absolute inset-0 rounded-full bg-sky-500/20 animate-pulse"
                        style={{ animationDelay: '0.3s' }} />
                    </>
                  )}

                  {/* Main indicator */}
                  <div className={`relative w-3 h-3 rounded-full ${dbStatus === 'connected'
                    ? 'bg-gradient-to-r from-sky-400 to-blue-500 shadow-lg shadow-sky-500/50'
                    : dbStatus === 'connecting'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/50 animate-pulse'
                      : 'bg-gradient-to-r from-gray-400 to-slate-500 shadow-lg shadow-gray-500/50'
                    }`}>
                    {/* Inner glow */}
                    <div className={`absolute inset-0 rounded-full blur-sm ${dbStatus === 'connected' ? 'bg-sky-300' :
                      dbStatus === 'connecting' ? 'bg-amber-300' : 'bg-gray-300'
                      }`} />
                  </div>
                </div>

                {/* DB Icon and Text */}
                <div className="flex items-center gap-2">
                  <Database className={`w-5 h-5 ${dbStatus === 'connected' ? 'text-sky-600' :
                    dbStatus === 'connecting' ? 'text-amber-600 animate-pulse' : 'text-gray-600'
                    }`} />
                  <span className={`font-bold text-lg ${dbStatus === 'connected'
                    ? 'bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent'
                    : dbStatus === 'connecting'
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent'
                    }`}>
                    {dbStatus === 'connected' ? 'قاعدة البيانات' :
                      dbStatus === 'connecting' ? 'جاري الاتصال...' : 'غير متصل'}
                  </span>
                </div>
              </div>
            </div>


            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
                <div className="text-right">
                  <p className="text-sm font-bold">{user.email}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {user.role === 'admin' && '👑 مدير النظام'}
                    {user.role === 'central_office' && '🏢 المكتب المركزي'}
                    {user.role === 'city_staff' && user.city}
                    {user.role === 'supplier' && user.supplier_name}
                  </p>
                </div>
              </div>
            )}

            {/* Telegram Security Button - Hidden from city_staff */}
            {user?.role !== 'city_staff' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/telegram-security')}
                className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                title={t('dashboard.telegramSecurity')}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:inline">{t('dashboard.telegramSecurity')}</span>
              </Button>
            )}

            {/* Language Switcher */}
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

            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              disabled={loading}
              className="relative"
              title={language === 'ar' ? 'إعادة تحميل الصفحة' : 'Recharger la page'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="relative"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title={language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
            >
              <LogOut className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell className="w-5 h-5" />
              {trucks.filter(t => t.status === 'arrived').length > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                  {trucks.filter(t => t.status === 'arrived').length}
                </Badge>
              )}
            </Button>

            {user?.role !== 'central_office' && user?.role !== 'city_staff' && <AddTruckForm onAddTruck={addTruck} />}
          </div>
        </div>
      </motion.header>
      {/* Main Content */}
      <div className="flex">
        {/* Compact Sidebar - Right Side */}
        <motion.aside
          initial={{ x: 400 }}
          animate={{
            x: sidebarOpen ? 0 : 400
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-20 right-0 w-96 h-[calc(100vh-5rem)] bg-card border-l border-border z-60 overflow-hidden flex flex-col shadow-2xl shadow-black/20"
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">{language === 'ar' ? 'قائمة الشاحنات' : 'Liste des camions'}</h2>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {trucks.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Truck List */}
          <div className="flex-1 overflow-y-auto p-3">
            <TruckList
              trucks={trucks}
              onSelectTruck={setSelectedTruck}
              onMarkArrived={(truck) => markAsArrived(truck.id)}
              onSendWhatsApp={handleSendWhatsApp}
              onUpdateTruck={updateTruck}
              onDeleteTruck={deleteTruck}
            />
          </div>
        </motion.aside>

        {/* Main Content */}
        <main
          className="flex-1 overflow-auto p-6 transition-all duration-300"
          style={{
            paddingRight: sidebarOpen ? '450px' : '24px', // 384px sidebar + 66px extra padding
          }}
        >
          {/* Tabs Navigation */}
          <div className="glass-card mb-6">
            <div className="flex gap-2 p-2 overflow-x-auto">
              <Button
                variant={activeTab === 'map' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('map')}
                className="gap-2 whitespace-nowrap"
              >
                <MapIcon className="w-4 h-4" />
                {language === 'ar' ? 'الخريطة' : 'Carte'}
              </Button>
              <Button
                variant={activeTab === 'stats' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('stats')}
                className="gap-2 whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4" />
                {language === 'ar' ? 'الإحصائيات' : 'Statistiques'}
              </Button>
              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('analytics')}
                className="gap-2 whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4" />
                {language === 'ar' ? 'التحليلات' : 'Analyses'}
              </Button>
              <Button
                variant={activeTab === 'reports' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('reports')}
                className="gap-2 whitespace-nowrap"
              >
                <FileText className="w-4 h-4" />
                {language === 'ar' ? 'التقارير' : 'Rapports'}
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Map Tab */}
            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-[calc(100vh-200px)]"
              >
                <TrackingMap
                  trucks={trucks}
                  geofences={geofences}
                  selectedTruck={selectedTruck}
                  onSelectTruck={setSelectedTruck}
                  isDarkMode={isDarkMode}
                />
              </motion.div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <StatsCards trucks={trucks} />
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AnalyticsDashboard trucks={trucks} />
              </motion.div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-[calc(100vh-200px)]"
              >
                <FilterableReportsTable
                  trucks={trucks}
                  onSelectTruck={(truck) => {
                    setSelectedTruck(truck);
                    setActiveTab('map');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div >

      {/* Notifications Panel */}
      {
        notificationsOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 w-80 max-h-96 glass-card p-4 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                الإشعارات
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {trucks.filter(t => t.status === 'arrived').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد إشعارات جديدة</p>
                </div>
              ) : (
                trucks
                  .filter(t => t.status === 'arrived')
                  .map((truck) => (
                    <motion.div
                      key={truck.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative p-3 bg-success/10 border border-success/30 rounded-lg cursor-pointer hover:bg-success/20 transition-colors group"
                      onClick={() => {
                        setSelectedTruck(truck);
                        setActiveTab('map');
                        setNotificationsOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{truck.plateNumber}</p>
                          <p className="text-xs text-muted-foreground">{truck.driverName}</p>
                          <p className="text-xs text-success mt-1">
                            ✅ وصلت الشاحنة - رقم الوصول: {truck.arrivalNumber}
                          </p>
                        </div>
                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Change status to depot to remove from notifications
                            updateTruckStatus(truck.id, 'depot');
                            toast.success('تم إزالة الإشعار');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>
          </motion.div>
        )
      }

      {/* Notifications Overlay */}
      {
        notificationsOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setNotificationsOpen(false)}
          />
        )
      }

    </div >
  );
};

export default Dashboard;
