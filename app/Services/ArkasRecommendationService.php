<?php

namespace App\Services;

use App\Models\ArkasRecommendation;
use App\Models\Rkt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ArkasRecommendationService
{
    protected $activityDataset = [];
    protected $descriptionDataset = [];

    public function __construct()
    {
        $this->loadDatasets();
    }

    protected function loadDatasets()
    {
        $activityPath = resource_path('data/activityDataset.json');
        if (file_exists($activityPath)) {
            $this->activityDataset = json_decode(file_get_contents($activityPath), true) ?? [];
        }

        $descriptionPath = resource_path('data/descriptionActivityDataset.json');
        if (file_exists($descriptionPath)) {
            $this->descriptionDataset = json_decode(file_get_contents($descriptionPath), true) ?? [];
        }
    }

    protected function searchCandidates($query, $dataset, $searchField, $limit = 10)
    {
        if (empty($query) || empty($dataset)) {
            return [];
        }

        $queryTokens = array_filter(explode(' ', strtolower(preg_replace('/[^a-zA-Z0-9 ]/', '', $query))));
        $candidates = [];

        foreach ($dataset as $item) {
            $text = strtolower($item[$searchField] ?? '');
            $score = 0;
            foreach ($queryTokens as $token) {
                if (strpos($text, $token) !== false) {
                    $score++;
                }
            }
            
            if ($score > 0) {
                $item['score'] = $score;
                $candidates[] = $item;
            }
        }

        // Sort by score desc
        usort($candidates, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return array_slice($candidates, 0, $limit);
    }

    public function generate(int $reportId)
    {
        // Filter RKTs that require cost (is_require_cost = true) 
        $rkts = Rkt::where('report_id', $reportId)
            ->where('is_require_cost', true)
            ->get();

        if ($rkts->isEmpty()) {
            throw new \Exception('No RKT data found (filtered by is_require_cost=true)');
        }

        // Prepare RKT data for prompt with candidates
        $rktData = $rkts->map(function ($rkt) {
            $query = $rkt->fixing_activity . ' ' . $rkt->implementation_activity;
            
            $candidateActivities = $this->searchCandidates($query, $this->activityDataset, 'activity_name', 15);
            $candidateDescriptions = $this->searchCandidates($query, $this->descriptionDataset, 'product_name', 15);

            return [
                'kegiatan_benahi' => $rkt->fixing_activity,
                'implementasi_kegiatan' => $rkt->implementation_activity,
                'kebutuhan_biaya' => $rkt->is_require_cost ? 'Iya' : 'Tidak',
                'kandidat_kegiatan_arkas' => array_map(function($item) {
                    return $item['activity_name'];
                }, $candidateActivities),
                'kandidat_barang_jasa' => array_map(function($item) {
                    return [
                        'nama' => $item['product_name'],
                        'satuan' => $item['unit'],
                        'harga_max' => $item['max_price']
                    ];
                }, $candidateDescriptions)
            ];
        })->toArray();

        $aiModel = env('VITE_AI_MODEL');
        $apiKey = env('VITE_GEMINI_API_KEY');
        
        if (! $apiKey) {
            throw new \Exception('API Key not found');
        }

        // Construct Prompt
        $prompt = '
            Peran:
            Anda adalah Spesialis Administrasi Keuangan Sekolah yang sangat memahami:
            - Sistem ARKAS
            - Nomenklatur kegiatan ARKAS
            - Standar kewajaran biaya pendidikan

            Tujuan:
            Buatkan rekomendasi draft rincian RKAS yang logis, realistis, dan valid ARKAS
            berdasarkan DATA RKT yang diberikan.

            Setiap 1 data RKT harus menghasilkan tepat 1 rekomendasi RKAS.

            ------------------------------------------------
            INPUT:
            Saya akan memberikan ARRAY data RKT. Setiap item RKT dilengkapi dengan "kandidat_kegiatan_arkas" dan "kandidat_barang_jasa" yang relevan.
            
            Struktur Input:
            [
                {
                    "kegiatan_benahi": "...",
                    "implementasi_kegiatan": "...",
                    "kandidat_kegiatan_arkas": ["...", ...],
                    "kandidat_barang_jasa": [
                        {"nama": "...", "satuan": "...", "harga_max": ...},
                        ...
                    ]
                }
            ]

            ------------------------------------------------
            ATURAN KERAS (WAJIB DIPATUHI):

            1. Field berikut WAJIB disalin PERSIS dari input:
            - kegiatan_benahi
            - implementasi_kegiatan

            2. Untuk "arkas_activity":
            - PILIH SALAH SATU dari list "kandidat_kegiatan_arkas" yang paling relevan dengan "implementasi_kegiatan".
            - Jika tidak ada yang cocok sama sekali, boleh isi null.

            3. Untuk "arkas_activity_description", "unit", "unit_price":
            - PILIH SALAH SATU dari list "kandidat_barang_jasa" yang paling relevan.
            - "arkas_activity_description" ambil dari "nama".
            - "unit" ambil dari "satuan".
            - "unit_price" ambil dari "harga_max" (atau lebih rendah jika wajar).

            4. DILARANG MENGARANG:
            - Jangan membuat nama kegiatan atau barang sendiri di luar kandidat yang diberikan, KECUALI jika kandidat kosong atau sangat tidak relevan, maka set null.

            5. Jika tidak ditemukan kecocokan:
            - arkas_activity = null
            - arkas_activity_description = null
            - unit = null
            - unit_price = null
            - total_price = null

            6. budget_month harus logis (Januari - Desember).

            7. quantity harus realistis untuk satu sekolah.

            8. total_price = quantity * unit_price.

            9. Urutan output HARUS sama dengan urutan input.

            ------------------------------------------------
            FORMAT OUTPUT (WAJIB JSON ARRAY):

            [
            {
                "kegiatan_benahi": "string",
                "implementasi_kegiatan": "string",

                "arkas_activity": "string | null",
                "arkas_activity_description": "string | null",

                "budget_month": "string",
                "quantity": number,
                "unit": "string | null",
                "unit_price": number | null,
                "total_price": number | null
            }
            ]
            
            ------------------------------------------------
            DATA RKT (Input):
            '.json_encode($rktData);
        // dd($prompt);
        // Call Gemini API
        $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$aiModel}:generateContent?key={$apiKey}", [
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
            
        if ($response->successful()) {
            $data = $response->json();
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
            $recommendations = json_decode($text, true);

            if (is_array($recommendations)) {
                // Clear existing recommendations for this report to avoid duplicates
                ArkasRecommendation::where('report_id', $reportId)->delete();

                foreach ($recommendations as $rec) {
                    ArkasRecommendation::create([
                        'report_id' => $reportId,
                        'fixing_activity' => $rec['kegiatan_benahi'] ?? null,
                        'implementation_description' => $rec['implementasi_kegiatan'] ?? null,
                        'arkas_activity' => $rec['arkas_activity'] ?? null,
                        'arkas_activity_description' => $rec['arkas_activity_description'] ?? null,
                        'budget_month' => $rec['budget_month'] ?? null,
                        'quantity' => $rec['quantity'] ?? null,
                        'unit' => $rec['unit'] ?? null,
                        'unit_price' => $rec['unit_price'] ?? null,
                        'total_price' => $rec['total_price'] ?? null,
                    ]);
                }

                return $recommendations;
            } else {
                Log::error('AI Recommendation Parse Error', ['text' => $text]);
                throw new \Exception('Failed to parse AI response');
            }
        } else {
            Log::error('AI Recommendation Request Failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \Exception('AI request failed');
        }
    }
}
