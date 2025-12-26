import { useState, useCallback, useEffect } from 'react';
import { Truck, TruckFormData, Geofence } from '@/types/truck';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface NeonTruck {
  id: string;
  plate_number: string;
  gps_number: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  arrival_number: number | null;
  latitude: number;
  longitude: number;
  speed: number;
  destination: string | null;
  cargo_type: string | null;
  created_at: string;
  updated_at: string;
}

interface NeonGeofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
  created_at: string;
}

const mapNeonTruckToTruck = (neonTruck: any): Truck => ({
  id: neonTruck.id,
  // Handle both snake_case (old) and camelCase (new) formats
  plateNumber: neonTruck.plateNumber || neonTruck.plate_number,
  gpsNumber: neonTruck.gpsNumber || neonTruck.gps_number,
  driverName: neonTruck.driverName || neonTruck.driver_name,
  driverPhone: neonTruck.driverPhone || neonTruck.driver_phone,
  preferredContact: neonTruck.preferredContact || neonTruck.preferred_contact,
  telegramUserId: neonTruck.telegramUserId || neonTruck.telegram_user_id,
  trackingMethod: neonTruck.trackingMethod || neonTruck.tracking_method,
  status: (neonTruck.status || 'waiting') as Truck['status'],
  arrivalNumber: neonTruck.arrivalNumber || neonTruck.arrival_number || undefined,
  latitude: Number(neonTruck.latitude),
  longitude: Number(neonTruck.longitude),
  speed: Number(neonTruck.speed),
  lastUpdate: new Date(neonTruck.lastUpdate || neonTruck.updated_at),
  origin: neonTruck.origin || undefined,
  destination: neonTruck.destination || undefined,
  cargoType: neonTruck.cargoType || neonTruck.cargo_type || undefined,
  bonLivraison: neonTruck.bonLivraison || neonTruck.bon_livraison || undefined,
  productType: neonTruck.productType || neonTruck.product_type || undefined,
  productCode: neonTruck.productCode || neonTruck.product_code || undefined,
  supplierId: neonTruck.supplierId || neonTruck.supplier_id || undefined,
  supplierName: neonTruck.supplierName || neonTruck.supplier_name || undefined,
  createdBy: neonTruck.createdBy || neonTruck.created_by || undefined,
  isChecked: neonTruck.isChecked || neonTruck.is_checked || undefined,
  checkedBy: neonTruck.checkedBy || neonTruck.checked_by || undefined,
  checkedAt: neonTruck.checkedAt ? new Date(neonTruck.checkedAt) : neonTruck.checked_at ? new Date(neonTruck.checked_at) : undefined,
  originLatitude: neonTruck.originLatitude || neonTruck.origin_latitude || undefined,
  originLongitude: neonTruck.originLongitude || neonTruck.origin_longitude || undefined,
  destinationLatitude: neonTruck.destinationLatitude || neonTruck.destination_latitude || undefined,
  destinationLongitude: neonTruck.destinationLongitude || neonTruck.destination_longitude || undefined,
});

const mapNeonGeofenceToGeofence = (neonGeofence: NeonGeofence): Geofence => ({
  id: neonGeofence.id,
  name: neonGeofence.name,
  latitude: Number(neonGeofence.latitude),
  longitude: Number(neonGeofence.longitude),
  radius: neonGeofence.radius,
  color: neonGeofence.color,
});

