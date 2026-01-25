<?php

namespace App\Http\Controllers;

use App\Models\Aggregates;
use App\Models\Priorities;
use App\Models\Report;
use App\Models\Rkt;
use App\Models\RktRecommendation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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
                'priorities_school_independent_program_score' => $request->report['priorities_school_independent_program_score'] ?? 0,
                'aggregates_school_independent_program_score' => $request->report['aggregates_school_independent_program_score'] ?? 0,
                'unselected_priorities_count' => $request->report['unselected_priorities_count'] ?? 0,
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
                    'fixing_activity_recommendation' => $rktData['fixing_activity_recommendation'] ?? null,
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

    public function generateRecommendation($id): RedirectResponse
    {
        try {
            $rkts = Rkt::where('report_id', $id)->get();
            $dataToAnalyze = [];

            if ($rkts->isNotEmpty()) {
                foreach ($rkts as $rkt) {
                    $dataToAnalyze[] = [
                        'identifikasi' => $rkt->identification,
                        'sub_indikator_akar_masalah' => $rkt->root_problem,
                        'kegiatan_benahi' => $rkt->fixing_activity,
                        'inspirasi_kegiatan' => $rkt->implementation_activity,
                    ];
                }
            } else {
                $priorities = Priorities::where('report_id', $id)->first();
                
                if (!$priorities) {
                    return redirect()->back()->with('error', 'Priorities data not found.');
                }

                $identifications = json_decode($priorities->identifications, true) ?? [];
                $rootProblems = json_decode($priorities->root_problems, true) ?? [];
                $fixingActivities = json_decode($priorities->fixing_activities, true) ?? [];
                $implementationActivities = json_decode($priorities->implementation_activities, true) ?? [];

                foreach ($identifications as $index => $identification) {
                    $dataToAnalyze[] = [
                        'identifikasi' => $identification,
                        'sub_indikator_akar_masalah' => $rootProblems[$index] ?? '',
                        'kegiatan_benahi' => $fixingActivities[$index] ?? '',
                        'inspirasi_kegiatan' => $implementationActivities[$index] ?? '',
                    ];
                }
            }
            
            $jsonInput = json_encode($dataToAnalyze, JSON_UNESCAPED_UNICODE);
            $itemCount = count($dataToAnalyze);
            
            Log::info('Preparing Gemini Prompt', ['item_count' => $itemCount]);
            
            $prompt = "Peran: Anda adalah seorang konsultan perencanaan pendidikan.

                    Tugas: Analisis data Rapor Pendidikan berikut yang berisi {$itemCount} item.
                    Anda WAJIB menghasilkan ARRAY JSON yang berisi tepat {$itemCount} objek rekomendasi.
                    Setiap objek input HARUS memiliki satu objek output yang bersesuaian.

                    PENTING:
                    1. Output HARUS berupa JSON Array murni `[...]`.
                    2. Jumlah item dalam array output HARUS SAMA dengan jumlah input ({$itemCount}).
                    3. Jangan pernah hanya mengembalikan satu item jika inputnya banyak.
                    4. Gunakan bahasa Indonesia yang formal dan operasional.

                    Format Struktur Objek dalam Array:
                    {
                    \"identification\": \"(Tuliskan nama indikator yang menjadi prioritas perbaikan sesuai data rapor.)\",
                    \"root_problem\": \"(Tuliskan sub-indikator akar masalah yang ingin diperbaiki sesuai data rapor.)\",
                    \"activity\": \"(Buatlah satu kegiatan operasional yang spesifik untuk menyelesaikan akar masalah. Jangan menyalin kata demi kata dari teks 'Kegiatan Benahi' di rapor, lakukan parafrase yang bermakna.)\",
                    \"implementation_description\": \"(Buatlah satu implementasi kegiatan spesifik turunan dari kegiatan benahi yang maksimal terdiri dari 15 kata yang menggabungkan metode (cara), subjek (siapa), dan objek (apa). Jangan menyalin kata demi kata dari inspirasi kegiatan rapor, lakukan parafrase yang bermakna.)\",
                    \"is_require_cost\": \"1 (Ya) / 0 (Tidak)\"
                    }

                    Data Input ({$itemCount} item):
                    {$jsonInput}";

            $aiModel = env('VITE_AI_MODEL');
            $apiKey = env('VITE_GEMINI_API_KEY');

            Log::info('Sending request to Gemini', ['model' => $aiModel, 'report_id' => $id]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(60)->post("https://generativelanguage.googleapis.com/v1beta/models/{$aiModel}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json'
                ]
            ]);
            
            Log::info('Gemini API Response', ['status' => $response->status(), 'body' => $response->body()]);

            if ($response->failed()) {
                Log::error('Gemini API Error', ['response' => $response->body()]);
                return redirect()->back()->with('error', 'Failed to generate recommendation from AI.');
            }

            $responseData = $response->json();
            $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';
            
            // Clean up Markdown code blocks if present
            $generatedText = str_replace(['```json', '```'], '', $generatedText);
            $recommendationDataArray = json_decode($generatedText, true);

            Log::info('Parsed Recommendation Data', ['data' => $recommendationDataArray, 'raw_text' => $generatedText]);

            if (!$recommendationDataArray || !is_array($recommendationDataArray)) {
                 Log::error('Gemini API Parse Error', ['text' => $generatedText]);
                 return redirect()->back()->with('error', 'Failed to parse AI response.');
            }

            // Ensure it's a list of objects, not a single object
            if (isset($recommendationDataArray['identification'])) {
                $recommendationDataArray = [$recommendationDataArray];
            }

            Log::info('Parsed Recommendation Data (Normalized)', ['count' => count($recommendationDataArray), 'expected' => $itemCount]);

            // Sync recommendations: Update existing by index, create new if needed
            $existingRecommendations = RktRecommendation::where('report_id', $id)->get()->values(); // Ensure 0-based index

            foreach ($recommendationDataArray as $index => $recommendationData) {
                $dataToSave = [
                    'report_id' => $id,
                    'identification' => $recommendationData['identification'] ?? '',
                    'root_problem' => $recommendationData['root_problem'] ?? '',
                    'activity' => $recommendationData['activity'] ?? '',
                    'implementation_description' => $recommendationData['implementation_description'] ?? '',
                    'is_require_cost' => isset($recommendationData['is_require_cost']) ? (int) $recommendationData['is_require_cost'] : 0,
                ];

                if (isset($existingRecommendations[$index])) {
                    $existingRecommendations[$index]->update($dataToSave);
                } else {
                    RktRecommendation::create($dataToSave);
                }
            }

            // Only delete excess records if we are confident we got a full list (or at least close to it)
            // If we expected 14 but got 1, DO NOT delete the other 13.
            if ($existingRecommendations->count() > count($recommendationDataArray)) {
                if (count($recommendationDataArray) >= $itemCount) {
                     $existingRecommendations->slice(count($recommendationDataArray))->each(function ($item) {
                        $item->delete();
                    });
                } else {
                    Log::warning('Gemini returned fewer items than expected. Skipping deletion of excess records.', [
                        'expected' => $itemCount,
                        'received' => count($recommendationDataArray)
                    ]);
                }
            }

            Log::info('Recommendations Saved', ['count' => count($recommendationDataArray)]);

            return redirect()->back()->with('success', 'Recommendations generated successfully.');

        } catch (\Exception $e) {
            Log::error('Generate Recommendation Error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'An error occurred: ' . $e->getMessage());
        }
    }
}
