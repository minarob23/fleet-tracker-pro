import { motion } from 'framer-motion';
import { Truck } from '@/types/truck';
import { Clock, Hash, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ArrivalQueueProps {
  trucks: Truck[];
}

const ArrivalQueue = ({ trucks }: ArrivalQueueProps) => {
  const arrivedTrucks = trucks
    .filter((t) => t.status === 'arrived' && t.arrivalNumber)
    .sort((a, b) => (a.arrivalNumber || 0) - (b.arrivalNumber || 0));

  return (
    <div className="glass-card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5 text-primary" />
        قائمة الوصول المتتابعة
      </h3>

      <div className="space-y-2">
        {arrivedTrucks.map((truck, index) => (
          <motion.div
            key={truck.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-xl"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-success/20 flex items-center justify-center border-2 border-success/30">
                <span className="text-lg font-bold text-success">#{truck.arrivalNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{truck.plateNumber}</p>
                <p className="text-xs text-muted-foreground truncate">{truck.driverName}</p>

                {/* Enhanced Time Display */}
                <div className="flex items-center gap-2 mt-1.5 p-1.5 bg-background/50 rounded-md w-fit">
                  <Clock className="w-3 h-3 text-success" />
                  <span className="text-xs font-bold text-success">
                    {new Date(truck.lastUpdate).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(truck.lastUpdate).toLocaleDateString('ar-SA', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-bold">
                وصلت ✓
              </Badge>
            </div>
          </motion.div>
        ))}

        {arrivedTrucks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد شاحنات واصلة بعد</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrivalQueue;
