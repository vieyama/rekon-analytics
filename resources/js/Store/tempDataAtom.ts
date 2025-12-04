import { atomWithStorage } from 'jotai/utils'

export type AnalyticDetailType = {
    identifications: string;
    priorities_score: number;
    aggregates_score: number;
    arkas_score: number;
    priorities_indicator: string;
    aggregates_indicator: string;
    arkas_indicator: string;
}

export interface Rkts {
    id: number;
    report_id: number;
    identification: string;
    root_problem: string;
    fixing_activity: string;
    implementation_activity: string;
    priorities_identification_score: number;
    priorities_root_problem_score: number;
    priorities_fixing_activity_score: number;
    priorities_implementation_activity_score: number;
    priorities_score: number;
    aggregates_identification_score: number;
    aggregates_root_problem_score: number;
    aggregates_fixing_activity_score: number;
    aggregates_implementation_activity_score: number;
    aggregates_score: number;
    created_at: Date;
    updated_at: Date;
}

export type TempDataType = {
    id: number,
    user_id: number,
    year: string,
    priorities_score: number,
    aggregates_score: number,
    arkas_score: number,
    created_at: string,
    updated_at: string
    analytic_detail?: AnalyticDetailType[]
}

export const tempDataAtom = atomWithStorage<TempDataType[] | null>('tempData', [])
