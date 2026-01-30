<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Rkt;
use App\Models\RktRecommendation;
use App\Services\ArkasRecommendationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $auth = Auth();
        $user = Auth::user();
        $userId = $user->id;

        $userType = $auth->guard('web')->user()->type;
        $report = Report::where('user_id', $userId)->paginate(25);
        if (!$userType) {
            return redirect('/');
        }

        return Inertia::render('Dashboard/index', ['report' => $report]);
    }

    public function detailReport($reportId, ArkasRecommendationService $arkasService)
    {
        $rkts = Rkt::where('report_id', $reportId)->get();
        $recommendations = RktRecommendation::where('report_id', $reportId)->get();
        $report = Report::find($reportId);
        $arkas = \App\Models\Arkas::where('report_id', $reportId)->get();

        $arkasRecommendations = \App\Models\ArkasRecommendation::where('report_id', $reportId)->get();
        
        if ($arkasRecommendations->isEmpty()) {
            try {
                $arkasService->generate($reportId);
                $arkasRecommendations = \App\Models\ArkasRecommendation::where('report_id', $reportId)->get();
            } catch (\Exception $e) {
                dd($e);
                // Log the error but proceed without crashing the page
                \Illuminate\Support\Facades\Log::error('Failed to auto-generate Arkas Recommendations: ' . $e->getMessage());
            }
        }

        return Inertia::render('Dashboard/DetailReport', [
            'rkts' => $rkts, 
            'recommendations' => $recommendations, 
            'report' => $report, 
            'arkas' => $arkas,
            'arkasRecommendations' => $arkasRecommendations
        ]);
    }
}
