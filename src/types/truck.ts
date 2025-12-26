export type ContactMethod = 'whatsapp' | 'telegram' | 'phone';
export type TrackingMethod = 'web' | 'telegram' | 'whatsapp' | 'app';

export interface Truck {
  id: string;
  plateNumber: string;
  gpsNumber: string;
  driverName: string;
  driverPhone: string;
  preferredContact?: ContactMethod;
  telegramUserId?: string;
  whatsappUserId?: string;
  trackingMethod?: TrackingMethod;
  status: 'waiting' | 'en_route' | 'in_transit' | 'arrived' | 'depot' | 'discharged';
  arrivalNumber?: number;
  latitude: number;
  longitude: number;
  speed: number;
  lastUpdate: Date;
  origin?: string;
  destination?: string;
  cargoType?: string;
  bonLivraison?: string;
  productType?: string;
  productCode?: string;
  supplierId?: string;
  supplierName?: string;
  createdBy?: string;
  isChecked?: boolean;
  checkedBy?: string;
  checkedAt?: Date;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
}

export interface TruckFormData {
  plateNumber: string;
  gpsNumber: string;
  driverName: string;
  driverPhone: string;
  preferredContact?: ContactMethod;
  telegramUserId?: string;
  whatsappUserId?: string;
  trackingMethod?: TrackingMethod;
  origin?: string;
  destination?: string;
  cargoType?: string;
  productType?: string;
  latitude?: number;
  longitude?: number;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}
