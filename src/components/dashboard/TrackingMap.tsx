import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, Geofence } from '@/types/truck';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Map style URLs
const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
  navigationDay: 'mapbox://styles/mapbox/navigation-day-v1',
  navigationNight: 'mapbox://styles/mapbox/navigation-night-v1',
};

interface TrackingMapProps {
  trucks: Truck[];
  geofences: Geofence[];
  selectedTruck: Truck | null;
  onSelectTruck: (truck: Truck) => void;
  isDarkMode: boolean;
}

const TrackingMap = ({ trucks, geofences, selectedTruck, onSelectTruck, isDarkMode }: TrackingMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const destinationMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('streets');

  const statusColors: Record<string, string> = {
    waiting: '#6b7280',
    en_route: '#0ea5e9',
    in_transit: '#0ea5e9',
    arrived: '#10b981',
    depot: '#8b5cf6',
    discharged: '#64748b',
  };

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLES[mapStyle],
        center: [-13.2033, 27.1536], // Western Sahara
        zoom: 6,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

      map.current.on('load', () => {
        setIsMapLoaded(true);
        console.log('✅ Map loaded via load event');

        // Add geofences
        geofences.forEach((geofence) => {
          if (map.current) {
            map.current.addSource(`geofence-${geofence.id}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [geofence.longitude, geofence.latitude],
                },
                properties: {},
              },
            });

            map.current.addLayer({
              id: `geofence-${geofence.id}`,
              type: 'circle',
              source: `geofence-${geofence.id}`,
              paint: {
                'circle-radius': geofence.radius / 50,
                'circle-color': geofence.color,
                'circle-opacity': 0.2,
                'circle-stroke-width': 2,
                'circle-stroke-color': geofence.color,
              },
            });
          }
        });
      });

      // Fallback: Set map as loaded after a delay if load event doesn't fire
      setTimeout(() => {
        if (map.current && !isMapLoaded) {
          console.log('⚠️ Map load event did not fire, setting loaded via timeout');
          setIsMapLoaded(true);
        }
      }, 2000);

      return () => {
        map.current?.remove();
        map.current = null;
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []); // Changed dependency array to empty

  // Handle map style changes
  useEffect(() => {
    if (map.current && isMapLoaded) {
      map.current.setStyle(MAP_STYLES[mapStyle]);
    }
  }, [mapStyle, isMapLoaded]);

  // Update map style when theme changes
  useEffect(() => {
    if (map.current && isMapLoaded) {

      // Re-add geofences after style loads
      map.current.once('style.load', () => {
        geofences.forEach((geofence) => {
          if (map.current) {
            map.current.addSource(`geofence-${geofence.id}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [geofence.longitude, geofence.latitude],
                },
                properties: {},
              },
            });

            map.current.addLayer({
              id: `geofence-${geofence.id}`,
              type: 'circle',
              source: `geofence-${geofence.id}`,
              paint: {
                'circle-radius': geofence.radius / 50,
                'circle-color': geofence.color,
                'circle-opacity': 0.2,
                'circle-stroke-width': 2,
                'circle-stroke-color': geofence.color,
              },
            });
          }
        });
      });
    }
  }, [isDarkMode, mapStyle, isMapLoaded, geofences]);

  // Update markers when trucks change
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      console.log('Map not ready:', { mapExists: !!map.current, isMapLoaded });
      return;
    }

    console.log('Updating markers for trucks:', trucks.length);

    // Remove markers for trucks that no longer exist
    Object.keys(markersRef.current).forEach((truckId) => {
      if (!trucks.find(t => t.id === truckId)) {
        console.log('Removing marker for truck:', truckId);
        markersRef.current[truckId].remove();
        delete markersRef.current[truckId];
      }
    });


    trucks.forEach((truck) => {
      // Validate coordinates before creating marker
      const hasValidCoordinates =
        truck.latitude != null &&
        truck.longitude != null &&
        typeof truck.latitude === 'number' &&
        typeof truck.longitude === 'number' &&
        truck.latitude !== 0 &&
        truck.longitude !== 0;

      if (!hasValidCoordinates) {
        console.warn('Skipping truck with invalid coordinates:', truck.plateNumber, {
          latitude: truck.latitude,
          longitude: truck.longitude
        });
        return;
      }

      // Remove existing marker if it exists
      if (markersRef.current[truck.id]) {
        console.log('Removing old marker for truck:', truck.plateNumber);
        markersRef.current[truck.id].remove();
        delete markersRef.current[truck.id];
      }

      console.log('Creating marker for truck:', truck.plateNumber, 'at', truck.latitude, truck.longitude);

      // Create new marker element
      const el = document.createElement('div');
      el.className = 'truck-marker';
      const markerColor = statusColors[truck.status] || '#6b7280';
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: ${markerColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px ${markerColor}80;
          cursor: pointer;
          transition: transform 0.3s;
          position: relative;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
          ${truck.arrivalNumber ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              width: 20px;
              height: 20px;
              background: hsl(160, 84%, 39%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              color: white;
            ">${truck.arrivalNumber}</div>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', () => onSelectTruck(truck));
      el.addEventListener('mouseenter', () => {
        const div = el.querySelector('div');
        if (div) div.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        const div = el.querySelector('div');
        if (div) div.style.transform = 'scale(1)';
      });

      // Create popup content
      const popupContent = `
        <div style="direction: rtl; font-family: Cairo, sans-serif; padding: 8px; min-width: 150px;">
          <strong style="font-size: 14px;">${truck.plateNumber}</strong><br/>
          <span style="color: #666; font-size: 12px;">${truck.driverName}</span><br/>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee;">
            <div style="font-size: 11px; color: #888;">
              <strong>الحالة:</strong>
              ${truck.status === 'waiting' ? '⏸️ في الانتظار' : ''}
              ${truck.status === 'en_route' ? '🚚 في الطريق' : ''}
              ${truck.status === 'in_transit' ? '🚚 في الطريق' : ''}
              ${truck.status === 'arrived' ? '✅ وصلت' : ''}
              ${truck.status === 'depot' ? '🏪 المخزن' : ''}
              ${truck.status === 'discharged' ? '📦 منزلة' : ''}
            </div>
            ${truck.destination ? `<div style="font-size: 11px; color: #888;"><strong>الوجهة:</strong> ${truck.destination}</div>` : ''}
            <div style="font-size: 11px; color: #888;"><strong>السرعة:</strong> ${truck.speed} كم/س</div>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

      // Create and add marker to map
      const marker = new mapboxgl.Marker(el)
        .setLngLat([truck.longitude, truck.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current[truck.id] = marker;
      console.log('Marker created successfully for:', truck.plateNumber);
    });

    console.log('Total markers on map:', Object.keys(markersRef.current).length);
  }, [trucks, isMapLoaded, onSelectTruck]);





  // Fly to selected truck
  useEffect(() => {
    if (selectedTruck && map.current) {
      map.current.flyTo({
        center: [selectedTruck.longitude, selectedTruck.latitude],
        zoom: 12,
        duration: 1500,
      });
    }
  }, [selectedTruck]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="glass-card h-full flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-destructive/20 flex items-center justify-center mb-6">
          <span className="text-4xl">🗺️</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Mapbox Token Required</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Please add your Mapbox access token to the .env file to enable the map.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Layer Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2 shadow-lg">
              <Layers className="w-4 h-4" />
              طبقة الخريطة
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setMapStyle('streets')}>
              🗺️ الشوارع
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapStyle('satellite')}>
              🛰️ الأقمار الصناعية
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapStyle('terrain')}>
              ⛰️ التضاريس
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapStyle('dark')}>
              🌙 الوضع الليلي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapStyle('light')}>
              ☀️ الوضع النهاري
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapStyle('navigationDay')}>
              🧭 ملاحة نهارية
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapStyle('navigationNight')}>
              🌃 ملاحة ليلية
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TrackingMap;
