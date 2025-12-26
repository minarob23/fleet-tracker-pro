import { useMemo } from 'react';
import { Truck } from '@/types/truck';

interface TruckCluster {
    id: string;
    latitude: number;
    longitude: number;
    trucks: Truck[];
    count: number;
}

interface UseMapClusteringProps {
    trucks: Truck[];
    zoomLevel: number;
    clusterRadius?: number; // in km
}

export const useMapClustering = ({ trucks, zoomLevel, clusterRadius = 50 }: UseMapClusteringProps) => {
    const clusters = useMemo(() => {
        // Don't cluster at high zoom levels
        if (zoomLevel > 10) {
            return trucks.map(truck => ({
                id: truck.id,
                latitude: truck.latitude,
                longitude: truck.longitude,
                trucks: [truck],
                count: 1
            }));
        }

        const clustered: TruckCluster[] = [];
        const processed = new Set<string>();

        trucks.forEach(truck => {
            if (processed.has(truck.id)) return;

            const nearbyTrucks = trucks.filter(t => {
                if (processed.has(t.id)) return false;
                const distance = calculateDistance(
                    truck.latitude,
                    truck.longitude,
                    t.latitude,
                    t.longitude
                );
                return distance <= clusterRadius;
            });

            nearbyTrucks.forEach(t => processed.add(t.id));

            const centerLat = nearbyTrucks.reduce((sum, t) => sum + t.latitude, 0) / nearbyTrucks.length;
            const centerLng = nearbyTrucks.reduce((sum, t) => sum + t.longitude, 0) / nearbyTrucks.length;

            clustered.push({
                id: `cluster-${truck.id}`,
                latitude: centerLat,
                longitude: centerLng,
                trucks: nearbyTrucks,
                count: nearbyTrucks.length
            });
        });

        return clustered;
    }, [trucks, zoomLevel, clusterRadius]);

    return clusters;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};