export const useNeonDB = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  const fetchTrucks = useCallback(async () => {
    try {
      const result = await apiClient.get<{ trucks: any[] }>('/trucks');
      if (result.trucks) {
        setTrucks(result.trucks.map(mapNeonTruckToTruck));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trucks';
      setError(errorMessage);
    }
  }, []);

  const fetchGeofences = useCallback(async () => {
    try {
      const result = await apiClient.get<{ geofences: NeonGeofence[] }>('/geofences');
      if (result.geofences) {
        setGeofences(result.geofences.map(mapNeonGeofenceToGeofence));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch geofences';
      setError(errorMessage);
    }
  }, []);

  const addTruck = useCallback(async (data: TruckFormData) => {
    try {
      const result = await apiClient.post<{ truck: NeonTruck }>('/trucks', {
        plateNumber: data.plateNumber,
        gpsNumber: data.gpsNumber,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        destination: data.destination,
        cargoType: data.cargoType,
        latitude: data.latitude || 27.1536,
        longitude: data.longitude || -13.2033,
      });

      if (result.truck) {
        const newTruck = mapNeonTruckToTruck(result.truck);
        setTrucks(prev => [newTruck, ...prev]);
        toast.success('تم إضافة الشاحنة بنجاح');
        return newTruck;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add truck';
      toast.error('فشل في إضافة الشاحنة: ' + errorMessage);
    }
  }, []);

  const updateTruck = useCallback(async (truckId: string, data: Partial<TruckFormData>) => {
    try {
      const result = await apiClient.patch<{ truck: NeonTruck }>(`/trucks/${truckId}`, data);
      if (result.truck) {
        const updatedTruck = mapNeonTruckToTruck(result.truck);
        setTrucks(prev => prev.map(t => t.id === truckId ? updatedTruck : t));
        toast.success('تم تحديث الشاحنة بنجاح');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update truck';
      toast.error('فشل في تحديث الشاحنة: ' + errorMessage);
      throw err;
    }
  }, []);

  const deleteTruck = useCallback(async (truckId: string) => {
    try {
      await apiClient.delete(`/trucks/${truckId}`);
      setTrucks(prev => prev.filter(t => t.id !== truckId));
      toast.success('تم حذف الشاحنة بنجاح');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete truck';
      toast.error('فشل في حذف الشاحنة: ' + errorMessage);
      throw err;
    }
  }, []);

  const markAsArrived = useCallback(async (truckId: string) => {
    try {
      const result = await apiClient.post<{ success: boolean; arrivalNumber: number }>(`/trucks/${truckId}/arrived`);
      if (result.success) {
        setTrucks(prev =>
          prev.map(truck =>
            truck.id === truckId
              ? { ...truck, status: 'arrived' as const, arrivalNumber: result.arrivalNumber, speed: 0 }
              : truck
          )
        );
        toast.success(`تم تسجيل الوصول برقم ${result.arrivalNumber}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark arrived';
      toast.error('فشل في تسجيل الوصول: ' + errorMessage);
    }
  }, []);

  const updateTruckStatus = useCallback(async (truckId: string, status: Truck['status']) => {
    try {
      await apiClient.patch(`/trucks/${truckId}/status`, { status });
      setTrucks(prev =>
        prev.map(truck =>
          truck.id === truckId ? { ...truck, status } : truck
        )
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      toast.error('فشل في تحديث الحالة: ' + errorMessage);
    }
  }, []);

  const updateTruckLocation = useCallback(async (truckId: string, latitude: number, longitude: number, speed: number) => {
    try {
      await apiClient.patch(`/trucks/${truckId}/location`, { latitude, longitude, speed });
      setTrucks(prev =>
        prev.map(truck =>
          truck.id === truckId ? { ...truck, latitude, longitude, speed, lastUpdate: new Date() } : truck
        )
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
      console.error('فشل في تحديث الموقع:', errorMessage);
    }
  }, []);

  const addGeofence = useCallback(async (geofence: Omit<Geofence, 'id'>) => {
    try {
      const result = await apiClient.post<{ geofence: NeonGeofence }>('/geofences', geofence);
      if (result.geofence) {
        const newGeofence = mapNeonGeofenceToGeofence(result.geofence);
        setGeofences(prev => [newGeofence, ...prev]);
        toast.success('تم إضافة المنطقة بنجاح');
        return newGeofence;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add geofence';
      toast.error('فشل في إضافة المنطقة: ' + errorMessage);
    }
  }, []);

  const deleteGeofence = useCallback(async (geofenceId: string) => {
    try {
      await apiClient.delete(`/geofences/${geofenceId}`);
      setGeofences(prev => prev.filter(g => g.id !== geofenceId));
      toast.success('تم حذف المنطقة');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete geofence';
      toast.error('فشل في حذف المنطقة: ' + errorMessage);
    }
  }, []);

  const sendWhatsApp = useCallback((truck: Truck, message: string) => {
    const phone = truck.driverPhone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    toast.success('جاري فتح واتساب');
  }, []);

  const refreshData = useCallback(() => {
    return Promise.all([fetchTrucks(), fetchGeofences()]);
  }, [fetchTrucks, fetchGeofences]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setDbStatus('connecting');
      try {
        await Promise.all([fetchTrucks(), fetchGeofences()]);
        setDbStatus('connected');
      } catch (err) {
        console.error('Failed to initialize:', err);
        setDbStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchTrucks, fetchGeofences]);

  const saveLanguagePreference = useCallback(async (language: 'ar' | 'fr') => {
    try {
      await apiClient.patch('/user/language', { language });
      // Don't show toast for language changes (too noisy)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save language preference';
      console.error('Failed to save language preference:', errorMessage);
      // Silently fail - will use localStorage as fallback
    }
  }, []);

  const getLanguagePreference = useCallback(async (): Promise<'ar' | 'fr' | null> => {
    try {
      const result = await apiClient.get<{ language: 'ar' | 'fr' }>('/user/language');
      return result.language || null;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get language preference';
      console.error('Failed to get language preference:', errorMessage);
      return null;
    }
  }, []);

  return {
    trucks,
    geofences,
    loading,
    error,
    dbStatus,
    addTruck,
    updateTruck,
    deleteTruck,
    markAsArrived,
    updateTruckStatus,
    updateTruckLocation,
    addGeofence,
    deleteGeofence,
    sendWhatsApp,
    refreshData,
    saveLanguagePreference,
    getLanguagePreference,
  };
};
