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
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog"
import { Button } from '@/Components/ui/button';
import { useState } from 'react';
import { router } from '@inertiajs/react';

export interface Rkt {
    id: number;
    identification: string;
    root_problem: string;
    fixing_activity: string;
    implementation_activity: string;
    is_require_cost: boolean | number;
    priorities_identification_score: number;
    priorities_root_problem_score: number;
    priorities_activity_level: string | null;
    priorities_implementation_level: string | null;
    fixing_activity_recommendation?: string | null;
    implementation_activity_recommendation?: string | null;
}

export interface RktRecommendation {
    id: number;
    identification: string;
    root_problem: string;
    activity: string;
    implementation_description: string;
    is_require_cost: boolean | number;
}

interface RktTableProps {
    rkts: Rkt[];
    recommendations: RktRecommendation[];
}

export default function RktTable({ rkts, recommendations }: RktTableProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isIndependentModalOpen, setIsIndependentModalOpen] = useState(false);
    const [selectedRkt, setSelectedRkt] = useState<Rkt | null>(null);
    const [selectedType, setSelectedType] = useState<'activity' | 'implementation' | null>(null);
    const [recommendationText, setRecommendationText] = useState<string>('');

    const handleRowClick = (isIndependent: boolean) => {
        if (isIndependent) {
            setIsIndependentModalOpen(true);
        }
    };

    const handleCellClick = (rkt: Rkt, type: 'activity' | 'implementation', level: string | null) => {
        if (!level) return;
        const normalizedLevel = level.toLowerCase();
        if (normalizedLevel === 'kurang' || normalizedLevel === 'cukup') {
            const recommendation = type === 'activity' ? rkt.fixing_activity_recommendation : rkt.implementation_activity_recommendation;
            if (recommendation) {
                setSelectedRkt(rkt);
                setSelectedType(type);
                setRecommendationText(recommendation);
                setIsModalOpen(true);
            }
        }
    };

    const handleAccept = () => {
        if (!selectedRkt || !selectedType) return;

        const data: any = {};
        if (selectedType === 'activity') {
            data.fixing_activity = recommendationText;
        } else {
            data.implementation_activity = recommendationText;
        }

        router.patch(route('rkt.update', selectedRkt.id), data, {
            onSuccess: () => {
                setIsModalOpen(false);
                setSelectedRkt(null);
                setSelectedType(null);
                setRecommendationText('');
            },
        });
    };

    const getRowColor = (isIndependent: boolean, type: 'activity' | 'implementation', level: string) => {
        if (isIndependent) {
            return 'bg-gray-200 hover:bg-gray-200';
        }

        const normalizedLevel = level.toLowerCase();
        const cursorClass = (normalizedLevel === 'kurang' || normalizedLevel === 'cukup') ? 'cursor-pointer hover:opacity-80' : '';

        if (normalizedLevel === 'cukup') return `bg-yellow-100 hover:bg-yellow-100 ${cursorClass}`;
        if (normalizedLevel === 'kurang') return `bg-red-100 hover:bg-red-100 ${cursorClass}`;
        if (normalizedLevel === 'baik') return 'bg-white hover:bg-white';

        return 'bg-white hover:bg-white';
    };

    const formatCost = (val: boolean | number) => {
        if (val === true || val === 1) return 'Ya';
        return 'Tidak';
    };

    return (
        <div className="space-y-8">
            {/* Table 1: RKTs */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Rencana Kerja Tahunan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Identifikasi</TableHead>
                                    <TableHead>Akar Masalah</TableHead>
                                    <TableHead>Kegiatan Benahi</TableHead>
                                    <TableHead>Penjelasan Implementasi Kegiatan</TableHead>
                                    <TableHead className="w-[150px]">Apakah Kegiatan Membutuhkan Biaya?</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rkts && rkts.length > 0 ? (
                                    rkts.map((rkt, index) => {
                                        const isIndependent = rkt?.priorities_identification_score === 0 || rkt?.priorities_root_problem_score === 0
                                        return (
                                            <TableRow
                                                key={rkt.id}
                                                className={isIndependent ? "bg-gray-200 hover:bg-gray-200 cursor-pointer" : "hover:bg-transparent"}
                                                onClick={() => handleRowClick(isIndependent)}
                                            >
                                                <TableCell className="text-center">{index + 1}</TableCell>
                                                <TableCell>{rkt.identification}</TableCell>
                                                <TableCell>{rkt.root_problem}</TableCell>
                                                <TableCell
                                                    className={getRowColor(isIndependent, 'activity', rkt.priorities_activity_level || '')}
                                                    onClick={(e) => {
                                                        if (!isIndependent) {
                                                            e.stopPropagation();
                                                            handleCellClick(rkt, 'activity', rkt.priorities_activity_level || '');
                                                        }
                                                    }}
                                                >
                                                    {rkt.fixing_activity}
                                                </TableCell>
                                                <TableCell
                                                    className={getRowColor(isIndependent, 'implementation', rkt.priorities_implementation_level || '')}
                                                    onClick={(e) => {
                                                        if (!isIndependent) {
                                                            e.stopPropagation();
                                                            handleCellClick(rkt, 'implementation', rkt.priorities_implementation_level || '');
                                                        }
                                                    }}
                                                >
                                                    {rkt.implementation_activity}
                                                </TableCell>
                                                <TableCell>{formatCost(rkt.is_require_cost)}</TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            Tidak ada data RKT.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Table 2: Recommendations */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Saran RKT berdasarkan analisis rapor pendidikan yang belum terakomodir</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Identifikasi</TableHead>
                                    <TableHead>Akar Masalah</TableHead>
                                    <TableHead>Kegiatan Benahi</TableHead>
                                    <TableHead>Penjelasan Implementasi Kegiatan</TableHead>
                                    <TableHead className="w-[150px]">Apakah Kegiatan Membutuhkan Biaya?</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recommendations && recommendations.length > 0 ? (
                                    recommendations.map((rec, index) => (
                                        <TableRow key={rec.id}>
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell>{rec.identification}</TableCell>
                                            <TableCell>{rec.root_problem}</TableCell>
                                            <TableCell>{rec.activity}</TableCell>
                                            <TableCell>{rec.implementation_description}</TableCell>
                                            <TableCell>{formatCost(rec.is_require_cost)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            Tidak ada saran rekomendasi.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {selectedRkt && (selectedType === 'activity' ? selectedRkt.priorities_activity_level : selectedRkt.priorities_implementation_level)} relevan dengan rapor pendidikan
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <h4 className="font-bold mb-2">Saran Perbaikan</h4>
                        <p className="text-gray-700">{recommendationText}</p>
                    </div>
                    <DialogFooter className="flex-row gap-4 sm:justify-between">
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full text-base py-6" onClick={handleAccept}>
                            Terima
                        </Button>
                        <Button variant="destructive" className="w-full text-base py-6 bg-red-600 hover:bg-red-700" onClick={() => setIsModalOpen(false)}>
                            Tolak
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isIndependentModalOpen} onOpenChange={setIsIndependentModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            RKT berdasarkan program mandiri sekolah
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-700">Data RKT tidak berbasis Rapor Pendidikan.</p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
