<?php

namespace App\Http\Controllers;

use App\Models\Aggregates;
use App\Models\Priorities;
use App\Models\Report;
use App\Models\Rkt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    public function insert(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $userId = $user->id;
      
        try {
            DB::beginTransaction();
            // 1. Insert into reports table
            $reportId = DB::table('reports')->insertGetId([
                'year' => $request->report['year'],
                'user_id' => $userId,   
                'school_name' => $request->report['school_name'],
                'priorities_score' => $request->report['priorities_score'],
                'aggregates_score' => $request->report['aggregates_score'],
                'arkas_score' => $request->report['arkas_score'] ?? 0,
                "created_at" =>  now(), # new \Datetime()
                "updated_at" => now(),  # new \Datetime()
            ]);

            // 2. Insert related rkts
            foreach ($request->rtk as $rktData) {
                Rkt::create([
                    'report_id' => $reportId,
                    'identification' => $rktData['identification'],
                    'root_problem' => $rktData['root_problems'],
                    'fixing_activity' => $rktData['fixing_activity'],
                    'implementation_activity' => $rktData['implementation_activity'],
                    'is_require_cost' => $rktData['is_require_cost'] ?? false,
                    'priorities_identification_score' => $rktData['priorities_identification_score'],
                    'priorities_root_problem_score' => $rktData['priorities_root_problem_score'],
                    'priorities_fixing_activity_score' => $rktData['priorities_fixing_activity_score'],
                    'priorities_implementation_activity_score' => $rktData['priorities_implementation_activity_score'],
                    'priorities_score' => $rktData['priorities_score'],
                    'aggregates_identification_score' => $rktData['aggregates_identification_score'],
                    'aggregates_root_problem_score' => $rktData['aggregates_root_problem_score'],
                    'aggregates_fixing_activity_score' => $rktData['aggregates_fixing_activity_score'],
                    'aggregates_implementation_activity_score' => $rktData['aggregates_implementation_activity_score'],
                    'aggregates_score' => $rktData['aggregates_score'],
                ]);
            }

            // 3. Insert related priorities
            Priorities::create([
                'report_id' => $reportId,
                'identifications' => json_encode($request->priorities['identifications']),
                'root_problems' => json_encode($request->priorities['root_problems']),
                'fixing_activities' => json_encode($request->priorities['fixing_activity']),
                'implementation_activities' => json_encode($request->priorities['implementation_activity']),
            ]);

            // 4. Insert related aggregates
            Aggregates::create([
                'report_id' => $reportId,
                'identifications' => json_encode($request->aggregates['identifications']),
                'root_problems' => json_encode($request->aggregates['root_problems']),
                'fixing_activities' => json_encode($request->aggregates['fixing_activity']),
                'implementation_activities' => json_encode($request->aggregates['implementation_activity']),
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Data saved.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Insert failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Insert failed: ' . $e->getMessage());
        }
    }

    public function delete($id): RedirectResponse
    {
        $report = Report::find($id);
        $report->delete();

        return redirect()->back()->with('success', 'Data deleted.');
    }
}
