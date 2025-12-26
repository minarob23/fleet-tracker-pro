import { useEffect, useCallback } from 'react';
import { Truck } from '@/types/truck';
import { updateTruckLocation, predefinedRoutes } from '@/lib/gps-simulator';

interface UseGPSSimulatorProps {
    trucks: Truck[];
    onLocationUpdate: (truckId: string, latitude: number, longitude: number, speed: number) => void;
    onStatusUpdate?: (truckId: string, status: Truck['status']) => void;
    enabled?: boolean;
    updateInterval?: number; // بالميلي ثانية
}

// خريطة لتخزين الأهداف لكل شاحنة
const truckTargets = new Map<string, { lat: number; lng: number }>();

export const useGPSSimulator = ({
    trucks,
    onLocationUpdate,
    onStatusUpdate,
    enabled = false,
    updateInterval = 3000, // تحديث كل 3 ثواني
}: UseGPSSimulatorProps) => {

    const updateTruckPositions = useCallback(() => {
        trucks.forEach((truck) => {
            // تخطي الشاحنات التي وصلت
            if (truck.status === 'arrived') return;

            // الحصول على الهدف أو إنشاء واحد جديد
            let target = truckTargets.get(truck.id);
            if (!target) {
                // اختيار مسار عشوائي
                const routes = Object.values(predefinedRoutes);
                const randomRoute = routes[Math.floor(Math.random() * routes.length)];
                target = randomRoute.end;
                truckTargets.set(truck.id, target);
            }

            // تحديث موقع الشاحنة
            const newLocation = updateTruckLocation(truck, target.lat, target.lng);

            // إرسال تحديث الموقع
            onLocationUpdate(
                truck.id,
                newLocation.latitude,
                newLocation.longitude,
                newLocation.speed
            );

            // إرسال تحديث الحالة إذا تغيرت
            if (onStatusUpdate && newLocation.status !== truck.status) {
                onStatusUpdate(truck.id, newLocation.status);
            }

            // إذا وصلت الشاحنة، حذف الهدف
            if (newLocation.status === 'arrived') {
                truckTargets.delete(truck.id);
            }
        });
    }, [trucks, onLocationUpdate, onStatusUpdate]);

    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(updateTruckPositions, updateInterval);

        return () => clearInterval(interval);
    }, [enabled, updateInterval, updateTruckPositions]);

    return {
        isSimulating: enabled,
    };
};
