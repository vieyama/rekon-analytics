import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Rkt } from './RktTable';
import { cn } from '@/lib/utils';
import activityDataset from '../../../../data/activityDataset.json';
import descriptionActivityDataset from '../../../../data/descriptionActivityDataset.json';

export interface Arkas {
    id: number;
    fixing_activity: string;
    wrong_fixing_activity?: boolean;
    implementation_description: string;
    wrong_implementation_description?: boolean;
    arkas_activity: string;
    wrong_arkas_activity?: boolean;
    arkas_activity_description: string;
    wrong_arkas_activity_description?: boolean;
    budget_month: string;
    quantity: number;
    unit: string;
    wrong_unit?: boolean;
    unit_price: number;
    wrong_unit_price?: boolean;
    total_price: number;
    wrong_total_rice?: boolean;
}

interface ArkasTableProps {
    arkas: Arkas[];
    rkts: Rkt[];
}

export default function ArkasTable({ arkas, rkts }: ArkasTableProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Rencana Kegiatan Anggaran Sekolah</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">No</TableHead>
                                <TableHead className="min-w-[300px]">Kegiatan Benahi</TableHead>
                                <TableHead className="min-w-[400px]">Penjelasan Implementasi Kegiatan</TableHead>
                                <TableHead className="min-w-[300px]">Kegiatan ARKAS</TableHead>
                                <TableHead className="min-w-[400px]">Penjelasan Kegiatan ARKAS</TableHead>
                                <TableHead>Bulan</TableHead>
                                <TableHead>Kuantitas</TableHead>
                                <TableHead>Satuan</TableHead>
                                <TableHead>Harga Satuan</TableHead>
                                <TableHead>Total Harga</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {arkas && arkas.length > 0 ? (
                                arkas.map((item, index) => {
                                    const A = item.fixing_activity
                                    const B = item.implementation_description
                                    const C = rkts.find((rkt) => rkt.fixing_activity.toLowerCase() === A.toLowerCase())
                                    const D = C?.implementation_activity
                                    const E = item.arkas_activity
                                    const M = Number(item.total_price?.toString().split('.')[0])

                                    const formulaA = B === D && C?.is_require_cost === 0
                                    const formulaB = !activityDataset.find(item => item.activity_name.toLowerCase() === E.toLowerCase())
                                    const selecteddescriptionActivityDataset = descriptionActivityDataset.find(dad => dad.product_name.toLowerCase() === item.arkas_activity_description.toLowerCase())
                                    const formulaC = !selecteddescriptionActivityDataset
                                    const formulaD = formulaC
                                    const formulaE = !selecteddescriptionActivityDataset?.unit?.toLowerCase().includes(item.unit.toLowerCase())
                                    const formulaF = Number(item.unit_price?.toString().split('.')[0]) > Number(selecteddescriptionActivityDataset?.max_price)
                                    const formulaG = M !== Number(item.unit_price?.toString().split('.')[0]) * item.quantity

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center align-top">{index + 1}</TableCell>

                                            {/* Kegiatan Benahi */}
                                            <TableCell className={cn("align-top", formulaA && "bg-red-200")}>
                                                {item.fixing_activity}
                                            </TableCell>
                                            {/* Penjelasan Implementasi Kegiatan */}
                                            <TableCell className={cn("align-top", formulaA && "bg-red-200")}>
                                                {item.implementation_description}
                                            </TableCell>

                                            {/* Kegiatan ARKAS & Uraian - Dataset check (Placeholder for now) */}
                                            {/* e != f, d != g. Since we don't have dataset, we leave as is */}
                                            <TableCell className={cn("align-top", formulaB && "bg-red-200")}>
                                                {item.arkas_activity}
                                            </TableCell>
                                            <TableCell className={cn("align-top", formulaC && "bg-red-200")}>
                                                {item.arkas_activity_description}
                                            </TableCell>

                                            <TableCell className="align-top">{item.budget_month}</TableCell>

                                            {/* Math Error Highlights */}
                                            <TableCell className={cn("align-top", item.wrong_unit && "bg-red-200")}>
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className={cn("align-top", formulaD ? "bg-gray-200" : formulaE && "bg-red-200")}>
                                                {item.unit}
                                            </TableCell>
                                            <TableCell className={cn("align-top", formulaD ? "bg-gray-200" : formulaF && "bg-red-200")}>
                                                {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0
                                                }).format(item.unit_price)}
                                            </TableCell>
                                            <TableCell className={cn("align-top", formulaG && "bg-red-200")}>
                                                {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0
                                                }).format(item.total_price)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })

                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center h-24">
                                        Tidak ada data ARKAS.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
