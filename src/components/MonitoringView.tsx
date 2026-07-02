import React, { useEffect, useState } from "react";
import { Cpu, HardDrive, Terminal, RefreshCw, Layers, ShieldCheck } from "lucide-react";
import { SystemMetrics, ServiceStatus } from "../types";

interface MonitoringViewProps {
  metrics: SystemMetrics;
  services: ServiceStatus;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function MonitoringView({
  metrics,
  services,
  onRefresh,
  isRefreshing
}: MonitoringViewProps) {
  // Live console command simulation
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM] Starting local resource diagnostic checks...",
    "[SYSTEM] Checking Docker daemon API socket... Ready.",
    "[DOCKER] PostgreSQL container (wa_intel_db) is listening on port 5432.",
    "[DOCKER] Redis container (wa_intel_redis) is listening on port 6379.",
    "[DOCKER] Baileys service container (wa_intel_baileys) status: CONNECTED.",
    "[DOCKER] Ollama service container (wa_intel_ollama) status: READY - llama3:8b loaded.",
    "[DOCKER] Laravel worker daemon (wa_intel_queue) status: LISTENING to queue:default.",
    "[SYSTEM] All local services are in healthy state."
  ]);

  const [inputCmd, setInputCmd] = useState("");

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;

    const cmd = inputCmd.toLowerCase().trim();
    let reply = `Command not recognized. Type 'help' for available terminal commands.`;

    if (cmd === "help") {
      reply = "Available commands:\n- status: Get summary of all container states\n- docker ps: List all container names\n- clear: Clear terminal logs\n- diagnose: Force health checks on database";
    } else if (cmd === "status") {
      reply = `CONTAINER DETAILS:\n- db (Postgres): ${services.postgresql.status.toUpperCase()} (Port 5432)\n- redis: ${services.redis.status.toUpperCase()} (Port 6379)\n- baileys: ${services.baileys.status.toUpperCase()} (Port 3001)\n- ollama: ${services.ollama.status.toUpperCase()} (Port 11434)`;
    } else if (cmd === "docker ps") {
      reply = "NAMES               IMAGE               STATUS          PORTS\nwa_intel_db         postgres:15-alpine  Up 12 days      0.0.0.0:5432->5432/tcp\nwa_intel_redis      redis:7-alpine      Up 12 days      0.0.0.0:6379->6379/tcp\nwa_intel_backend    laravel12-php8.4    Up 12 days      0.0.0.0:8000->8000/tcp\nwa_intel_baileys    baileys-node-gate   Up 12 days      0.0.0.0:3001->3001/tcp\nwa_intel_ollama     ollama/ollama:lat   Up 12 days      0.0.0.0:11434->11434/tcp\nwa_intel_nginx      nginx:alpine        Up 12 days      0.0.0.0:80->80/tcp";
    } else if (cmd === "clear") {
      setConsoleLogs([]);
      setInputCmd("");
      return;
    } else if (cmd === "diagnose") {
      reply = `[DIAGNOSTIC] Running system health analysis...\n- PostgreSQL connection: OK\n- Redis key store ping: OK (0.3ms)\n- Baileys socket link: ACTIVE\n- Local GPU acceleration: NVIDIA CUDA ready.`;
    }

    setConsoleLogs(prev => [...prev, `admin@local-station:~$ ${inputCmd}`, reply]);
    setInputCmd("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">System Resource & Services Monitoring</h2>
          <p className="text-zinc-400 text-xs">Informasi real-time kinerja perangkat keras host lokal dan status operasional kontainer Docker.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-2 border border-zinc-700 transition-all active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
          Perbarui Metrik
        </button>
      </div>

      {/* Hardware metrics dials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {/* CPU Box */}
        <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              CPU LOAD
            </span>
            <span className="text-blue-400 text-xs font-bold">{metrics.cpu}%</span>
          </div>
          <div className="w-full bg-[#050505] h-3.5 rounded-full overflow-hidden border border-zinc-800">
            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${metrics.cpu}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
            <span>Core: 8 (Intel Xeon v4)</span>
            <span>Uptime: 12d, 4h</span>
          </div>
        </div>

        {/* RAM Box */}
        <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              RAM UTILIZATION
            </span>
            <span className="text-cyan-400 text-xs font-bold">{metrics.ram.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-[#050505] h-3.5 rounded-full overflow-hidden border border-zinc-800">
            <div className="bg-cyan-500 h-full transition-all duration-1000" style={{ width: `${metrics.ram}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
            <span>Alokasi: {metrics.ram_bytes}</span>
            <span>Total Swap: 2.0 GB</span>
          </div>
        </div>

        {/* STORAGE Box */}
        <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              SSD STORAGE
            </span>
            <span className="text-indigo-400 text-xs font-bold">{metrics.storage}%</span>
          </div>
          <div className="w-full bg-[#050505] h-3.5 rounded-full overflow-hidden border border-zinc-800">
            <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${metrics.storage}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
            <span>Kapasitas: {metrics.storage_bytes}</span>
            <span>Type: NVMe Enterprise</span>
          </div>
        </div>
      </div>

      {/* Services Grid (PostgreSQL, Redis, Baileys, Ollama, Queue) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Services details */}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Detail Telemetri Layanan
          </h3>

          <div className="space-y-4 font-mono text-[11px]">
            {/* PostgreSQL */}
            <div className="p-3 bg-[#050505]/40 rounded-lg border border-zinc-800/60 space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-800/40 pb-1">
                <span className="font-bold text-zinc-200">PostgreSQL Database</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] uppercase font-bold">running</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-zinc-400">
                <span>Port: {services.postgresql.port}</span>
                <span>Uptime: {services.postgresql.uptime}</span>
                <span className="col-span-2">Ukuran Database: {services.postgresql.dbSize}</span>
              </div>
            </div>

            {/* Redis */}
            <div className="p-3 bg-[#050505]/40 rounded-lg border border-zinc-800/60 space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-800/40 pb-1">
                <span className="font-bold text-zinc-200">Redis cache & Queue</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] uppercase font-bold">running</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-zinc-400">
                <span>Port: {services.redis.port}</span>
                <span>Uptime: {services.redis.uptime}</span>
                <span className="col-span-2">Memori Dipakai: {services.redis.memoryUsed}</span>
              </div>
            </div>

            {/* Baileys */}
            <div className="p-3 bg-[#050505]/40 rounded-lg border border-zinc-800/60 space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-800/40 pb-1">
                <span className="font-bold text-zinc-200">Baileys WhatsApp socket</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] uppercase font-bold">connected</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-zinc-400">
                <span className="col-span-2">HP Terpaut: {services.baileys.phone}</span>
                <span>Device: {services.baileys.device}</span>
                <span>Respons: {services.baileys.delay}</span>
              </div>
            </div>

            {/* Ollama */}
            <div className="p-3 bg-[#050505]/40 rounded-lg border border-zinc-800/60 space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-800/40 pb-1">
                <span className="font-bold text-zinc-200">Ollama Offline LLM</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] uppercase font-bold">running</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-zinc-400">
                <span>Port: {services.ollama.port}</span>
                <span>Uptime: 12 days</span>
                <span className="col-span-2 text-cyan-400">Aktif: {services.ollama.modelLoaded}</span>
              </div>
            </div>

            {/* Laravel Queue */}
            <div className="p-3 bg-[#050505]/40 rounded-lg border border-zinc-800/60 space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-800/40 pb-1">
                <span className="font-bold text-zinc-200">Laravel Queue Worker</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] uppercase font-bold">running</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-zinc-400">
                <span>Pekerja: {services.laravelQueue.activeWorkers}</span>
                <span>Pending: {services.laravelQueue.pendingJobs}</span>
                <span className="text-rose-400 font-semibold">Gagal: {services.laravelQueue.failedJobs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Command Terminal simulation */}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl flex flex-col overflow-hidden h-full shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2 bg-[#050505]/40">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Host Diagnostic Console</h4>
          </div>

          {/* Body */}
          <div className="flex-1 bg-[#050505] p-4 font-mono text-[11px] space-y-2 text-zinc-300 overflow-y-auto h-[440px] flex flex-col justify-between">
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {consoleLogs.map((log, idx) => (
                <pre key={idx} className="whitespace-pre-wrap leading-relaxed">
                  {log}
                </pre>
              ))}
            </div>

            {/* Input terminal */}
            <form onSubmit={handleCommandSubmit} className="flex gap-2 border-t border-zinc-800/80 pt-3 mt-3">
              <span className="text-blue-400">admin@local-station:~$</span>
              <input
                type="text"
                value={inputCmd}
                onChange={(e) => setInputCmd(e.target.value)}
                placeholder="Ketik 'help' untuk daftar perintah..."
                className="flex-1 bg-transparent text-zinc-100 focus:outline-none placeholder-zinc-700"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
