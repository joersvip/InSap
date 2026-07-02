<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class WhatsAppController extends Controller
{
    /**
     * Get Baileys Node Service status
     */
    public function getStatus()
    {
        try {
            $response = Http::get(env('BAILEYS_SERVICE_URL', 'http://baileys:3001') . '/status');
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['status' => 'offline', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get QR Code from Baileys Node Service
     */
    public function getQrCode()
    {
        try {
            $response = Http::get(env('BAILEYS_SERVICE_URL', 'http://baileys:3001') . '/qr');
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['status' => 'offline', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle incoming webhooks from Baileys WhatsApp Daemon
     */
    public function handleWebhook(Request $request)
    {
        $event = $request->input('event');
        
        if ($event === 'messages.upsert') {
            $messageData = $request->input('message');
            
            // Log incoming intercept and store in Postgres Database
            Log::info("WhatsApp Interceptor: New message stored.", ['id' => $messageData['id']]);
            
            // Perform asynchronous queueing if message matches risk vocabulary
            // dispatch(new \App\Jobs\AnalyzeIncomingMessage($messageData));
        }
        
        return response()->json(['success' => true]);
    }

    /**
     * Trigger background database backup using pg_dump
     */
    public function triggerBackup()
    {
        $backupScript = base_path('../backup.sh');
        $result = Process::run("sudo $backupScript");
        
        if ($result->successful()) {
            return response()->json(['success' => true, 'output' => $result->output()]);
        }
        
        return response()->json(['success' => false, 'error' => $result->errorOutput()], 500);
    }

    /**
     * Read system metrics for dashboard (CPU, RAM, Storage)
     */
    public function getSystemMetrics()
    {
        // On Linux target systems, read directly from procfs or free utility
        $cpu = sys_getloadavg()[0] * 100 / 4; // Simulated load normalized
        $free = shell_exec('free');
        
        return response()->json([
            'cpu' => round($cpu, 1),
            'ram' => $free ? 'Parsed Free RAM' : 'Local Host System',
            'storage' => disk_free_space('/')
        ]);
    }
}
