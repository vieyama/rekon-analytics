import { useState } from 'react';
import * as XLSX from 'xlsx';
import { mappingRtk, scoringData, normalize } from '@/lib/mapping-rtk-data';
import { router } from '@inertiajs/react';
import { toast } from './use-toast';

export type UploadStatus = 'idle' | 'Uploading ...' | 'Uploaded' | 'Processing ...' | 'Finished' | 'Error';

export function useFileUploader() {
    const [status, setStatus] = useState<UploadStatus>('idle');

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const extractSheetData = (sheet: XLSX.WorkSheet, type: string) => {
        const bKeys = Object.keys(sheet).filter(key => key.startsWith(type));
        const bValues = bKeys.map(key => sheet[key]);
        bValues.shift()
        return bValues.filter(item => item.w !== undefined).flatMap(item => item.w)
    }

    const uploadFile = async (file: File) => {
        // return await startProcess()
        setStatus('Uploading ...');
        await delay(500); // simulate uploading

        setStatus('Uploaded');
        await delay(200); // simulate uploaded waiting

        setStatus('Processing ...');
        try {
            const formData = new FormData();
            formData.append('file', file);

            await new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event: any) => {
                    try {
                        const workbook = XLSX.read(event.target.result, { type: 'binary' });
                        const reportTitle = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[3]], { header: 1 }) as string[];
                        const sheet = workbook.Sheets[workbook.SheetNames[3]];
                        const fullTitle = sheet['A1']?.v || '';

                        const year = reportTitle[0]?.[0]?.slice(-4)
                        const school_name = fullTitle.replace(year, '').replace('RKT', '').replace('REKOMENDASI PRIORITAS PBD', '').replace('TAHUN', '').trim();

                        // rtk data
                        const rtkData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[4]], { header: 1 });

                        const rktImplementationActivity = extractSheetData(workbook.Sheets[workbook.SheetNames[4]], 'E')

                        const rtkTempData = []

                        for (let index = 0; index < rktImplementationActivity.length; index++) {
                            const data = rtkData[index + 10] as string[]
                            rtkTempData.push(data)
                        }

                        const rtkProcessedData = mappingRtk(rtkTempData)

                        const prioritiesIdentification = extractSheetData(workbook.Sheets[workbook.SheetNames[3]], 'B')
                        const prioritiesRootProblems = extractSheetData(workbook.Sheets[workbook.SheetNames[3]], 'F')
                        const prioritiesFixingActivity = extractSheetData(workbook.Sheets[workbook.SheetNames[3]], 'G')
                        const prioritiesImplementationActivity = extractSheetData(workbook.Sheets[workbook.SheetNames[3]], 'H')

                        //aggregates data
                        const aggregatesIdentification = extractSheetData(workbook.Sheets[workbook.SheetNames[2]], 'B')
                        const aggregatesRootProblems = extractSheetData(workbook.Sheets[workbook.SheetNames[2]], 'F')
                        const aggregatesFixingActivity = extractSheetData(workbook.Sheets[workbook.SheetNames[2]], 'G')
                        const aggregatesImplementationActivity = extractSheetData(workbook.Sheets[workbook.SheetNames[2]], 'H')

                        const prioritiesScore = await scoringData(rtkProcessedData, prioritiesIdentification, prioritiesRootProblems, prioritiesFixingActivity, prioritiesImplementationActivity)
                            .catch((err) => {
                                console.log('Error', err)
                                toast({
                                    title: "Error",
                                    description: "Failed to generate calculate priorities score",
                                    variant: "destructive"
                                })
                            });

                        const aggregatesScore = await scoringData(rtkProcessedData, aggregatesIdentification, aggregatesRootProblems, aggregatesFixingActivity, aggregatesImplementationActivity)
                        const count = rtkProcessedData.length;

                        const totals = rtkProcessedData.map((_, index) => ({
                            priorities_score: (prioritiesScore && Array.isArray(prioritiesScore) ? prioritiesScore[index]?.final_score : 0),
                            aggregates_score: aggregatesScore[index].final_score,
                            priorities_is_school_independent_program: (prioritiesScore && Array.isArray(prioritiesScore) ? prioritiesScore[index]?.is_school_independent_program : false),
                            aggregates_is_school_independent_program: aggregatesScore[index].is_school_independent_program

                        })).reduce(
                            (acc, curr) => {
                                acc.total_priorities_score += curr.priorities_score;
                                acc.total_aggregates_score += curr.aggregates_score;
                                if (curr.priorities_is_school_independent_program) {
                                    acc.total_priorities_school_independent_program += 1;
                                }
                                if (curr.aggregates_is_school_independent_program) {
                                    acc.total_aggregates_school_independent_program += 1;
                                }
                                return acc;
                            },
                            {
                                total_priorities_score: 0,
                                total_aggregates_score: 0,
                                total_priorities_school_independent_program: 0,
                                total_aggregates_school_independent_program: 0
                            }
                        );

                        const average_priorities_score = totals.total_priorities_score / count;
                        const average_aggregates_score = totals.total_aggregates_score / count;

                        // Calculate unselected priorities (based on BOTH identification AND root problem)
                        const rtkKeys = new Set(rtkProcessedData.map(item => `${normalize(item.identification)}|${normalize(item.root_problems)}`));

                        const unselectedPriorities = prioritiesIdentification.filter((id, index) => {
                            const rootProblem = prioritiesRootProblems[index];
                            const key = `${normalize(id)}|${normalize(rootProblem)}`;
                            return !rtkKeys.has(key);
                        });

                        const payloadData = {
                            report: {
                                year,
                                school_name,
                                priorities_score: average_priorities_score.toFixed(2),
                                aggregates_score: average_aggregates_score.toFixed(2),
                                priorities_school_independent_program_score: totals.total_priorities_school_independent_program,
                                aggregates_school_independent_program_score: totals.total_aggregates_school_independent_program,
                                unselected_priorities_count: unselectedPriorities.length
                            },
                            rtk: rtkProcessedData.map((rtk, index) => ({
                                ...rtk,
                                priorities_identification_score: (prioritiesScore && Array.isArray(prioritiesScore) ? prioritiesScore[index]?.identification_score : 0),
                                priorities_root_problem_score: (prioritiesScore && Array.isArray(prioritiesScore) ? prioritiesScore[index]?.root_problem_score : 0),
                                priorities_fixing_activity_score: (prioritiesScore && Array.isArray(prioritiesScore) ? prioritiesScore[index]?.fixing_activity_score : 0),
                                priorities_implementation_activity_score: (prioritiesScore && Array.isArray(prioritiesScore) ? prioritiesScore[index]?.implementation_activity_score : 0),
                                priorities_score: (prioritiesScore && Array.isArray(prioritiesScore) ? prioritiesScore[index]?.final_score : 0),
                                fixing_activity_recommendation: (prioritiesScore && Array.isArray(prioritiesScore) ? prioritiesScore[index]?.fixing_activity_recommendation : ''),
                                aggregates_identification_score: aggregatesScore[index].identification_score,
                                aggregates_root_problem_score: aggregatesScore[index].root_problem_score,
                                aggregates_fixing_activity_score: aggregatesScore[index].fixing_activity_score,
                                aggregates_implementation_activity_score: aggregatesScore[index].implementation_activity_score,
                                aggregates_score: aggregatesScore[index].final_score,
                            })),
                            priorities: {
                                identifications: prioritiesIdentification,
                                root_problems: prioritiesRootProblems,
                                fixing_activity: prioritiesFixingActivity,
                                implementation_activity: prioritiesImplementationActivity
                            },
                            aggregates: {
                                identifications: aggregatesIdentification,
                                root_problems: aggregatesRootProblems,
                                fixing_activity: aggregatesFixingActivity,
                                implementation_activity: aggregatesImplementationActivity
                            }
                        }

                        router.post('report', payloadData)
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.readAsArrayBuffer(file);
            });

        } catch (error) {
            console.error(error);
        }
        await delay(500); // simulate uploaded waiting
        setStatus('Finished');

        await delay(300); // simulate processing
        setStatus('idle');

    };

    return { status, uploadFile };
}
