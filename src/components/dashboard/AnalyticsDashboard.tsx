import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from 'recharts';
import { TrendingUp, Activity, MapPin, Truck as TruckIcon, Clock, Package, Zap, Target } from 'lucide-react';
import { Truck } from '@/types/truck';

interface AnalyticsDashboardProps {
  trucks: Truck[];
}

const AnalyticsDashboard = ({ trucks }: AnalyticsDashboardProps) => {
  // Status distribution
  const statusData = useMemo(() => {
    const counts = {
      waiting: trucks.filter(t => t.status === 'waiting').length,
      en_route: trucks.filter(t => t.status === 'en_route').length,
      arrived: trucks.filter(t => t.status === 'arrived').length,
      depot: trucks.filter(t => t.status === 'depot').length,
      discharged: trucks.filter(t => t.status === 'discharged').length,
    };

    return [
      { name: 'في الانتظار', value: counts.waiting, color: '#f59e0b', icon: '⏸️' },
      { name: 'في الطريق', value: counts.en_route, color: '#0ea5e9', icon: '🚚' },
      { name: 'وصلت', value: counts.arrived, color: '#10b981', icon: '✅' },
      { name: 'المخزن', value: counts.depot, color: '#8b5cf6', icon: '🏪' },
      { name: 'منزلة', value: counts.discharged, color: '#64748b', icon: '📦' },
    ];
  }, [trucks]);

  // Daily arrivals (last 7 days)
  const dailyArrivals = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const arrivals = trucks.filter(truck => {
        const updateDate = new Date(truck.lastUpdate);
        return truck.status === 'arrived' && updateDate >= dayStart && updateDate <= dayEnd;
      }).length;

      const enRoute = trucks.filter(truck => {
        const updateDate = new Date(truck.lastUpdate);
        return truck.status === 'en_route' && updateDate >= dayStart && updateDate <= dayEnd;
      }).length;

      const waiting = trucks.filter(truck => {
        const updateDate = new Date(truck.lastUpdate);
        return truck.status === 'waiting' && updateDate >= dayStart && updateDate <= dayEnd;
      }).length;

      return {
        day: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
        arrivals,
        enRoute,
        waiting,
      };
    });
  }, [trucks]);

  // Speed by status
  const speedByStatus = useMemo(() => {
    const statuses = ['waiting', 'en_route', 'arrived', 'depot', 'discharged'];
    return statuses.map(status => {
      const trucksInStatus = trucks.filter(t => t.status === status);
      const avgSpeed = trucksInStatus.length > 0
        ? trucksInStatus.reduce((sum, t) => sum + t.speed, 0) / trucksInStatus.length
        : 0;

      return {
        status: status === 'en_route' ? 'في الطريق' :
          status === 'waiting' ? 'انتظار' :
            status === 'arrived' ? 'وصلت' :
              status === 'depot' ? 'مخزن' : 'منزلة',
        speed: Math.round(avgSpeed),
        maxSpeed: Math.round(avgSpeed * 1.3),
        avgSpeed: Math.round(avgSpeed * 0.8),
      };
    });
  }, [trucks]);

  // Performance radar data - calculated from real truck data
  const performanceData = useMemo(() => {
    const totalTrucks = trucks.length;
    if (totalTrucks === 0) {
      return [
        { metric: 'السرعة', value: 0, fullMark: 100 },
        { metric: 'الكفاءة', value: 0, fullMark: 100 },
        { metric: 'الالتزام', value: 0, fullMark: 100 },
        { metric: 'السلامة', value: 0, fullMark: 100 },
        { metric: 'التوفر', value: 0, fullMark: 100 },
      ];
    }

    // Speed: average speed as percentage of max (assuming 120 km/h max)
    const avgSpeed = trucks.reduce((sum, t) => sum + t.speed, 0) / totalTrucks;
    const speedScore = Math.min(100, Math.round((avgSpeed / 120) * 100));

    // Efficiency: percentage of trucks that are en_route or arrived
    const activeTrucks = trucks.filter(t => t.status === 'en_route' || t.status === 'arrived').length;
    const efficiencyScore = Math.round((activeTrucks / totalTrucks) * 100);

    // Compliance: percentage of trucks that arrived (completed their journey)
    const arrivedTrucks = trucks.filter(t => t.status === 'arrived' || t.status === 'discharged').length;
    const complianceScore = Math.round((arrivedTrucks / totalTrucks) * 100);

    // Safety: inverse of average speed (slower = safer), normalized
    const safetyScore = Math.min(100, Math.round(100 - (avgSpeed / 120) * 30));

    // Availability: percentage of trucks not waiting
    const availableTrucks = trucks.filter(t => t.status !== 'waiting').length;
    const availabilityScore = Math.round((availableTrucks / totalTrucks) * 100);

    return [
      { metric: 'السرعة', value: speedScore, fullMark: 100 },
      { metric: 'الكفاءة', value: efficiencyScore, fullMark: 100 },
      { metric: 'الالتزام', value: complianceScore, fullMark: 100 },
      { metric: 'السلامة', value: safetyScore, fullMark: 100 },
      { metric: 'التوفر', value: availabilityScore, fullMark: 100 },
    ];
  }, [trucks]);

  // Hourly activity - calculated from real truck update times
  const hourlyActivity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(today);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(today);
      hourEnd.setHours(hour, 59, 59, 999);

      const activeTrucks = trucks.filter(truck => {
        const updateDate = new Date(truck.lastUpdate);
        return updateDate >= hourStart && updateDate <= hourEnd &&
          (truck.status === 'en_route' || truck.status === 'arrived');
      }).length;

      const idleTrucks = trucks.filter(truck => {
        const updateDate = new Date(truck.lastUpdate);
        return updateDate >= hourStart && updateDate <= hourEnd &&
          (truck.status === 'waiting' || truck.status === 'depot');
      }).length;

      return {
        hour: `${hour}:00`,
        active: activeTrucks,
        idle: idleTrucks,
      };
    });
  }, [trucks]);

  // Key metrics
  const metrics = useMemo(() => {
    const totalTrucks = trucks.length;
    const activeTrucks = trucks.filter(t => t.status === 'en_route').length;
    const arrivedToday = trucks.filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return t.status === 'arrived' && new Date(t.lastUpdate) >= today;
    }).length;
    const avgSpeed = trucks.length > 0
      ? Math.round(trucks.reduce((sum, t) => sum + t.speed, 0) / trucks.length)
      : 0;

    return { totalTrucks, activeTrucks, arrivedToday, avgSpeed };
  }, [trucks]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl p-3 shadow-2xl">
          <p className="font-bold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">إجمالي الشاحنات</span>
            <TruckIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{metrics.totalTrucks}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-2 border-sky-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">في الطريق</span>
            <Activity className="w-5 h-5 text-sky-500" />
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">{metrics.activeTrucks}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">وصلت اليوم</span>
            <MapPin className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{metrics.arrivedToday}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">متوسط السرعة</span>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{metrics.avgSpeed} <span className="text-lg">كم/س</span></div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution - Vertical Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-2 border-purple-500/20"
        >
          <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-500" />
            توزيع الحالات
          </h3>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart
              data={statusData}
              margin={{ top: 40, right: 30, left: 30, bottom: 20 }}
            >
              <defs>
                {statusData.map((entry, index) => (
                  <linearGradient key={`gradient-${index}`} id={`statusGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
              <XAxis
                dataKey="name"
                stroke="#1f2937"
                style={{ fontSize: '22px', fontWeight: 'bold' }}
                tick={{ fill: '#1f2937' }}
              />
              <YAxis
                stroke="#1f2937"
                style={{ fontSize: '22px', fontWeight: 'bold' }}
                tick={{ fill: '#1f2937' }}
              />
              <Tooltip
                content={<CustomTooltip />}
                contentStyle={{ fontSize: '20px', fontWeight: 'bold', padding: '16px' }}
              />
              <Bar
                dataKey="value"
                radius={[12, 12, 0, 0]}
                label={({ value, x, y, width }) => (
                  <g>
                    <text
                      x={x + width / 2}
                      y={y - 15}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontSize: '44px',
                        fontWeight: 'bold',
                        textShadow: '4px 4px 10px rgba(0,0,0,1), 0 0 25px rgba(0,0,0,0.9), 2px 2px 5px rgba(0,0,0,1)'
                      }}
                    >
                      {value}
                    </text>
                  </g>
                )}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#statusGradient${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Performance Radar Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-2 border-purple-500/20"
        >
          <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-500" />
            مؤشرات الأداء
          </h3>
          <ResponsiveContainer width="100%" height={600}>
            <RadarChart data={performanceData}>
              <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <PolarGrid
                stroke="#a855f7"
                strokeWidth={3}
                strokeOpacity={0.5}
              />
              <PolarAngleAxis
                dataKey="metric"
                stroke="#a855f7"
                style={{ fontSize: '20px', fontWeight: 'bold' }}
                tick={{ fill: '#a855f7', fontSize: 20, fontWeight: 'bold' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                stroke="#ec4899"
                strokeWidth={2}
                style={{ fontSize: '20px', fontWeight: 'bold' }}
                tick={{ fill: '#ec4899', fontSize: 20, fontWeight: 'bold' }}
              />
              <Radar
                name="الأداء"
                dataKey="value"
                stroke="#ec4899"
                fill="url(#radarGradient)"
                fillOpacity={0.8}
                strokeWidth={6}
                label={({ cx, cy, value, index }) => {
                  const RADIAN = Math.PI / 180;
                  const angle = 90 - (index * 360 / 5); // 5 data points
                  const outerRadius = 250; // Much further outside to avoid overlap
                  const x = cx + outerRadius * Math.cos(-angle * RADIAN);
                  const y = cy + outerRadius * Math.sin(-angle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        textShadow: '3px 3px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.9)'
                      }}
                    >
                      {value}
                    </text>
                  );
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                contentStyle={{ fontSize: '20px', fontWeight: 'bold', padding: '16px' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '22px', fontWeight: 'bold', paddingTop: '24px' }}
                iconSize={28}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Arrivals - Enhanced Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-2 border-green-500/20"
        >
          <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-500" />
            النشاط اليومي (آخر 7 أيام)
          </h3>
          <ResponsiveContainer width="100%" height={600}>
            <AreaChart data={dailyArrivals}>
              <defs>
                <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorEnRoute" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorWaiting" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="arrivals" stroke="#10b981" fillOpacity={1} fill="url(#colorArrivals)" name="وصلت" strokeWidth={3} />
              <Area type="monotone" dataKey="enRoute" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorEnRoute)" name="في الطريق" strokeWidth={3} />
              <Area type="monotone" dataKey="waiting" stroke="#f59e0b" fillOpacity={1} fill="url(#colorWaiting)" name="انتظار" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Speed Comparison - Composed Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-gradient-to-br from-rose-500/5 to-pink-500/5 border-2 border-rose-500/20"
        >
          <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="w-6 h-6 text-rose-500" />
            تحليل السرعة
          </h3>
          <ResponsiveContainer width="100%" height={600}>
            <ComposedChart data={speedByStatus}>
              <defs>
                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="status" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="speed" fill="url(#speedGradient)" radius={[8, 8, 0, 0]} name="السرعة الفعلية" />
              <Line type="monotone" dataKey="maxSpeed" stroke="#f43f5e" strokeWidth={3} name="السرعة القصوى" dot={{ r: 6 }} />
              <Line type="monotone" dataKey="avgSpeed" stroke="#ec4899" strokeWidth={2} strokeDasharray="5 5" name="المتوسط" />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 3 - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-2 border-violet-500/20"
      >
        <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
          <Clock className="w-6 h-6 text-violet-500" />
          النشاط على مدار الساعة
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={hourlyActivity}>
            <defs>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="idleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey="hour" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="active" stroke="#8b5cf6" fillOpacity={1} fill="url(#activeGradient)" name="نشط" strokeWidth={3} />
            <Area type="monotone" dataKey="idle" stroke="#64748b" fillOpacity={1} fill="url(#idleGradient)" name="خامل" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
