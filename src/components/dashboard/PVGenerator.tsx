import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Printer, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Truck } from '@/types/truck';

interface PVGeneratorProps {
    truck: Truck;
}

const PVGenerator = ({ truck }: PVGeneratorProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const generatePVContent = () => {
        const now = new Date();
        return {
            pvNumber: `PV-${truck.arrivalNumber || '000'}-${now.getFullYear()}`,
            date: now.toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: now.toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            arrivalDate: new Date(truck.lastUpdate).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    const pv = generatePVContent();

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        // سيتم تنفيذ هذا لاحقاً باستخدام مكتبة PDF
        alert('سيتم إضافة تصدير PDF قريباً');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FileText className="w-4 h-4" />
                    محضر وصول
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>محضر وصول شاحنة</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                طباعة
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* PV Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white text-black p-8 rounded-lg border-2 border-gray-300"
                    id="pv-content"
                >
                    {/* Header */}
                    <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                        <h1 className="text-3xl font-bold mb-2">محضر وصول شاحنة</h1>
                        <p className="text-lg text-gray-600">Procès-Verbal d'Arrivée</p>
                        <div className="mt-4 flex justify-between items-center">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">رقم المحضر</p>
                                <p className="text-xl font-bold">{pv.pvNumber}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-gray-600">التاريخ</p>
                                <p className="text-lg font-semibold">{pv.date}</p>
                            </div>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <h2 className="text-xl font-bold mb-3 text-gray-800">معلومات الشركة</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">اسم الشركة</p>
                                <p className="font-semibold">ONICL</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">الوقت</p>
                                <p className="font-semibold">{pv.time}</p>
                            </div>
                        </div>
                    </div>

                    {/* Truck Details */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-300 pb-2">
                            معلومات الشاحنة
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">رقم اللوحة</p>
                                    <p className="text-lg font-bold text-primary">{truck.plateNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">اسم السائق</p>
                                    <p className="font-semibold">{truck.driverName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                                    <p className="font-semibold" dir="ltr">{truck.driverPhone}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">رقم GPS</p>
                                    <p className="font-semibold">{truck.gpsNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">الوجهة</p>
                                    <p className="font-semibold">{truck.destination || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">نوع البضاعة</p>
                                    <p className="font-semibold">{truck.cargoType || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Arrival Details */}
                    <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
                        <h2 className="text-xl font-bold mb-3 text-green-800">تفاصيل الوصول</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">رقم الوصول</p>
                                <p className="text-2xl font-bold text-green-700">#{truck.arrivalNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">تاريخ ووقت الوصول</p>
                                <p className="font-semibold">{pv.arrivalDate}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">الحالة</p>
                                <Badge className="bg-green-500 text-white">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    وصلت
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">الموقع</p>
                                <p className="font-semibold text-xs" dir="ltr">
                                    {truck.latitude.toFixed(6)}, {truck.longitude.toFixed(6)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Verification Section */}
                    <div className="mb-6 border-2 border-dashed border-gray-300 p-4 rounded-lg">
                        <h2 className="text-xl font-bold mb-3 text-gray-800">التحقق والمراجعة</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">توقيع المستلم</p>
                                <div className="border-b-2 border-gray-400 h-16"></div>
                                <p className="text-xs text-gray-500 mt-1">الاسم: ________________</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-2">توقيع المسؤول</p>
                                <div className="border-b-2 border-gray-400 h-16"></div>
                                <p className="text-xs text-gray-500 mt-1">الاسم: ________________</p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-2 text-gray-800">ملاحظات</h2>
                        <div className="border border-gray-300 rounded p-3 min-h-[100px] bg-gray-50">
                            <p className="text-sm text-gray-500">
                                _________________________________________________________________
                                <br />
                                _________________________________________________________________
                                <br />
                                _________________________________________________________________
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
                        <p>تم إنشاء هذا المحضر تلقائياً بواسطة نظام تتبع الشاحنات - ONICL</p>
                        <p className="mt-1">Fleet Tracker Pro © 2026</p>
                    </div>
                </motion.div>

                {/* Print Styles */}
                <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #pv-content, #pv-content * {
              visibility: visible;
            }
            #pv-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
            </DialogContent>
        </Dialog>
    );
};

export default PVGenerator;
