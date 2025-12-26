import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Truck } from '@/types/truck';

interface TruckCheckModalProps {
    truck: Truck | null;
    open: boolean;
    onClose: () => void;
    onConfirm: (truckId: string) => void;
}

const TruckCheckModal = ({ truck, open, onClose, onConfirm }: TruckCheckModalProps) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!truck) return;
        setLoading(true);
        try {
            await onConfirm(truck.id);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!truck) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        تأكيد التفريغ
                    </DialogTitle>
                    <DialogDescription>
                        هل أنت متأكد من تفريغ هذه الشاحنة؟ سيتم إخفاؤها من النظام.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">رقم الشاحنة:</span>
                        <span className="font-medium">{truck.plateNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">السائق:</span>
                        <span className="font-medium">{truck.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">رقم الوصول:</span>
                        <span className="font-mono font-bold text-primary">
                            {truck.arrivalNumber || '-'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">بون ليفريزون:</span>
                        <span className="font-mono">{truck.bonLivraison || '-'}</span>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        <X className="w-4 h-4 ml-1" />
                        إلغاء
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        <CheckCircle className="w-4 h-4 ml-1" />
                        {loading ? 'جاري التأكيد...' : 'تأكيد التفريغ'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TruckCheckModal;
