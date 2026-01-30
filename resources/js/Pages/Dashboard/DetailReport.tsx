import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import RktTable, { Rkt, RktRecommendation } from './Components/RktTable';
import ArkasTable, { Arkas, ArkasRecommendation } from './Components/ArkasTable';

interface Report {
    year: string;
    school_name: string;
    priorities_score: number;
}

export default function DetailReport() {
    const { rkts, recommendations, report, arkas, arkasRecommendations } = usePage().props as unknown as {
        rkts: Rkt[],
        recommendations: RktRecommendation[],
        report: Report,
        arkas: Arkas[],
        arkasRecommendations: ArkasRecommendation[]
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Detail Rapor ${report.school_name} ${report.year}`} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-8">
                    {/* Header Section */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h1 className="text-2xl font-bold uppercase mb-2">
                            {report.school_name} TAHUN {report.year}
                        </h1>
                        <p className="text-lg">
                            Berdasarkan Rapor Pendidikan: <span className="font-semibold">{report.priorities_score ? parseFloat(report.priorities_score.toString()).toFixed(2) : 0}/100</span>
                        </p>
                    </div>

                    {/* Tabs Section */}
                    <Tabs defaultValue="rkt" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="rkt">Rencana Kerja Tahunan (RKT)</TabsTrigger>
                            <TabsTrigger value="arkas">Rencana Kegiatan Anggaran Sekolah (RKAS)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="rkt">
                            <RktTable rkts={rkts} recommendations={recommendations} />
                        </TabsContent>

                        <TabsContent value="arkas">
                            <ArkasTable arkas={arkas} arkasRecommendations={arkasRecommendations} rkts={rkts} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
