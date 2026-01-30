import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/Components/ui/popover';
import { X } from 'lucide-react';
import { useState } from 'react';
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

export interface ArkasRecommendation {
    id: number;
    report_id: number;
    fixing_activity: string;
    implementation_description: string;
    arkas_activity: string | null;
    arkas_activity_description: string | null;
    budget_month: string;
    quantity: number;
    unit: string | null;
    unit_price: number | null;
    total_price: number | null;
}

interface ArkasTableProps {
    arkas: Arkas[];
    arkasRecommendations: ArkasRecommendation[];
    rkts: Rkt[];
}

const WarningPopover = ({ children, title, content }: { children: React.ReactNode, title: string, content: string }) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="cursor-pointer w-full h-full min-h-[20px] flex items-start">
                    {children}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
                    <X 
                        className="h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                        }} 
                    />
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-700">{content}</p>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default function ArkasTable({ arkas, arkasRecommendations, rkts }: ArkasTableProps) {
    // Reusable Table Row Renderer
    const renderRow = (item: Arkas | ArkasRecommendation, index: number, isRecommendation: boolean = false) => {
        // Helper: normalize any value to a comparable string (lowercase, trimmed).
        // Prevents false mismatches due to casing/whitespace across ARKAS, RKT, and dataset fields.
        const normalize = (s: unknown) => (s ?? '').toString().toLowerCase().trim()
        // Mapping to formula variables for clarity:
        // A: ARKAS "Kegiatan Benahi" (fixing_activity)
        // B: ARKAS "Penjelasan Implementasi Kegiatan" (implementation_description)
        // C: RKT item that matches A by fixing_activity
        // D: RKT "Implementasi Kegiatan" from matched C
        // E: ARKAS "Kegiatan ARKAS" (arkas_activity)
        // M: Integer part of total_price (used for math check)
        const A = item.fixing_activity
        const B = item.implementation_description
        const C = rkts.find((rkt) => normalize(rkt.fixing_activity) === normalize(A))
        const D = C?.implementation_activity
        const E = item.arkas_activity
        const unitPriceInt = Math.floor(Number(item.unit_price ?? 0))
        const M = Math.floor(Number(item.total_price ?? 0))

        // Rumus A: Flag if B equals D (case-insensitive) AND RKT is_require_cost == 'Tidak'
        const requiresCostFalse = C ? (C.is_require_cost === false || C.is_require_cost === 0) : false
        const formulaA = !isRecommendation && normalize(B) === normalize(D) && requiresCostFalse
        // Rumus B: Flag if ARKAS activity E not found in activityDataset (case-insensitive)
        const formulaB = !isRecommendation && !activityDataset.find(act => normalize(act.activity_name) === normalize(E))
        // Dataset row matched by ARKAS "Penjelasan Kegiatan ARKAS" for unit and price validations
        const selecteddescriptionActivityDataset = descriptionActivityDataset.find(dad => normalize(dad.product_name) === normalize(item.arkas_activity_description))
        // Rumus C: No matching description in dataset
        const formulaC = !isRecommendation && !selecteddescriptionActivityDataset
        // Rumus D: Alias of C; used to gray out unit/price checks when dataset is missing
        const formulaD = formulaC
        // Rumus E: Unit mismatch; ARKAS unit must be included in dataset's unit list
        const formulaE = !isRecommendation && !selecteddescriptionActivityDataset?.unit?.toLowerCase().includes(normalize(item.unit))
        // Rumus F: Unit price greater than dataset max_price (only validate when dataset exists)
        const formulaF = !isRecommendation && (selecteddescriptionActivityDataset ? (unitPriceInt > Number(selecteddescriptionActivityDataset?.max_price ?? Number.POSITIVE_INFINITY)) : false)
        // Rumus G: Total price mismatch; total != unit_price * quantity (integer comparison)
        const formulaG = !isRecommendation && (M !== unitPriceInt * item.quantity)

        return (
            <TableRow key={item.id}>
                <TableCell className="text-center align-top">{index + 1}</TableCell>

                <TableCell className={cn("align-top p-0 h-px", formulaA && "bg-red-200")}>
                    {formulaA ? (
                        <WarningPopover
                            title="RKAS tidak berdasarkan RKT"
                            content="Data RKAS ini tidak berdasarkan RKT yang membutuhkan biaya."
                        >
                            <div className="w-full h-full p-4">
                                {item.fixing_activity}
                            </div>
                        </WarningPopover>
                    ) : (
                        <div className="w-full h-full p-4">
                            {item.fixing_activity}
                        </div>
                    )}
                </TableCell>
                {/* Penjelasan Implementasi Kegiatan */}
                <TableCell className={cn("align-top p-0 h-px", formulaA && "bg-red-200")}>
                    {formulaA ? (
                        <WarningPopover
                            title="RKAS tidak berdasarkan RKT"
                            content="Data RKAS ini tidak berdasarkan RKT yang membutuhkan biaya."
                        >
                            <div className="w-full h-full p-4">
                                {item.implementation_description}
                            </div>
                        </WarningPopover>
                    ) : (
                        <div className="w-full h-full p-4">
                            {item.implementation_description}
                        </div>
                    )}
                </TableCell>

                <TableCell className={cn("align-top p-0 h-px", formulaB && "bg-red-200")}>
                    {formulaB ? (
                        <WarningPopover
                            title="Kegiatan RKAS tidak sama dengan referensi kegiatan di ARKAS"
                            content="Saran perbaikan ubah agar sesuai referensi ARKAS."
                        >
                            <div className="w-full h-full p-4">
                                {item.arkas_activity}
                            </div>
                        </WarningPopover>
                    ) : (
                        <div className="w-full h-full p-4">
                            {item.arkas_activity}
                        </div>
                    )}
                </TableCell>
                <TableCell className={cn("align-top p-0 h-px", formulaC && "bg-red-200")}>
                    {formulaC ? (
                        <WarningPopover
                            title="Uraian kegiatan RKAS tidak sama dengan referensi barang di ARKAS"
                            content="Saran perbaikan ubah agar sesuai referensi ARKAS."
                        >
                            <div className="w-full h-full p-4">
                                {item.arkas_activity_description}
                            </div>
                        </WarningPopover>
                    ) : (
                        <div className="w-full h-full p-4">
                            {item.arkas_activity_description}
                        </div>
                    )}
                </TableCell>

                <TableCell className="align-top">{item.budget_month}</TableCell>

                <TableCell className={cn("align-top", 'wrong_unit' in item && item.wrong_unit && "bg-red-200")}>
                    {item.quantity}
                </TableCell>
                <TableCell className={cn("align-top", formulaD ? "bg-gray-200" : formulaE && "bg-red-200")}>
                    {item.unit}
                </TableCell>
                <TableCell className={cn("align-top p-0 h-px", formulaD ? "bg-gray-200" : formulaF && "bg-red-200")}>
                    {formulaF ? (
                        <WarningPopover
                            title="Harga Satuan RKAS tidak sama dengan referensi barang di ARKAS"
                            content="Saran perbaikan ubah agar sesuai referensi ARKAS."
                        >
                            <div className="w-full h-full p-4">
                                {new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(item.unit_price ?? 0)}
                            </div>
                        </WarningPopover>
                    ) : (
                        <div className="w-full h-full p-4">
                            {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0
                            }).format(item.unit_price ?? 0)}
                        </div>
                    )}
                </TableCell>
                <TableCell className={cn("align-top p-0 h-px", formulaG && "bg-red-200")}>
                    {formulaG ? (
                        <WarningPopover
                            title="Total Salah"
                            content="Total harga salah"
                        >
                            <div className="w-full h-full p-4">
                                {new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(item.total_price ?? 0)}
                            </div>
                        </WarningPopover>
                    ) : (
                        <div className="w-full h-full p-4">
                            {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0
                            }).format(item.total_price ?? 0)}
                        </div>
                    )}
                </TableCell>
            </TableRow>
        );
    }

    return (
        <div className="space-y-8">
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
                                    arkas.map((item, index) => renderRow(item, index))
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

            {arkasRecommendations && arkasRecommendations.length > 0 && (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Saran RKAS berdasarkan RKT yang belum terakomodir</CardTitle>
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
                                    {arkasRecommendations.map((item, index) => renderRow(item, index, true))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
