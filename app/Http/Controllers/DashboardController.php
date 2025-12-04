<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Rkt;
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

    public function detailReport($reportId)
    {
        $rkts = Rkt::where('report_id', $reportId)->get();
        $report = Report::find($reportId)->first();
        return Inertia::render('Dashboard/DetailReport', ['rkts' => $rkts, 'report' => $report]);
    }
}
