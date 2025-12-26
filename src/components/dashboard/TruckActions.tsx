import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, MoreVertical, MapPin, MessageCircle, Send, Phone, Navigation } from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Truck, TruckFormData } from '@/types/truck';
import { toast } from 'sonner';
import MapLocationPicker from './MapLocationPicker';

interface TruckActionsProps {
    truck: Truck;
    onUpdate: (truckId: string, data: Partial<TruckFormData>) => Promise<void>;
    onDelete: (truckId: string) => Promise<void>;
    canEdit: boolean;
    canDelete: boolean;
}

const TruckActions = ({ truck, onUpdate, onDelete, canEdit, canDelete }: TruckActionsProps) => {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [originPickerOpen, setOriginPickerOpen] = useState(false);
    const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
    const [formData, setFormData] = useState({
        plateNumber: truck.plateNumber,
        gpsNumber: truck.gpsNumber,
        driverName: truck.driverName,
        driverPhone: truck.driverPhone,
        origin: truck.origin || '',
        destination: truck.destination || '',
        cargoType: truck.cargoType || '',
        originLatitude: truck.originLatitude,
        originLongitude: truck.originLongitude,
        destinationLatitude: truck.destinationLatitude,
        destinationLongitude: truck.destinationLongitude,
        preferredContact: truck.preferredContact || 'whatsapp',
        telegramUserId: truck.telegramUserId || '',
        whatsappUserId: truck.whatsappUserId || '',
    });

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await onUpdate(truck.id, formData);
            setEditOpen(false);
            toast.success('تم تحديث الشاحنة بنجاح');
        } catch (error) {
            toast.error('فشل في تحديث الشاحنة');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onDelete(truck.id);
            setDeleteOpen(false);
            toast.success('تم حذف الشاحنة بنجاح');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('فشل في حذف الشاحنة');
        } finally {
            setLoading(false);
        }
    };

    if (!canEdit && !canDelete) {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canEdit && (
                        <DropdownMenuItem onClick={() => setEditOpen(true)}>
                            <Pencil className="ml-2 h-4 w-4" />
                            تعديل
                        </DropdownMenuItem>
                    )}
                    {canDelete && (
                        <DropdownMenuItem
                            onClick={() => setDeleteOpen(true)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات الشاحنة</DialogTitle>
                        <DialogDescription>
                            قم بتعديل المعلومات الخاصة بالشاحنة {truck.plateNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="plateNumber">رقم اللوحة</Label>
                                <Input
                                    id="plateNumber"
                                    value={formData.plateNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, plateNumber: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <Label htmlFor="driverName">اسم السائق</Label>
                                <Input
                                    id="driverName"
                                    value={formData.driverName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, driverName: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="driverPhone">رقم واتساب (للإشعارات)</Label>
                                <Input
                                    id="driverPhone"
                                    value={formData.driverPhone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, driverPhone: e.target.value })
                                    }
                                    placeholder="+212..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="cargoType">نوع الحمولة</Label>
                                <Input
                                    id="cargoType"
                                    value={formData.cargoType}
                                    onChange={(e) =>
                                        setFormData({ ...formData, cargoType: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Contact Method Selection */}
                        <div className="space-y-3">
                            <Label>طريقة الاتصال المفضلة</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* WhatsApp */}
                                <div
                                    className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.preferredContact === 'whatsapp'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                    onClick={() => setFormData({ ...formData, preferredContact: 'whatsapp' })}
                                >
                                    <MessageCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-xs">واتساب</span>
                                </div>

                                {/* Telegram */}
                                <div
                                    className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.preferredContact === 'telegram'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                    onClick={() => setFormData({ ...formData, preferredContact: 'telegram' })}
                                >
                                    <Send className="w-5 h-5 text-blue-500" />
                                    <span className="text-xs">تليجرام</span>
                                </div>


                            </div>
                        </div>

                        {/* Telegram User ID - Show only when Telegram is selected */}
                        {formData.preferredContact === 'telegram' && (
                            <div>
                                <Label htmlFor="telegramUserId">معرف تليجرام (Telegram User ID)</Label>
                                <Input
                                    id="telegramUserId"
                                    value={formData.telegramUserId}
                                    onChange={(e) => setFormData({ ...formData, telegramUserId: e.target.value })}
                                    placeholder="مثال: 5234702440"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    💡 السائق يحصل على هذا الرقم عند إرسال /start للبوت
                                </p>
                            </div>
                        )}

                        {/* WhatsApp User ID - Show only when WhatsApp is selected */}
                        {formData.preferredContact === 'whatsapp' && (
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="whatsappUserId">رقم واتساب (WhatsApp Number)</Label>
                                    <Input
                                        id="whatsappUserId"
                                        value={formData.whatsappUserId}
                                        onChange={(e) => setFormData({ ...formData, whatsappUserId: e.target.value })}
                                        placeholder="مثال: +212612345678"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        💡 رقم الهاتف بصيغة دولية (مثال: +212612345678)
                                    </p>
                                </div>

                                {formData.whatsappUserId && (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`/api/whatsapp-tracking/create-link/${truck.id}`, {
                                                        method: 'POST'
                                                    });
                                                    const data = await response.json();

                                                    if (data.success) {
                                                        const message = encodeURIComponent(
                                                            `مرحباً ${formData.driverName}! 🚛\n\n` +
                                                            `شاحنتك: ${formData.plateNumber}\n` +
                                                            `الوجهة: ${formData.destination || 'غير محددة'}\n\n` +
                                                            `📍 رابط التتبع:\n${data.trackingUrl}\n\n` +
                                                            `افتح الرابط وابدأ التتبع`
                                                        );
                                                        window.open(`https://wa.me/${formData.whatsappUserId.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
                                                        toast.success('تم إنشاء رابط التتبع!');
                                                    }
                                                } catch (error) {
                                                    toast.error('فشل في إنشاء رابط التتبع');
                                                }
                                            }}
                                        >
                                            <Navigation className="w-4 h-4 ml-2" />
                                            إنشاء رابط تتبع
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                const message = encodeURIComponent(`مرحباً ${formData.driverName}! 🚛\n\nشاحنتك: ${formData.plateNumber}\nالوجهة: ${formData.destination || 'غير محددة'}`);
                                                window.open(`https://wa.me/${formData.whatsappUserId.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
                                            }}
                                        >
                                            <MessageCircle className="w-4 h-4 ml-2" />
                                            إرسال رسالة
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Location Selection Buttons */}
                        <div className="space-y-3">
                            <div>
                                <Label>
                                    {formData.preferredContact === 'telegram'
                                        ? 'نقطة البداية (سيتم استخدام موقع السائق الحالي من GPS)'
                                        : 'نقطة البداية (الموقع الحالي)'}
                                </Label>
                                {formData.preferredContact === 'telegram' || formData.preferredContact === 'whatsapp' ? (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mt-1">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                    📍 سيتم استخدام الموقع الحالي للسائق تلقائياً
                                                </p>
                                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                                    عند بدء التتبع، سيرسل السائق موقعه الحالي عبر Telegram وسيتم تحديثه تلقائياً
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={formData.origin || (formData.originLatitude && formData.originLongitude ? `${formData.originLatitude.toFixed(4)}, ${formData.originLongitude.toFixed(4)}` : '')}
                                            readOnly
                                            placeholder="اختر موقع انطلاق الشاحنة"
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setOriginPickerOpen(true)}
                                        >
                                            <MapPin className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>الوجهة (المدينة)</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        value={formData.destination || (formData.destinationLatitude && formData.destinationLongitude ? `${formData.destinationLatitude.toFixed(4)}, ${formData.destinationLongitude.toFixed(4)}` : '')}
                                        readOnly
                                        placeholder="اختر مدينة الوجهة"
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDestinationPickerOpen(true)}
                                    >
                                        <MapPin className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleUpdate} disabled={loading}>
                            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف الشاحنة <strong>{truck.plateNumber}</strong> نهائيًا. لا يمكن
                            التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={loading}
                        >
                            {loading ? 'جاري الحذف...' : 'حذف'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Origin Location Picker */}
            <MapLocationPicker
                open={originPickerOpen}
                onClose={() => setOriginPickerOpen(false)}
                onSelect={(location) => {
                    setFormData({
                        ...formData,
                        origin: location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
                        originLatitude: location.latitude,
                        originLongitude: location.longitude,
                    });
                }}
                title="اختر نقطة البداية"
                description="حدد موقع انطلاق الشاحنة"
                initialLocation={
                    formData.originLatitude && formData.originLongitude
                        ? {
                            latitude: formData.originLatitude,
                            longitude: formData.originLongitude,
                            address: formData.origin,
                        }
                        : undefined
                }
            />

            {/* Destination Location Picker */}
            <MapLocationPicker
                open={destinationPickerOpen}
                onClose={() => setDestinationPickerOpen(false)}
                onSelect={(location) => {
                    setFormData({
                        ...formData,
                        destination: location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
                        destinationLatitude: location.latitude,
                        destinationLongitude: location.longitude,
                    });
                }}
                title="اختر الوجهة"
                description="حدد مدينة أو موقع الوجهة"
                initialLocation={
                    formData.destinationLatitude && formData.destinationLongitude
                        ? {
                            latitude: formData.destinationLatitude,
                            longitude: formData.destinationLongitude,
                            address: formData.destination,
                        }
                        : undefined
                }
            />
        </>
    );
};

export default TruckActions;
