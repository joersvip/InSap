<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WhatsAppController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes - Intelligence WhatsApp Analyzer
|--------------------------------------------------------------------------
*/

// Authentication
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Protected Routes (Enterprise Auth required)
Route::middleware('auth:sanctum')->group(function () {
    
    // WhatsApp Sync & QR Management
    Route::get('/whatsapp/status', [WhatsAppController::class, 'getStatus']);
    Route::get('/whatsapp/qr', [WhatsAppController::class, 'getQrCode']);
    Route::post('/whatsapp/sync', [WhatsAppController::class, 'triggerSync']);
    Route::post('/whatsapp/send', [WhatsAppController::class, 'sendMessage']);
    
    // Live Monitoring
    Route::get('/monitoring/metrics', [WhatsAppController::class, 'getSystemMetrics']);
    
    // AI Intelligence Analysis (Ollama Offline LLM Integration)
    Route::post('/ai/analyze-chat', [AIController::class, 'analyzeChatSession']);
    Route::get('/ai/models', [AIController::class, 'getAvailableModels']);
    
    // Database backups
    Route::get('/backups', [WhatsAppController::class, 'getBackups']);
    Route::post('/backups/create', [WhatsAppController::class, 'triggerBackup']);
});

// WhatsApp Gateway (Baileys Node Service) Webhook Receiver
Route::post('/whatsapp/webhook', [WhatsAppController::class, 'handleWebhook']);
