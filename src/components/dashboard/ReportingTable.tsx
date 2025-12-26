import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Truck, TruckFormData } from '@/types/truck';
import TruckActions from './TruckActions';
import { useAuth } from '@/contexts/AuthContext';

interface ReportingTableProps {
    trucks: Truck[];
    onTruckSelect: (truck: Truck) => void;
    onUpdateTruck: (truckId: string, data: Partial<TruckFormData>) => Promise<void>;
    onDeleteTruck: (truckId: string) => Promise<void>;
}

const statusColors = {
    waiting: 'bg-gray-500',
    en_route: 'bg-blue-500',
    arrived: 'bg-green-500',
    depot: 'bg-purple-500',
    discharged: 'bg-slate-500',
};

const statusLabels = {
    waiting: 'في الانتظار',
    en_route: 'في الطريق',
    arrived: 'وصلت',
    depot: 'المخزن',
    discharged: 'منزلة',
};

const ReportingTable = ({ trucks, onTruckSelect, onUpdateTruck, onDeleteTruck }: ReportingTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const { user } = useAuth();

    const filteredTrucks = trucks.filter((truck) => {
        const matchesSearch =
            truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            truck.driverName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || truck.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="glass-card p-4 rounded-xl">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث برقم الشاحنة أو السائق..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                    >
                        الكل
                    </Button>
                    <Button
                        variant={statusFilter === 'en_route' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('en_route')}
                    >
                        في الطريق
                    </Button>
                    <Button
                        variant={statusFilter === 'arrived' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('arrived')}
                    >
                        وصلت
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">رقم اللوحة</TableHead>
                            <TableHead className="text-right">السائق</TableHead>
                            <TableHead className="text-right">الوجهة</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">رقم الوصول</TableHead>
                            <TableHead className="text-right">الموقع</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTrucks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    لا توجد شاحنات
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTrucks.map((truck) => {
                                const canEdit = user?.role === 'admin';
                                const canDelete = user?.role === 'admin';

                                return (
                                    <TableRow key={truck.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">{truck.plateNumber}</TableCell>
                                        <TableCell>{truck.driverName}</TableCell>
                                        <TableCell>{truck.destination || '-'}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[truck.status]}>
                                                {statusLabels[truck.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {truck.arrivalNumber ? (
                                                <Badge variant="outline">#{truck.arrivalNumber}</Badge>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onTruckSelect(truck)}
                                                className="gap-2"
                                            >
                                                <MapPin className="w-4 h-4" />
                                                عرض
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <TruckActions
                                                truck={truck}
                                                onUpdate={onUpdateTruck}
                                                onDelete={onDeleteTruck}
                                                canEdit={canEdit}
                                                canDelete={canDelete}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground text-center">
                عرض {filteredTrucks.length} من {trucks.length} شاحنة
            </div>
        </div>
    );
};

export default ReportingTable;
