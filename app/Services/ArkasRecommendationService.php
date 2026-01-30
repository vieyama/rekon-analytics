<?php

namespace App\Services;

use App\Models\ArkasRecommendation;
use App\Models\Rkt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ArkasRecommendationService
{
    public function generate(int $reportId)
    {
        // Filter RKTs that require cost (is_require_cost = true) 
        $rkts = Rkt::where('report_id', $reportId)
            ->where('is_require_cost', true)
            ->get();

        if ($rkts->isEmpty()) {
            throw new \Exception('No RKT data found (filtered by is_require_cost=true)');
        }

        // Prepare RKT data for prompt
        $rktData = $rkts->map(function ($rkt) {
            return [
                'kegiatan_benahi' => $rkt->fixing_activity,
                'implementasi_kegiatan' => $rkt->implementation_activity,
                'kebutuhan_biaya' => $rkt->is_require_cost ? 'Iya' : 'Tidak',
            ];
        })->toArray();

        // Prepare Datasets
        // $activityDatasetPath = resource_path('data/activityDataset.json');
        // $descriptionDatasetPath = resource_path('data/descriptionActivityDataset.json');

        // if (! file_exists($activityDatasetPath) || ! file_exists($descriptionDatasetPath)) {
        //     throw new \Exception('Datasets not found');
        // }

        // $activityDataset = file_get_contents($activityDatasetPath);
        // $descriptionDataset = file_get_contents($descriptionDatasetPath);

        $aiModel = env('VITE_AI_MODEL');
        $apiKey = env('VITE_GEMINI_API_KEY');
        
        if (! $apiKey) {
            throw new \Exception('API Key not found');
        }

        // Helper to upload file to Gemini
        // $uploadFile = function ($content, $displayName, $mimeType = 'application/json') use ($apiKey) {
        //     $metadata = ['file' => ['display_name' => $displayName]];

        //     $response = Http::withHeaders([
        //         'X-Goog-Upload-Protocol' => 'multipart',
        //     ])->attach(
        //         'metadata', json_encode($metadata), 'metadata.json'
        //     )->attach(
        //         'file', $content, 'data.json', ['Content-Type' => $mimeType]
        //     )->post('https://generativelanguage.googleapis.com/upload/v1beta/files?key='.$apiKey);

        //     if ($response->successful()) {
        //         return $response->json()['file']['uri'];
        //     }

        //     Log::error('Gemini File Upload Failed', ['body' => $response->body()]);

        //     return null;
        // };/

        // Upload datasets
        // $activityUri = $uploadFile($activityDataset, 'activityDataset.json');
        // $descriptionUri = $uploadFile($descriptionDataset, 'descriptionActivityDataset.json');

        // if (! $activityUri || ! $descriptionUri) {
        //     throw new \Exception('Failed to upload datasets to AI');
        // }

        // Construct Prompt
        $prompt = '
            Peran:
            Anda adalah Spesialis Administrasi Keuangan Sekolah yang sangat memahami:
            - Sistem ARKAS
            - Nomenklatur kegiatan ARKAS
            - Dataset kegiatan dan dataset barang/jasa ARKAS
            - Standar kewajaran biaya pendidikan

            Tujuan:
            Buatkan rekomendasi draft rincian RKAS yang logis, realistis, dan valid ARKAS
            berdasarkan DATA RKT yang diberikan dalam bentuk ARRAY.

            Setiap 1 data RKT harus menghasilkan tepat 1 rekomendasi RKAS.

            ------------------------------------------------
            INPUT:
            Saya akan memberikan ARRAY data RKT dengan struktur:

            [
            {
                "kegiatan_benahi": "string",
                "implementasi_kegiatan": "string",
                "kebutuhan_biaya": "Iya | Tidak"
            }
            ]

            ------------------------------------------------
            ATURAN KERAS (WAJIB DIPATUHI):

            1. Field berikut WAJIB disalin PERSIS dari input tanpa perubahan apa pun:
            - kegiatan_benahi
            - implementasi_kegiatan

            2. Gunakan HANYA nama kegiatan yang benar-benar ada di activityDataset.json
            untuk field arkas_activity

            3. Gunakan HANYA barang/jasa, satuan, dan harga yang ada di
            descriptionActivityDataset.json untuk:
            - arkas_activity_description
            - unit
            - unit_price

            4. DILARANG:
            - Mengubah teks kegiatan_benahi
            - Mengubah teks implementasi_kegiatan
            - Mengarang nama kegiatan ARKAS
            - Mengarang barang, satuan, atau harga

            5. Jika tidak ditemukan kecocokan dataset yang valid:
            - arkas_activity = null
            - arkas_activity_description = null
            - unit = null
            - unit_price = null
            - total_price = null

            6. budget_month harus logis berdasarkan implementasi_kegiatan

            7. quantity harus realistis untuk satu sekolah

            8. total_price = quantity * unit_price
            (jika unit_price null, total_price harus null)

            9. Urutan output HARUS sama dengan urutan input

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
            BATASAN OUTPUT:
            - Output hanya JSON
            - Tidak ada teks penjelasan
            - Tidak ada markdown
            - Tidak ada komentar

            DATA RKT:
            '.json_encode($rktData);

        // Call Gemini API
        $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$aiModel}:generateContent?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                        // [
                        //     'file_data' => [
                        //         'mime_type' => 'application/json',
                        //         'file_uri' => $activityUri,
                        //     ],
                        // ],
                        // [
                        //     'file_data' => [
                        //         'mime_type' => 'application/json',
                        //         'file_uri' => $descriptionUri,
                        //     ],
                        // ],
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
