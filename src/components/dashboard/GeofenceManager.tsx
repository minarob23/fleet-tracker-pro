import { useState } from 'react';
import { motion } from 'framer-motion';
import { Geofence } from '@/types/truck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
interface GeofenceManagerProps {
  geofences: Geofence[];
  onAddGeofence: (geofence: Omit<Geofence, 'id'>) => void;
  onDeleteGeofence: (id: string) => void;
}

const GeofenceManager = ({ geofences, onAddGeofence, onDeleteGeofence }: GeofenceManagerProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('24.7136');
  const [longitude, setLongitude] = useState('46.6753');
  const [radius, setRadius] = useState([500]);
  const [color, setColor] = useState('#10b981');

  const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleAdd = () => {
    if (!name) {
      toast.error('يرجى إدخال اسم المنطقة');
      return;
    }

    onAddGeofence({
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: radius[0],
      color,
    });
    setOpen(false);
    setName('');
    setRadius([500]);
    setOpen(false);
    setName('');
    setRadius([500]);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          مناطق الجيوفنس
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              إضافة
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>إضافة منطقة جيوفنس</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>اسم المنطقة</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مستودع الرياض"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>خط العرض</Label>
                  <Input
                    type="number"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label>خط الطول</Label>
                  <Input
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>نصف القطر: {radius[0]} متر</Label>
                <Slider
                  value={radius}
                  onValueChange={setRadius}
                  min={100}
                  max={2000}
                  step={50}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>اللون</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-card' : ''
                      }`}
                      style={{ backgroundColor: c, boxShadow: color === c ? `0 0 10px ${c}` : 'none' }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full">
                <Plus className="w-4 h-4 ml-2" />
                إضافة المنطقة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {geofences.map((geofence, index) => (
          <motion.div
            key={geofence.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: geofence.color, boxShadow: `0 0 8px ${geofence.color}` }}
              />
              <div>
                <p className="font-medium text-sm">{geofence.name}</p>
                <p className="text-xs text-muted-foreground">{geofence.radius}م</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteGeofence(geofence.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
        {geofences.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            لا توجد مناطق مضافة
          </p>
        )}
      </div>
    </div>
  );
};

export default GeofenceManager;
