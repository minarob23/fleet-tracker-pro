import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Truck } from '@/types/truck';

interface HistoricalPath {
    coordinates: [number, number][];
    timestamps: Date[];
}

interface UseHistoricalPathProps {
    map: mapboxgl.Map | null;
    truck: Truck | null;
    history?: HistoricalPath;
}

export const useHistoricalPath = ({ map, truck, history }: UseHistoricalPathProps) => {
    const [pathVisible, setPathVisible] = useState(false);

    useEffect(() => {
        if (!map || !truck || !history || !pathVisible) {
            // Remove path if exists
            if (map?.getLayer('historical-path')) {
                map.removeLayer('historical-path');
            }
            if (map?.getSource('historical-path')) {
                map.removeSource('historical-path');
            }
            return;
        }

        // Add path source
        if (!map.getSource('historical-path')) {
            map.addSource('historical-path', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: history.coordinates
                    }
                }
            });
        }

        // Add path layer
        if (!map.getLayer('historical-path')) {
            map.addLayer({
                id: 'historical-path',
                type: 'line',
                source: 'historical-path',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#0ea5e9',
                    'line-width': 3,
                    'line-opacity': 0.8,
                    'line-dasharray': [2, 2]
                }
            });
        }

        // Add markers for each point
        history.coordinates.forEach((coord, index) => {
            const el = document.createElement('div');
            el.className = 'historical-point';
            el.style.width = '8px';
            el.style.height = '8px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#0ea5e9';
            el.style.border = '2px solid white';
            el.style.cursor = 'pointer';

            const marker = new mapboxgl.Marker(el)
                .setLngLat([coord[0], coord[1]])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`
              <div style="padding: 8px;">
                <strong>نقطة ${index + 1}</strong><br/>
                <small>${history.timestamps[index].toLocaleString('ar-SA')}</small>
              </div>
            `)
                )
                .addTo(map);
        });

    }, [map, truck, history, pathVisible]);

    return { pathVisible, setPathVisible };
};
