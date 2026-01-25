<?php

namespace App\Http\Controllers;

use App\Models\Aggregates;
use App\Models\Priorities;
use App\Models\Report;
use App\Models\Rkt;
use App\Models\RktRecommendation;
use Illuminate\Http\Client\Pool;
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

            $rtkDataList = $request->rtk;
            $prioritiesData = $request->priorities;
            $prioritiesLookup = [];

            // Build lookup map for priorities (Reference Data)
            if (isset($prioritiesData['identifications']) && is_array($prioritiesData['identifications'])) {
                foreach ($prioritiesData['identifications'] as $index => $identification) {
                    $rootProblem = $prioritiesData['root_problems'][$index] ?? '';
                    $key = $this->normalize($identification) . '|' . $this->normalize($rootProblem);
                    
                    $prioritiesLookup[$key] = [
                        'fixing_activity' => $prioritiesData['fixing_activity'][$index] ?? '',
                        'implementation_activity' => $prioritiesData['implementation_activity'][$index] ?? '',
                    ];
                }
                Log::info('Priorities Lookup Built', ['count' => count($prioritiesLookup), 'sample_keys' => array_slice(array_keys($prioritiesLookup), 0, 3)]);
            }

            // Prepare AI requests
            $aiModel = env('VITE_AI_MODEL');
            $apiKey = env('VITE_GEMINI_API_KEY');
            $itemsToAnalyze = [];
            $aiResults = [];

            foreach ($rtkDataList as $index => $rkt) {
                // Skip independent programs for AI scoring
                $isIndependent = ($rkt['priorities_identification_score'] ?? 0) == 0;
                
                if (!$isIndependent) {
                    $identification = $rkt['identification'];
                    $rootProblem = $rkt['root_problems'];
                    $key = $this->normalize($identification) . '|' . $this->normalize($rootProblem);
                    
                    if (isset($prioritiesLookup[$key])) {
                        Log::info("Match Found for RKT index {$index}", ['key' => $key]);
                        $reference = $prioritiesLookup[$key];
                        
                        $itemsToAnalyze[] = [
                            'index' => $index,
                            'identification' => $identification,
                            'root_problem' => $rootProblem,
                            'ref_fixing' => $reference['fixing_activity'],
                            'ref_impl' => $reference['implementation_activity'],
                            'rkt_fixing' => $rkt['fixing_activity'],
                            'rkt_impl' => $rkt['implementation_activity'],
                        ];
                    } else {
                        Log::warning("No Match Found for RKT index {$index}", ['key' => $key, 'identification' => $identification, 'root_problems' => $rootProblem]);
                    }
                }
            }

            // Process in just 2 requests (Fixing & Implementation) for ALL items
            if (!empty($itemsToAnalyze)) {
                $promptFixingData = "";
                $promptImplData = "";

                foreach ($itemsToAnalyze as $item) {
                    $promptFixingData .= "
                    [Item ID: {$item['index']}]
                    - Identifikasi: {$item['identification']}
                    - Akar Masalah: {$item['root_problem']}
                    - Kegiatan Benahi (Ref): {$item['ref_fixing']}
                    - Kegiatan Benahi (RKT): {$item['rkt_fixing']}
                    -------------------";

                    $promptImplData .= "
                    [Item ID: {$item['index']}]
                    - Identifikasi: {$item['identification']}
                    - Akar Masalah: {$item['root_problem']}
                    - Inspirasi Kegiatan (Ref): {$item['ref_impl']}
                    - Kegiatan Benahi (RKT Context): {$item['rkt_fixing']}
                    - Implementasi Kegiatan (RKT): {$item['rkt_impl']}
                    -------------------";
                }

                $promptFixing = "Peran: Auditor Perencanaan Pendidikan.
                Tugas: Analisis Kualitas 'Kegiatan Benahi' pada RKT.
                
                Kriteria Penilaian:
                1. Keselarasan: Apakah menjawab langsung Akar Masalah?
                2. Kualitas Parafrase: Apakah bermakna (bukan copy-paste dari referensi)?

                Output JSON Array of Objects:
                [
                    {
                        \"id\": <Item ID>,
                        \"level\": \"kurang/cukup/baik\",
                        \"score\": 0.0 - 1.0,
                        \"recommendation\": \"Saran perbaikan operasional...\"
                    }
                ]

                DATA:
                {$promptFixingData}";

                $promptImpl = "Peran: Auditor Perencanaan Pendidikan.
                Tugas: Analisis Kualitas 'Implementasi Kegiatan' pada RKT.
                
                Kriteria Penilaian:
                1. Keselarasan: Apakah turunan spesifik dari kegiatan benahi?
                2. Kualitas Parafrase: Apakah bermakna (bukan copy-paste)?

                Output JSON Array of Objects:
                [
                    {
                        \"id\": <Item ID>,
                        \"level\": \"kurang/cukup/baik\",
                        \"score\": 0.0 - 1.0,
                        \"recommendation\": \"Saran perbaikan operasional...\"
                    }
                ]

                DATA:
                {$promptImplData}";

                try {
                    $responses = Http::pool(function (Pool $pool) use ($aiModel, $apiKey, $promptFixing, $promptImpl) {
                        return [
                            $pool->as('fix')->post("https://generativelanguage.googleapis.com/v1beta/models/{$aiModel}:generateContent?key={$apiKey}", [
                                'contents' => [['parts' => [['text' => $promptFixing]]]],
                                'generationConfig' => ['responseMimeType' => 'application/json'],
                            ]),
                            $pool->as('impl')->post("https://generativelanguage.googleapis.com/v1beta/models/{$aiModel}:generateContent?key={$apiKey}", [
                                'contents' => [['parts' => [['text' => $promptImpl]]]],
                                'generationConfig' => ['responseMimeType' => 'application/json'],
                            ]),
                        ];
                    });

                    // Parse Fix Results
                    if ($responses['fix']->successful()) {
                        $data = $responses['fix']->json();
                        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
                        $results = json_decode($text, true);
                        if (is_array($results)) {
                            foreach ($results as $res) {
                                if (isset($res['id'])) {
                                    $aiResults[$res['id']]['fix'] = $res;
                                }
                            }
                        }
                    } else {
                        Log::error('AI Fixing Request Failed', ['status' => $responses['fix']->status(), 'body' => $responses['fix']->body()]);
                    }

                    // Parse Impl Results
                    if ($responses['impl']->successful()) {
                        $data = $responses['impl']->json();
                        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
                        $results = json_decode($text, true);
                        if (is_array($results)) {
                            foreach ($results as $res) {
                                if (isset($res['id'])) {
                                    $aiResults[$res['id']]['impl'] = $res;
                                }
                            }
                        }
                    } else {
                        Log::error('AI Implementation Request Failed', ['status' => $responses['impl']->status(), 'body' => $responses['impl']->body()]);
                    }

                } catch (\Exception $e) {
                    Log::error('AI Pool Request Exception', ['message' => $e->getMessage()]);
                }
            }

            // Process results and update RKT list
            $totalPrioritiesScoreSum = 0;

            foreach ($rtkDataList as $index => &$rkt) {
                $fixData = $aiResults[$index]['fix'] ?? null;
                $implData = $aiResults[$index]['impl'] ?? null;

                if ($fixData || $implData) {
                    // Extract AI scores
                    $fixScore = $fixData['score'] ?? 0;
                    $fixLevel = $fixData['level'] ?? '';
                    $fixRec = $fixData['recommendation'] ?? '';
                    
                    $implScore = $implData['score'] ?? 0;
                    $implLevel = $implData['level'] ?? '';
                    $implRec = $implData['recommendation'] ?? '';

                    // Apply weights (0.15 each)
                    $weightedFixScore = $fixScore * 0.15;
                    $weightedImplScore = $implScore * 0.15;

                    $rkt['priorities_fixing_activity_score'] = $weightedFixScore;
                    $rkt['priorities_activity_level'] = $fixLevel;
                    $rkt['priorities_implementation_activity_score'] = $weightedImplScore;
                    $rkt['priorities_implementation_level'] = $implLevel;
                    $rkt['fixing_activity_recommendation'] = $fixRec;
                    $rkt['implementation_activity_recommendation'] = $implRec;

                    $itemTotalScore = ($rkt['priorities_identification_score'] ?? 0) +
                                      ($rkt['priorities_root_problem_score'] ?? 0) +
                                      $weightedFixScore +
                                      $weightedImplScore;
                    
                    $rkt['priorities_score'] = $itemTotalScore;
                    $totalPrioritiesScoreSum += $itemTotalScore;
                    
                    Log::info("AI Scored RKT {$index}", ['total' => $itemTotalScore, 'fix' => $fixScore, 'impl' => $implScore]);

                } else {
                    // Default / Independent / Failed AI
                    $rkt['priorities_fixing_activity_score'] = 0;
                    $rkt['priorities_activity_level'] = '';
                    $rkt['priorities_implementation_activity_score'] = 0;
                    $rkt['priorities_implementation_level'] = '';
                    $rkt['fixing_activity_recommendation'] = '';
                    $rkt['implementation_activity_recommendation'] = '';

                    // Partial score (Identification + Root Problem only)
                    $rkt['priorities_score'] = ($rkt['priorities_identification_score'] ?? 0) +
                                               ($rkt['priorities_root_problem_score'] ?? 0);
                    
                    if (! ($rkt['priorities_identification_score'] ?? 0) == 0) {
                         $totalPrioritiesScoreSum += $rkt['priorities_score'];
                    }
                }
            }
            unset($rkt); // Break reference

            // Calculate Final Priorities Score
            // Formula: Sum / (Total RTK - Independent + Unselected) * 100
            $prioritiesSchoolIndependentScore = $request->report['priorities_school_independent_program_score'] ?? 0;
            $unselectedPrioritiesCount = $request->report['unselected_priorities_count'] ?? 0;
            $totalRktData = count($rtkDataList);

            $denominator = ($totalRktData - $prioritiesSchoolIndependentScore) + $unselectedPrioritiesCount;
            $finalPrioritiesScore = $denominator > 0 ? ($totalPrioritiesScoreSum / $denominator) * 100 : 0;

            // 1. Insert into reports table
            $reportId = DB::table('reports')->insertGetId([
                'year' => $request->report['year'],
                'user_id' => $userId,
                'school_name' => $request->report['school_name'],
                'priorities_score' => $finalPrioritiesScore,
                'aggregates_score' => 0,
                'priorities_school_independent_program_score' => $prioritiesSchoolIndependentScore,
                'aggregates_school_independent_program_score' => $request->report['aggregates_school_independent_program_score'] ?? 0,
                'unselected_priorities_count' => $unselectedPrioritiesCount,
                'arkas_score' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Insert related rkts
            foreach ($rtkDataList as $rktData) {
                Rkt::create([
                    'report_id' => $reportId,
                    'identification' => $rktData['identification'],
                    'root_problem' => $rktData['root_problems'],
                    'fixing_activity' => $rktData['fixing_activity'],
                    'implementation_activity' => $rktData['implementation_activity'],
                    'is_require_cost' => $rktData['is_require_cost'] ?? false,
                    'fixing_activity_recommendation' => $rktData['fixing_activity_recommendation'],
                    'implementation_activity_recommendation' => $rktData['implementation_activity_recommendation'],
                    'priorities_identification_score' => $rktData['priorities_identification_score'],
                    'priorities_root_problem_score' => $rktData['priorities_root_problem_score'],
                    'priorities_fixing_activity_score' => $rktData['priorities_fixing_activity_score'],
                    'priorities_activity_level' => $rktData['priorities_activity_level'],
                    'priorities_implementation_activity_score' => $rktData['priorities_implementation_activity_score'],
                    'priorities_implementation_level' => $rktData['priorities_implementation_level'],
                    'priorities_score' => $rktData['priorities_score'],
                    'aggregates_identification_score' => $rktData['aggregates_identification_score'],
                    'aggregates_root_problem_score' => $rktData['aggregates_root_problem_score'],
                    'aggregates_fixing_activity_score' => 0,
                    'aggregates_implementation_activity_score' => 0,
                    'aggregates_score' => 0,
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

            return $this->generateRecommendation($reportId);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Insert failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return redirect()->back()->with('error', 'Insert failed: '.$e->getMessage());
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

                if (! $priorities) {
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
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                ],
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

            if (! $recommendationDataArray || ! is_array($recommendationDataArray)) {
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
                        'received' => count($recommendationDataArray),
                    ]);
                }
            }

            Log::info('Recommendations Saved', ['count' => count($recommendationDataArray)]);

            return redirect()->back()->with('success', 'Recommendations generated successfully.');

        } catch (\Exception $e) {
            Log::error('Generate Recommendation Error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return redirect()->back()->with('error', 'An error occurred: '.$e->getMessage());
        }
    }

    private function normalize($str): string
    {
        if (is_array($str)) {
            return '';
        }
        $str = (string) $str;
        // Remove prefix like "A.1 ", "B.2.1 "
        $str = preg_replace('/^[A-Z](\.\d+)+\s*/', '', $str);
        // Lowercase and remove all non-alphanumeric characters to be robust against whitespace differences
        return preg_replace('/[^a-z0-9]/', '', strtolower($str));
    }
}
