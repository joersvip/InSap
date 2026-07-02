<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    /**
     * Analyze Chat Session using local Ollama (Offline) or OpenAI
     */
    public function analyzeChatSession(Request $request)
    {
        $request->validate([
            'messages' => 'required|array',
            'analysis_type' => 'required|string', // sentiment, safety, threat_detection, summary
            'ai_engine' => 'required|string'      // ollama or openai
        ]);

        $messages = $request->input('messages');
        $analysisType = $request->input('analysis_type');
        $engine = $request->input('ai_engine');

        // Compile chat history to string
        $chatLog = "";
        foreach ($messages as $msg) {
            $chatLog .= "[{$msg['timestamp']}] {$msg['sender']}: {$msg['text']}\n";
        }

        $prompt = "Berikut adalah log percakapan WhatsApp. Analisis percakapan ini untuk kategori: {$analysisType}.\n\nLog Percakapan:\n{$chatLog}\n\nBerikan laporan terperinci dalam format JSON dengan kunci: 'summary', 'threatLevel' (Rendah/Sedang/Tinggi/Kritis), 'keyTopics', 'insights', 'recommendations', dan 'flaggedMessages'.";

        if ($engine === 'ollama') {
            return $this->queryOllama($prompt);
        } else {
            return $this->queryOpenAI($prompt);
        }
    }

    /**
     * Call Ollama local server (Offline Engine)
     */
    private function queryOllama($prompt)
    {
        $ollamaHost = env('OLLAMA_HOST', 'http://ollama:11434');

        try {
            $response = Http::timeout(60)->post("{$ollamaHost}/api/generate", [
                'model' => 'llama3:8b',
                'prompt' => $prompt,
                'stream' => false,
                'format' => 'json'
            ]);

            return response()->json([
                'success' => true,
                'engine' => 'Ollama (Local Offline)',
                'result' => json_decode($response->json()['response'], true)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Ollama server unreachable or model not loaded. Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Call OpenAI API (Optional Online Engine)
     */
    private function queryOpenAI($prompt)
    {
        $apiKey = env('OPENAI_API_KEY');
        if (!$apiKey) {
            return response()->json(['success' => false, 'error' => 'OpenAI API Key is not configured.'], 400);
        }

        try {
            $response = Http::withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ],
                'response_format' => ['type' => 'json_object']
            ]);

            return response()->json([
                'success' => true,
                'engine' => 'OpenAI Cloud',
                'result' => json_decode($response->json()['choices'][0]['message']['content'], true)
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
