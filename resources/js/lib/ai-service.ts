
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_AI_MODEL;

export async function generateFixingActivityScore(data: {
    identification: string;
    rootProblems: string;
    fixingActivity: string;
    rktFixingActivity: string;
}) {
    const prompt = `
Peran: Anda adalah seorang Pakar Auditor Perencanaan Pendidikan yang spesifik bertugas mengevaluasi kualitas Rencana Kerja Tahunan (RKT) berdasarkan data Rapor Pendidikan.

Tugas: Analisis usulan RKT yang saya berikan berdasarkan Data Rapor Pendidikan yang tersedia.

Parameter Penilaian:
1. Keselarasan: Apakah Kegiatan benahi RKT menjawab langsung Akar Masalah?
2. Kualitas Parafrase: Apakah kegiatan benahi RKT merupakan hasil pemikiran bermakna dari kegiatan benahi rapor pendidikan?

Format Output Analisis (WAJIB JSON MURNI TANPA MARKDOWN):
{
  "parameter_level": "[Isi dengan: kurang / cukup / baik]",
  "score": [Berikan skor numerik dari 0.0 sampai 1.0],
  "recommendation": "[Berikan satu kegiatan operasional yang spesifik untuk menyelesaikan akar masalah. Jangan menyalin kata demi kata dari teks 'Kegiatan Benahi' di rapor, lakukan parafrase yang bermakna.]"
}

---
DATA UNTUK DIANALISIS:

Data Rapor Pendidikan:
- Identifikasi: ${data.identification}
- Akar Masalah: ${data.rootProblems}
- Kegiatan benahi: ${data.fixingActivity}

Usulan RKT yang Dievaluasi:
- Kegiatan benahi: ${data.rktFixingActivity}
---

Silakan berikan analisis Anda secara objektif.`;

    console.log('Sending request to Gemini', { model: MODEL });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("No content generated from Gemini API");
        }
        
        return JSON.parse(text);

    } catch (error) {
        console.error("Error generating fixing activity score:", error);
        throw error;
    }
}
