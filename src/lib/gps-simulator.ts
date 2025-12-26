import { Truck } from '@/types/truck';

// محاكاة حركة الشاحنة بين نقطتين
export const simulateTruckMovement = (
    currentLat: number,
    currentLng: number,
    targetLat: number,
    targetLng: number,
    speed: number = 0.0001 // سرعة الحركة (كلما زادت كلما كانت الحركة أسرع)
): { latitude: number; longitude: number; speed: number } => {
    // حساب المسافة بين الموقع الحالي والهدف
    const latDiff = targetLat - currentLat;
    const lngDiff = targetLng - currentLng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // إذا وصلت الشاحنة للهدف
    if (distance < speed) {
        return {
            latitude: targetLat,
            longitude: targetLng,
            speed: 0,
        };
    }

    // حساب الموقع الجديد
    const ratio = speed / distance;
    const newLat = currentLat + latDiff * ratio;
    const newLng = currentLng + lngDiff * ratio;

    // حساب السرعة بالكيلومتر/ساعة (تقريبي)
    const calculatedSpeed = Math.floor(Math.random() * 30) + 60; // سرعة عشوائية بين 60-90 كم/س

    return {
        latitude: newLat,
        longitude: newLng,
        speed: calculatedSpeed,
    };
};

// مسارات محددة مسبقاً للشاحنات (أمثلة لمدن سعودية)
export const predefinedRoutes = {
    riyadhToJeddah: {
        start: { lat: 24.7136, lng: 46.6753 }, // الرياض
        end: { lat: 21.4858, lng: 39.1925 },   // جدة
    },
    riyadhToDammam: {
        start: { lat: 24.7136, lng: 46.6753 }, // الرياض
        end: { lat: 26.4207, lng: 50.0888 },   // الدمام
    },
    jeddahToMadinah: {
        start: { lat: 21.4858, lng: 39.1925 }, // جدة
        end: { lat: 24.4539, lng: 39.6142 },   // المدينة
    },
    dammamToRiyadh: {
        start: { lat: 26.4207, lng: 50.0888 }, // الدمام
        end: { lat: 24.7136, lng: 46.6753 },   // الرياض
    },
};

// الحصول على مسار عشوائي
export const getRandomRoute = () => {
    const routes = Object.values(predefinedRoutes);
    return routes[Math.floor(Math.random() * routes.length)];
};

// تحديث موقع الشاحنة نحو الهدف
export const updateTruckLocation = (
    truck: Truck,
    targetLat: number,
    targetLng: number
): { latitude: number; longitude: number; speed: number; status: Truck['status'] } => {
    const movement = simulateTruckMovement(
        truck.latitude,
        truck.longitude,
        targetLat,
        targetLng
    );

    // تحديد حالة الشاحنة بناءً على السرعة
    let status: Truck['status'] = 'en_route';

    if (movement.speed === 0) {
        // إذا كانت السرعة صفر، الشاحنة وصلت
        status = 'arrived';
    } else if (movement.speed > 0 && movement.speed < 10) {
        // سرعة منخفضة جداً = في الانتظار
        status = 'waiting';
    } else {
        // سرعة عادية = في الطريق
        status = 'en_route';
    }

    return {
        ...movement,
        status,
    };
};
