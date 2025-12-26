import { useState, useCallback } from 'react';
import { Truck, TruckFormData } from '@/types/truck';
import { mockTrucks } from '@/data/mockData';
import { toast } from 'sonner';

export const useTrucks = () => {
  const [trucks, setTrucks] = useState<Truck[]>(mockTrucks);
  const [nextArrivalNumber, setNextArrivalNumber] = useState(3);

  const addTruck = useCallback((data: TruckFormData) => {
    const newTruck: Truck = {
      id: Date.now().toString(),
      plateNumber: data.plateNumber,
      gpsNumber: data.gpsNumber,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      status: 'waiting',
      latitude: 24.7136 + (Math.random() - 0.5) * 2,
      longitude: 46.6753 + (Math.random() - 0.5) * 2,
      speed: 0,
      lastUpdate: new Date(),
      destination: data.destination,
      cargoType: data.cargoType,
    };
    setTrucks((prev) => [...prev, newTruck]);
    toast.success('تم إضافة الشاحنة بنجاح');
    return newTruck;
  }, []);

  const markAsArrived = useCallback((truckId: string) => {
    setTrucks((prev) =>
      prev.map((truck) =>
        truck.id === truckId
          ? { ...truck, status: 'arrived' as const, arrivalNumber: nextArrivalNumber, speed: 0 }
          : truck
      )
    );
    setNextArrivalNumber((prev) => prev + 1);
    toast.success(`تم تسجيل الوصول برقم ${nextArrivalNumber}`);
  }, [nextArrivalNumber]);

  const updateTruckStatus = useCallback((truckId: string, status: Truck['status']) => {
    setTrucks((prev) =>
      prev.map((truck) =>
        truck.id === truckId ? { ...truck, status } : truck
      )
    );
  }, []);

  const deleteTruck = useCallback((truckId: string) => {
    setTrucks((prev) => prev.filter((truck) => truck.id !== truckId));
    toast.success('تم حذف الشاحنة');
  }, []);

  const sendWhatsApp = useCallback((truck: Truck, message: string) => {
    const phone = truck.driverPhone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    toast.success('جاري فتح واتساب');
  }, []);

  return {
    trucks,
    addTruck,
    markAsArrived,
    updateTruckStatus,
    deleteTruck,
    sendWhatsApp,
  };
};
