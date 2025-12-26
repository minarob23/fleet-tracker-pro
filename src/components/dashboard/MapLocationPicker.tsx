import { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Location {
    latitude: number;
    longitude: number;
    address?: string;
}

interface MapLocationPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (location: Location) => void;
    title: string;
    description?: string;
    initialLocation?: Location;
}

// Moroccan cities with coordinates
const MOROCCAN_CITIES = [
    { name: 'الدار البيضاء', name_en: 'Casablanca', lat: 33.5731, lng: -7.5898 },
    { name: 'الرباط', name_en: 'Rabat', lat: 33.9716, lng: -6.8498 },
    { name: 'مراكش', name_en: 'Marrakech', lat: 31.6295, lng: -7.9811 },
    { name: 'أكادير', name_en: 'Agadir', lat: 30.4278, lng: -9.5981 },
    { name: 'العيون', name_en: 'Laayoune', lat: 27.1536, lng: -13.2033 },
    { name: 'الداخلة', name_en: 'Dakhla', lat: 23.7185, lng: -15.9582 },
    { name: 'السمارة', name_en: 'Smara', lat: 26.7386, lng: -11.6719 },
    { name: 'كلميم', name_en: 'Guelmim', lat: 28.9870, lng: -10.0574 },
    { name: 'طنجة', name_en: 'Tangier', lat: 35.7595, lng: -5.8340 },
    { name: 'فاس', name_en: 'Fes', lat: 34.0181, lng: -5.0078 },
];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapLocationPicker = ({
    open,
    onClose,
    onSelect,
    title,
    description,
    initialLocation,
}: MapLocationPickerProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(
        initialLocation || null
    );
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounced search using Mapbox Geocoding API
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            if (!MAPBOX_TOKEN) return;

            setIsSearching(true);
            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json?` +
                    `access_token=${MAPBOX_TOKEN}&` +
                    `country=MA&` + // Morocco
                    `language=ar,en&` +
                    `limit=10`
                );
                const data = await response.json();
                setSearchResults(data.features || []);
            } catch (error) {
                console.error('Geocoding error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const filteredCities = MOROCCAN_CITIES.filter(
        (city) =>
            city.name.includes(searchTerm) ||
            city.name_en.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCitySelect = (city: typeof MOROCCAN_CITIES[0]) => {
        const location: Location = {
            latitude: city.lat,
            longitude: city.lng,
            address: `${city.name} (${city.name_en})`,
        };
        setSelectedLocation(location);
        setSearchTerm(''); // Clear search
        setSearchResults([]);
    };

    const handleSearchResultSelect = (result: any) => {
        const location: Location = {
            latitude: result.center[1],
            longitude: result.center[0],
            address: result.place_name || result.text,
        };
        setSelectedLocation(location);
        setSearchTerm(''); // Clear search
        setSearchResults([]);
    };

    const handleConfirm = () => {
        if (selectedLocation) {
            onSelect(selectedLocation);
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        {title}
                    </DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="ابحث عن أي مكان في المغرب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                        {isSearching && (
                            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                        )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            <Label>نتائج البحث:</Label>
                            <div className="max-h-[300px] overflow-y-auto space-y-1 border rounded-lg p-2">
                                {searchResults.map((result, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        className="w-full justify-start text-right h-auto py-2"
                                        onClick={() => handleSearchResultSelect(result)}
                                    >
                                        <MapPin className="w-4 h-4 ml-2 flex-shrink-0" />
                                        <div className="flex-1 text-right">
                                            <div className="font-medium text-sm">{result.text}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {result.place_name}
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected Location Display */}
                    {selectedLocation && (
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">الموقع المحدد:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedLocation.address || `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedLocation(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Cities List */}
                    <div className="space-y-2">
                        <Label>اختر مدينة:</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                            {filteredCities.map((city) => (
                                <Button
                                    key={city.name_en}
                                    variant={
                                        selectedLocation?.latitude === city.lat &&
                                            selectedLocation?.longitude === city.lng
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="justify-start"
                                    onClick={() => handleCitySelect(city)}
                                >
                                    <MapPin className="w-4 h-4 ml-2" />
                                    <div className="text-right">
                                        <div className="font-medium">{city.name}</div>
                                        <div className="text-xs opacity-70">{city.name_en}</div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Manual Coordinates Input */}
                    <div className="border-t pt-4">
                        <Label className="mb-2 block">أو أدخل الإحداثيات يدويًا:</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs">خط العرض (Latitude)</Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    placeholder="27.1536"
                                    value={selectedLocation?.latitude || ''}
                                    onChange={(e) =>
                                        setSelectedLocation({
                                            ...selectedLocation!,
                                            latitude: parseFloat(e.target.value) || 0,
                                            longitude: selectedLocation?.longitude || 0,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label className="text-xs">خط الطول (Longitude)</Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    placeholder="-13.2033"
                                    value={selectedLocation?.longitude || ''}
                                    onChange={(e) =>
                                        setSelectedLocation({
                                            latitude: selectedLocation?.latitude || 0,
                                            longitude: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose}>
                        إلغاء
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedLocation}>
                        <MapPin className="w-4 h-4 ml-2" />
                        تأكيد الموقع
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MapLocationPicker;
