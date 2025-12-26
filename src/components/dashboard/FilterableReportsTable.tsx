import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, Filter, Search, Download, Eye, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Truck as TruckType } from '@/types/truck';
import PVGenerator from './PVGenerator';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FilterableReportsTableProps {
    trucks: TruckType[];
    onSelectTruck: (truck: TruckType) => void;
}

const FilterableReportsTable = ({ trucks, onSelectTruck }: FilterableReportsTableProps) => {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [supplierFilter, setSupplierFilter] = useState<string>('all');
    const [cityFilter, setCityFilter] = useState<string>('all');

    // Get unique suppliers and cities
    const suppliers = useMemo(() => {
        const uniqueSuppliers = new Set(trucks.map(t => t.destination).filter(Boolean));
        return Array.from(uniqueSuppliers);
    }, [trucks]);

    const cities = useMemo(() => {
        const uniqueCities = new Set(
            trucks.map(t => t.destination?.split(',')[0]?.trim()).filter(Boolean)
        );
        return Array.from(uniqueCities);
    }, [trucks]);

    // Status configuration
    const statusConfig = {
        waiting: { label: 'في الانتظار', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: '⏸️' },
        en_route: { label: 'في الطريق', color: 'bg-sky-500/10 text-sky-700 border-sky-500/20', icon: '🚚' },
        arrived: { label: 'وصلت', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: '✅' },
        depot: { label: 'المخزن', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: '🏪' },
        discharged: { label: 'منزلة', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: '📦' },
    };

    // Filter trucks based on all filters
    const filteredTrucks = useMemo(() => {
        return trucks.filter(truck => {
            // Status filter
            const matchesStatus = statusFilter === 'all' || truck.status === statusFilter;

            // Search filter
            const matchesSearch = searchQuery === '' ||
                truck.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                truck.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                truck.gpsNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (truck.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

            // Date filter
            const matchesDate = (() => {
                if (dateFilter === 'all') return true;
                const truckDate = new Date(truck.lastUpdate);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                switch (dateFilter) {
                    case 'today':
                        return truckDate >= today;
                    case 'week':
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return truckDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(today);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        return truckDate >= monthAgo;
                    default:
                        return true;
                }
            })();

            // Supplier filter
            const matchesSupplier = supplierFilter === 'all' || truck.destination === supplierFilter;

            // City filter
            const matchesCity = cityFilter === 'all' ||
                truck.destination?.split(',')[0]?.trim() === cityFilter;

            return matchesStatus && matchesSearch && matchesDate && matchesSupplier && matchesCity;
        });
    }, [trucks, statusFilter, searchQuery, dateFilter, supplierFilter, cityFilter]);

    // Quick stats
    const stats = useMemo(() => {
        return {
            total: trucks.length,
            waiting: trucks.filter(t => t.status === 'waiting').length,
            en_route: trucks.filter(t => t.status === 'en_route').length,
            arrived: trucks.filter(t => t.status === 'arrived').length,
            depot: trucks.filter(t => t.status === 'depot').length,
            discharged: trucks.filter(t => t.status === 'discharged').length,
        };
    }, [trucks]);

    // Export to Excel
    const exportToExcel = () => {
        const data = filteredTrucks.map((truck, index) => ({
            'No.': index + 1,
            'Registration Number': truck.plateNumber,
            'Purchase Order No.': truck.bonLivraison || '-',
            'Supplier': truck.supplierName || '-',
            'Quantity (QX - Quintals)': truck.cargoType || '-',
            'Destination': truck.destination || '-',
            'Delivery Note No.': truck.driverPhone || '-',
            'Arrival Date': truck.arrivalNumber ? new Date(truck.lastUpdate).toLocaleString('en-US') : '-',
            'IN/OUT?': statusConfig[truck.status].label,
            'Arrive?': truck.arrivalNumber ? 'Yes' : 'No'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Truck Report');

        const fileName = `truck_report_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // Export to PDF with Arabic support
    const exportToPDF = () => {
        const doc = new jsPDF('landscape'); // Landscape for wider table

        // Title - ONICL Header
        doc.setFontSize(10);
        doc.text('Kingdom of Morocco', 148, 15, { align: 'center' });
        doc.text('National Interprofessional Office of Cereals and Legumes', 148, 20, { align: 'center' });

        // ONICL
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ONICL', 148, 28, { align: 'center' });

        // Date
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Date: ${currentDate}`, 250, 15);

        // Main Title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Minutes of the Control Commission for the Arrival of Subsidized Food Products', 148, 38, { align: 'center' });

        // Table data - Using English/Numbers only to avoid Arabic rendering issues
        const tableData = filteredTrucks.map((truck, index) => [
            index + 1,
            truck.plateNumber,
            truck.bonLivraison || '-',
            truck.supplierName || '-',
            truck.cargoType || '-',
            truck.destination || '-',
            truck.driverPhone || '-',
            truck.arrivalNumber ? new Date(truck.lastUpdate).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-',
            truck.status === 'arrived' || truck.status === 'depot' ? 'IN' : 'OUT',
            truck.arrivalNumber ? 'Yes' : 'No'
        ]);

        autoTable(doc, {
            head: [[
                'No.',
                'Registration Number',
                'Purchase Order No.',
                'Supplier',
                'Quantity (QX - Quintals)',
                'Destination',
                'Delivery Note No.',
                'Arrival Date',
                'IN/OUT?',
                'Arrive?'
            ]],
            body: tableData,
            startY: 45,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                halign: 'center',
                valign: 'middle'
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 45, left: 10, right: 10 }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY || 45;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('ONICL - National Interprofessional Office of Cereals and Legumes', 148, finalY + 10, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, 148, finalY + 15, { align: 'center' });

        const fileName = `ONICL_Truck_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    return (
        <div className="glass-card h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary" />
                        جدول التقارير
                    </h2>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                تصدير
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={exportToExcel} className="gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                تصدير Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                                <FileText className="w-4 h-4 text-red-600" />
                                تصدير PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Quick Stats - Beautiful Design */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                    {/* الكل - Total */}
                    <div className="group relative overflow-hidden p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl border-2 border-white/20 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-white drop-shadow-lg">{stats.total}</div>
                            <div className="text-sm font-bold text-white/90 mt-1 tracking-wide">الكل</div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 text-7xl opacity-30">🚛</div>
                    </div>

                    {/* انتظار - Waiting */}
                    <div className="group relative overflow-hidden p-4 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-2xl border-2 border-amber-300/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-white drop-shadow-lg">{stats.waiting}</div>
                            <div className="text-sm font-bold text-white/90 mt-1 tracking-wide">انتظار</div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 text-7xl opacity-30">⏸️</div>
                    </div>

                    {/* طريق - En Route */}
                    <div className="group relative overflow-hidden p-4 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-600 rounded-2xl border-2 border-sky-300/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-white drop-shadow-lg">{stats.en_route}</div>
                            <div className="text-sm font-bold text-white/90 mt-1 tracking-wide">طريق</div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 text-7xl opacity-30">🚚</div>
                    </div>

                    {/* وصلت - Arrived */}
                    <div className="group relative overflow-hidden p-4 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl border-2 border-emerald-300/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-white drop-shadow-lg">{stats.arrived}</div>
                            <div className="text-sm font-bold text-white/90 mt-1 tracking-wide">وصلت</div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 text-7xl opacity-30">✅</div>
                    </div>

                    {/* مخزن - Depot */}
                    <div className="group relative overflow-hidden p-4 bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 rounded-2xl border-2 border-purple-300/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-white drop-shadow-lg">{stats.depot}</div>
                            <div className="text-sm font-bold text-white/90 mt-1 tracking-wide">مخزن</div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 text-7xl opacity-30">🏪</div>
                    </div>

                    {/* منزلة - Discharged */}
                    <div className="group relative overflow-hidden p-4 bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600 rounded-2xl border-2 border-slate-300/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-white drop-shadow-lg">{stats.discharged}</div>
                            <div className="text-sm font-bold text-white/90 mt-1 tracking-wide">منزلة</div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 text-7xl opacity-30">📦</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث (لوحة، سائق، GPS)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                    </div>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع الحالات</SelectItem>
                            <SelectItem value="waiting">⏸️ في الانتظار</SelectItem>
                            <SelectItem value="en_route">🚚 في الطريق</SelectItem>
                            <SelectItem value="arrived">✅ وصلت</SelectItem>
                            <SelectItem value="depot">🏪 المخزن</SelectItem>
                            <SelectItem value="discharged">📦 منزلة</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date Filter */}
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="التاريخ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الأوقات</SelectItem>
                            <SelectItem value="today">اليوم</SelectItem>
                            <SelectItem value="week">آخر 7 أيام</SelectItem>
                            <SelectItem value="month">آخر 30 يوم</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto w-full">
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">الرقم</TableHead>
                                <TableHead className="text-right">رقم اللوحة</TableHead>
                                <TableHead className="text-right">رقم الطلب</TableHead>
                                <TableHead className="text-right">المورد</TableHead>
                                <TableHead className="text-right">الكمية (قنطار)</TableHead>
                                <TableHead className="text-right">الوجهة</TableHead>
                                <TableHead className="text-right">رقم التسليم</TableHead>
                                <TableHead className="text-right">تاريخ الوصول</TableHead>
                                <TableHead className="text-right">داخل/خارج؟</TableHead>
                                <TableHead className="text-right">وصل؟</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTrucks.map((truck, index) => (
                                <motion.tr
                                    key={truck.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    onClick={() => onSelectTruck(truck)}
                                >
                                    {/* No. */}
                                    <TableCell className="font-bold">{index + 1}</TableCell>

                                    {/* Registration Number (Plate Number) */}
                                    <TableCell className="font-bold">{truck.plateNumber}</TableCell>

                                    {/* Purchase Order No. (Bon de Livraison) */}
                                    <TableCell className="text-primary font-semibold cursor-pointer hover:underline">
                                        {truck.bonLivraison || '-'}
                                    </TableCell>

                                    {/* Supplier */}
                                    <TableCell>{truck.supplierName || '-'}</TableCell>

                                    {/* Quantity (Cargo Type) */}
                                    <TableCell>{truck.cargoType || '-'}</TableCell>

                                    {/* Destination */}
                                    <TableCell className="text-sm text-muted-foreground">
                                        {truck.destination || '-'}
                                    </TableCell>

                                    {/* Delivery Note No. (Driver Phone) */}
                                    <TableCell className="text-xs" dir="ltr">
                                        {truck.driverPhone || '-'}
                                    </TableCell>

                                    {/* Arrival Date */}
                                    <TableCell className="text-xs text-muted-foreground">
                                        {truck.arrivalNumber ? (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(truck.lastUpdate).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        ) : '-'}
                                    </TableCell>

                                    {/* IN/OUT? (Status) */}
                                    <TableCell>
                                        <Badge variant="outline" className={statusConfig[truck.status].color}>
                                            {statusConfig[truck.status].icon}
                                        </Badge>
                                    </TableCell>

                                    {/* Arrive? (Actions) */}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectTruck(truck);
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {truck.status === 'arrived' && truck.arrivalNumber && (
                                                <PVGenerator truck={truck} />
                                            )}
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredTrucks.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Filter className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">لا توجد نتائج</p>
                            <p className="text-sm">جرب تغيير الفلاتر أو البحث</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border text-sm text-muted-foreground text-center">
                عرض {filteredTrucks.length} من {trucks.length} شاحنة
            </div>
        </div>
    );
};

export default FilterableReportsTable;
