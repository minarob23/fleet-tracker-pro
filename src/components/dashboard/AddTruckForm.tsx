import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TruckFormData } from '@/types/truck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Truck, User, Phone, MapPin, Package, Satellite, Navigation, MessageCircle, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import MapLocationPicker from './MapLocationPicker';
import { ContactMethod } from '@/types/truck';



const formSchema = z.object({
  plateNumber: z.string().min(1, 'رقم اللوحة مطلوب'),
  gpsNumber: z.string().optional(),
  driverName: z.string().min(1, 'اسم السائق مطلوب'),
  driverPhone: z.string().min(1, 'رقم واتساب مطلوب'),
  cargoType: z.string().optional(),
  productType: z.string().optional(),
  destination: z.string().optional(),
  telegramUserId: z.string().optional(),
  whatsappUserId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

interface AddTruckFormProps {
  onAddTruck: (data: TruckFormData) => void;
}

const AddTruckForm = ({ onAddTruck }: AddTruckFormProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [originPickerOpen, setOriginPickerOpen] = useState(false);
  const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
  const [preferredContact, setPreferredContact] = useState<ContactMethod>('whatsapp');
  const [originLocation, setOriginLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TruckFormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: TruckFormData) => {
    const truckData = {
      ...data,
      preferredContact,
      // Use driverPhone as whatsappUserId for WhatsApp tracking
      whatsappUserId: preferredContact === 'whatsapp' ? data.driverPhone : data.whatsappUserId,
      latitude: originLocation?.latitude,
      longitude: originLocation?.longitude,
    };
    onAddTruck(truckData);
    reset();
    setPreferredContact('whatsapp');
    setOriginLocation(null);
    setDestinationLocation(null);
    setOpen(false);
  };

  const inputFields = [
    { name: 'plateNumber' as const, label: language === 'ar' ? 'رقم اللوحة' : 'Numéro de plaque', icon: Truck, placeholder: language === 'ar' ? 'مثال: أ ب ج 1234' : 'Ex: ABC 1234' },
    { name: 'driverName' as const, label: language === 'ar' ? 'اسم السائق' : 'Nom du chauffeur', icon: User, placeholder: language === 'ar' ? 'الاسم الكامل' : 'Nom complet' },
    { name: 'driverPhone' as const, label: language === 'ar' ? 'رقم واتساب (للإشعارات)' : 'WhatsApp (notifications)', icon: Phone, placeholder: '+212...' },
    { name: 'cargoType' as const, label: language === 'ar' ? 'نوع الحمولة' : 'Type de cargaison', icon: Package, placeholder: language === 'ar' ? 'مثال: دقيق' : 'Ex: Farine' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة شاحنة' : 'Ajouter camion'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              {language === 'ar' ? 'إضافة شاحنة جديدة' : 'Ajouter un nouveau camion'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {inputFields.map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Label htmlFor={field.name} className="text-sm mb-2 flex items-center gap-2">
                    <field.icon className="w-4 h-4 text-muted-foreground" />
                    {field.label}
                  </Label>
                  <Input
                    id={field.name}
                    {...register(field.name)}
                    placeholder={field.placeholder}
                    className="bg-secondary border-border focus:border-primary"
                  />
                  {errors[field.name] && (
                    <p className="text-destructive text-xs mt-1">{errors[field.name]?.message}</p>
                  )}
                </motion.div>
              ))}
            </div>

            <Label className="text-sm mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              {language === 'ar' ? 'طريقة الاتصال المفضلة' : 'Méthode de contact préférée'}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp Option */}
              <div
                className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${preferredContact === 'whatsapp'
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                onClick={() => setPreferredContact('whatsapp')}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${preferredContact === 'whatsapp' ? 'bg-green-500/20' : 'bg-green-500/10'
                  }`}>
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-center">
                  {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                </span>
                {preferredContact === 'whatsapp' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Telegram Option */}
              <div
                className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${preferredContact === 'telegram'
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                onClick={() => setPreferredContact('telegram')}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${preferredContact === 'telegram' ? 'bg-blue-500/20' : 'bg-blue-500/10'
                  }`}>
                  <Send className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-xs font-medium text-center">
                  {language === 'ar' ? 'تليجرام' : 'Telegram'}
                </span>
                {preferredContact === 'telegram' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Telegram User ID Field - Only show if Telegram is selected */}
            {preferredContact === 'telegram' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-4"
              >
                <Label htmlFor="telegramUserId" className="text-sm mb-2 flex items-center gap-2">
                  <Send className="w-4 h-4 text-muted-foreground" />
                  {language === 'ar' ? 'معرف تليجرام (للتتبع)' : 'ID Telegram (suivi)'}
                </Label>
                <Input
                  id="telegramUserId"
                  {...register('telegramUserId')}
                  placeholder={language === 'ar' ? 'مثال: 123456789' : 'Exemple: 123456789'}
                  className="bg-secondary border-border focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'ar'
                    ? '💡 السائق يحصل على هذا الرقم عند إرسال /start للبوت'
                    : '💡 Le chauffeur obtient ce numéro en envoyant /start au bot'}
                </p>
              </motion.div>
            )}

            {/* Origin Location Picker - Hidden for Telegram/WhatsApp */}
            {preferredContact !== 'telegram' && preferredContact !== 'whatsapp' && (
              <div className="border-t pt-4">
                <Label className="text-sm mb-2 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                  {language === 'ar' ? 'نقطة البداية (الموقع الحالي)' : 'Point de départ'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={originLocation ? `${originLocation.latitude.toFixed(4)}, ${originLocation.longitude.toFixed(4)}` : ''}
                    readOnly
                    placeholder={language === 'ar' ? 'اختر موقع انطلاق الشاحنة' : 'Choisir le point de départ'}
                    className="flex-1 bg-secondary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOriginPickerOpen(true)}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'ar'
                    ? '📍 اختياري - لرسم المسار على الخريطة'
                    : '📍 Optionnel - pour tracer le parcours'}
                </p>
              </div>
            )}

            {/* Info message for Telegram/WhatsApp */}
            {(preferredContact === 'telegram' || preferredContact === 'whatsapp') && (
              <div className="border-t pt-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        {language === 'ar'
                          ? '📍 سيتم استخدام الموقع الحالي للسائق تلقائياً'
                          : '📍 La position actuelle du chauffeur sera utilisée automatiquement'
                        }
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {language === 'ar'
                          ? preferredContact === 'telegram'
                            ? 'عند بدء التتبع، سيرسل السائق موقعه عبر Telegram'
                            : 'عند فتح رابط التتبع، سيرسل السائق موقعه عبر WhatsApp'
                          : preferredContact === 'telegram'
                            ? 'Le chauffeur enverra sa position via Telegram'
                            : 'Le chauffeur enverra sa position via WhatsApp'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Destination Picker */}
            <div>
              <Label htmlFor="destination" className="text-sm mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {language === 'ar' ? 'الوجهة (المدينة)' : 'Destination'}
              </Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setDestinationPickerOpen(true)}
              >
                <MapPin className="w-4 h-4 ml-2" />
                {destinationLocation?.address || (language === 'ar' ? 'اختر مدينة الوجهة' : 'Choisir la destination')}
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                <Plus className="w-4 h-4 ml-2" />
                {language === 'ar' ? 'إضافة الشاحنة' : 'Ajouter le camion'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog >

      {/* Origin Location Picker Modal */}
      < MapLocationPicker
        open={originPickerOpen}
        onClose={() => setOriginPickerOpen(false)}
        onSelect={(location) => {
          setOriginLocation(location);
          setOriginPickerOpen(false);
        }}
        title="اختر موقع انطلاق الشاحنة"
        description="حدد المدينة أو الموقع الذي ستنطلق منه الشاحنة"
        initialLocation={originLocation || undefined}
      />

      {/* Destination Location Picker Modal */}
      <MapLocationPicker
        open={destinationPickerOpen}
        onClose={() => setDestinationPickerOpen(false)}
        onSelect={(location) => {
          setDestinationLocation(location);
          setValue('destination', location.address || `${location.latitude}, ${location.longitude}`);
          setDestinationPickerOpen(false);
        }}
        title="اختر مدينة الوجهة"
        description="حدد المدينة التي ستتوجه إليها الشاحنة"
        initialLocation={destinationLocation || undefined}
      />
    </>
  );
};

export default AddTruckForm;
