// import { router } from '@inertiajs/react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
// import { stringSimilarity } from "string-similarity-js";
import { useAtom, useSetAtom } from 'jotai';
import { tempDataAtom, TempDataType } from '@/Store/tempDataAtom';
import { mappingRtk, scoringData } from '@/lib/mapping-rtk-data';
import { router } from '@inertiajs/react';

export type UploadStatus = 'idle' | 'Uploading ...' | 'Uploaded' | 'Processing ...' | 'Finished' | 'Error';

export function useFileUploader() {
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [data, setData] = useAtom(tempDataAtom)

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const startProcess = async () => {


    };

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

            const reader = new FileReader();
            reader.onload = (event: any) => {
                const workbook = XLSX.read(event.target.result, { type: 'binary' });
                const reportTitle = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[3]], { header: 1 }) as string[];

                const year = reportTitle[0]?.[0]?.slice(-4)

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
                const aggregatesFixingActivity = extractSheetData(workbook.Sheets[workbook.SheetNames[3]], 'G')
                const aggregatesImplementationActivity = extractSheetData(workbook.Sheets[workbook.SheetNames[3]], 'H')

                const prioritiesScore = scoringData(rtkProcessedData, prioritiesIdentification, prioritiesRootProblems, prioritiesFixingActivity, prioritiesImplementationActivity)

                const aggregatesScore = scoringData(rtkProcessedData, aggregatesIdentification, aggregatesRootProblems, aggregatesFixingActivity, aggregatesImplementationActivity)

                const count = rtkProcessedData.length;

                const totals = rtkProcessedData.map((_, index) => ({
                    priorities_score: prioritiesScore[index].final_score,
                    aggregates_score: aggregatesScore[index].final_score,

                })).reduce(
                    (acc, curr) => {
                        acc.total_priorities_score += curr.priorities_score;
                        acc.total_aggregates_score += curr.aggregates_score;
                        return acc;
                    },
                    { total_priorities_score: 0, total_aggregates_score: 0 }
                );

                const average_priorities_score = totals.total_priorities_score / count;
                const average_aggregates_score = totals.total_aggregates_score / count;

                const payloadData = {
                    report: { year, priorities_score: average_priorities_score.toFixed(2), aggregates_score: average_aggregates_score.toFixed(2) },
                    rtk: rtkProcessedData.map((rtk, index) => ({
                        ...rtk,
                        priorities_identification_score: prioritiesScore[index].identification_score,
                        priorities_root_problem_score: prioritiesScore[index].root_problem_score,
                        priorities_fixing_activity_score: prioritiesScore[index].fixing_activity_score,
                        priorities_implementation_activity_score: prioritiesScore[index].implementation_activity_score,
                        priorities_score: prioritiesScore[index].final_score,
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
            };

            reader.readAsBinaryString(file);

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
