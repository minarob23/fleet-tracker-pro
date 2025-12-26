import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Truck } from '@/types/truck';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GPSHistoryViewerProps {
    truck: Truck;
}

interface LocationHistory {
    id: string;
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: Date;
    address?: string;
}

const GPSHistoryViewer = ({ truck }: GPSHistoryViewerProps) => {
    const [history] = useState<LocationHistory[]>([
        // Mock data - في الإنتاج، سيتم جلبها من API
        {
            id: '1',
            latitude: truck.latitude,
            longitude: truck.longitude,
            speed: truck.speed,
            timestamp: new Date(truck.lastUpdate),
            address: truck.destination
        }
    ]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const totalDistance = history.reduce((total, point, index) => {
        if (index === 0) return 0;
        const prev = history[index - 1];
        return total + calculateDistance(prev.latitude, prev.longitude, point.latitude, point.longitude);
    }, 0);

    const avgSpeed = history.length > 0
        ? history.reduce((sum, point) => sum + point.speed, 0) / history.length
        : 0;

    return (
        <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">المسافة الكلية</span>
                    </div>
                    <div className="text-2xl font-bold">{totalDistance.toFixed(2)} كم</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-sky-500" />
                        <span className="text-sm text-muted-foreground">متوسط السرعة</span>
                    </div>
                    <div className="text-2xl font-bold text-sky-500">{avgSpeed.toFixed(0)} كم/س</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <History className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">عدد النقاط</span>
                    </div>
                    <div className="text-2xl font-bold text-green-500">{history.length}</div>
                </motion.div>
            </div>

            {/* History Timeline */}
            <div className="glass-card p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <History className="w-5 h-5" />
                    سجل المواقع
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.map((point, index) => (
                        <motion.div
                            key={point.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        {formatDate(point.timestamp)}
                                    </span>
                                </div>

                                <div className="text-sm text-muted-foreground mb-2">
                                    {point.address || `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        {point.speed} كم/س
                                    </Badge>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                            // فتح الموقع في خرائط جوجل
                                            window.open(
                                                `https://www.google.com/maps?q=${point.latitude},${point.longitude}`,
                                                '_blank'
                                            );
                                        }}
                                    >
                                        عرض على الخريطة
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {history.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>لا يوجد سجل مواقع متاح</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GPSHistoryViewer;
