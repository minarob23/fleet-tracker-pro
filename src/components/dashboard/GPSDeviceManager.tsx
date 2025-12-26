import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, WifiOff, Trash2, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck } from '@/types/truck';

interface GPSDevice {
    id: string;
    deviceId: string;
    deviceType: string;
    imei?: string;
    phoneNumber?: string;
    truckId?: string;
    isOnline: boolean;
    lastUpdate: Date;
}

interface GPSDeviceManagerProps {
    trucks: Truck[];
}

const GPSDeviceManager = ({ trucks }: GPSDeviceManagerProps) => {
    const [devices, setDevices] = useState<GPSDevice[]>([
        {
            id: '1',
            deviceId: 'GPS001',
            deviceType: 'Traccar Client',
            phoneNumber: '+212600000001',
            truckId: trucks[0]?.id,
            isOnline: true,
            lastUpdate: new Date()
        }
    ]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newDevice, setNewDevice] = useState({
        deviceId: '',
        deviceType: 'traccar',
        imei: '',
        phoneNumber: '',
        truckId: ''
    });

    const handleAddDevice = () => {
        const device: GPSDevice = {
            id: Date.now().toString(),
            deviceId: newDevice.deviceId,
            deviceType: newDevice.deviceType,
            imei: newDevice.imei,
            phoneNumber: newDevice.phoneNumber,
            truckId: newDevice.truckId || undefined,
            isOnline: false,
            lastUpdate: new Date()
        };
        setDevices([...devices, device]);
        setNewDevice({
            deviceId: '',
            deviceType: 'traccar',
            imei: '',
            phoneNumber: '',
            truckId: ''
        });
        setIsAddDialogOpen(false);
    };

    const handleDeleteDevice = (id: string) => {
        setDevices(devices.filter(d => d.id !== id));
    };

    const getTruckInfo = (truckId?: string) => {
        if (!truckId) return null;
        return trucks.find(t => t.id === truckId);
    };

    return (
        <div className="glass-card h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" />
                        إدارة أجهزة GPS
                    </h2>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                إضافة جهاز
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>إضافة جهاز GPS جديد</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>معرف الجهاز (Device ID)</Label>
                                    <Input
                                        value={newDevice.deviceId}
                                        onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                                        placeholder="GPS001"
                                    />
                                </div>
                                <div>
                                    <Label>نوع الجهاز</Label>
                                    <Select
                                        value={newDevice.deviceType}
                                        onValueChange={(value) => setNewDevice({ ...newDevice, deviceType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="traccar">Traccar Client</SelectItem>
                                            <SelectItem value="concox">Concox GT06N</SelectItem>
                                            <SelectItem value="teltonika">Teltonika FMB920</SelectItem>
                                            <SelectItem value="queclink">Queclink GV300</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>IMEI (اختياري)</Label>
                                    <Input
                                        value={newDevice.imei}
                                        onChange={(e) => setNewDevice({ ...newDevice, imei: e.target.value })}
                                        placeholder="123456789012345"
                                    />
                                </div>
                                <div>
                                    <Label>رقم الهاتف (اختياري)</Label>
                                    <Input
                                        value={newDevice.phoneNumber}
                                        onChange={(e) => setNewDevice({ ...newDevice, phoneNumber: e.target.value })}
                                        placeholder="+212600000000"
                                    />
                                </div>
                                <div>
                                    <Label>ربط بشاحنة (اختياري)</Label>
                                    <Select
                                        value={newDevice.truckId}
                                        onValueChange={(value) => setNewDevice({ ...newDevice, truckId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر شاحنة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">بدون ربط</SelectItem>
                                            {trucks.map(truck => (
                                                <SelectItem key={truck.id} value={truck.id}>
                                                    {truck.plateNumber} - {truck.driverName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAddDevice} className="w-full">
                                    إضافة الجهاز
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Devices List */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
                {devices.map((device, index) => {
                    const truck = getTruckInfo(device.truckId);
                    return (
                        <motion.div
                            key={device.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-card rounded-lg border border-border hover:shadow-lg transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${device.isOnline ? 'bg-success/10' : 'bg-muted'}`}>
                                        <Smartphone className={`w-5 h-5 ${device.isOnline ? 'text-success' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{device.deviceId}</h3>
                                        <p className="text-sm text-muted-foreground">{device.deviceType}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={device.isOnline ? 'default' : 'secondary'} className={device.isOnline ? 'bg-success' : ''}>
                                        {device.isOnline ? (
                                            <>
                                                <Wifi className="w-3 h-3 mr-1" />
                                                متصل
                                            </>
                                        ) : (
                                            <>
                                                <WifiOff className="w-3 h-3 mr-1" />
                                                غير متصل
                                            </>
                                        )}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteDevice(device.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {device.imei && (
                                    <div>
                                        <p className="text-muted-foreground">IMEI</p>
                                        <p className="font-mono">{device.imei}</p>
                                    </div>
                                )}
                                {device.phoneNumber && (
                                    <div>
                                        <p className="text-muted-foreground">رقم الهاتف</p>
                                        <p className="font-mono" dir="ltr">{device.phoneNumber}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">آخر تحديث</p>
                                    <p>{device.lastUpdate.toLocaleTimeString('ar-SA')}</p>
                                </div>
                                {truck && (
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground mb-1">مرتبط بشاحنة</p>
                                        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                                            <span className="font-bold">{truck.plateNumber}</span>
                                            <span className="text-sm text-muted-foreground">-</span>
                                            <span className="text-sm">{truck.driverName}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {devices.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">لا توجد أجهزة GPS</p>
                        <p className="text-sm">أضف جهاز GPS جديد للبدء</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border text-sm text-muted-foreground text-center">
                {devices.length} جهاز • {devices.filter(d => d.isOnline).length} متصل
            </div>
        </div>
    );
};

export default GPSDeviceManager;
