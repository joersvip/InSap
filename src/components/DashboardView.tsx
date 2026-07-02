import React from "react";
import { MessageSquare, Users, Shield, RefreshCw, Radio, HardDrive, Cpu, Terminal } from "lucide-react";
import { Chat, SystemMetrics, ServiceStatus } from "../types";

interface DashboardViewProps {
  metrics: SystemMetrics;
  services: ServiceStatus;
  chats: Chat[];
  onNavigate: (tab: string) => void;
  triggerSyncAll: () => void;
  isSyncing: boolean;
}

export default function DashboardView({
  metrics,
  services,
  chats,
  onNavigate,
  triggerSyncAll,
  isSyncing
}: DashboardViewProps) {
  // Compute some stats
  const totalMessages = chats.reduce((acc, c) => acc + c.messages.length, 0);
  const unreadCount = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  // Hardcoded daily volume stats for custom visual bars
  const volumeData = [
    { day: "Mon", count: 120 },
    { day: "Tue", count: 185 },
    { day: "Wed", count: 240 },
    { day: "Thu", count: 190 },
    { day: "Fri", count: 280 },
    { day: "Sat", count: 140 },
    { day: "Sun", count: totalMessages || 110 } // Dynamic based on current state
  ];

  const maxVolume = Math.max(...volumeData.map(v => v.count));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Pusat Komando Intelijen</h2>
          <p className="text-zinc-400 text-xs">Pemantauan real-time aktivitas komunikasi WhatsApp lokal & deteksi ancaman AI.</p>
        </div>
        <button
          onClick={triggerSyncAll}
          disabled={isSyncing}
          className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-950/20 active:scale-[0.98] ${
            isSyncing ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sinkronisasi..." : "Sinkronisasi Seluruh Data"}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Chat Terpantau</p>
            <h3 className="text-2xl font-bold font-mono text-blue-400 mt-1">{chats.length}</h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-1">✔ Terhubung</p>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/25 text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Pesan Intersept</p>
            <h3 className="text-2xl font-bold font-mono text-purple-400 mt-1">{totalMessages}</h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-1">{unreadCount} baru</p>
          </div>
          <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/25 text-purple-400">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Ancaman Terdeteksi AI</p>
            <h3 className="text-2xl font-bold font-mono text-rose-400 mt-1">2</h3>
            <p className="text-[10px] text-rose-400/80 font-mono mt-1">▲ Resiko Tinggi</p>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/25 text-rose-400 animate-pulse">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">WhatsApp Gateway</p>
            <h3 className="text-sm font-bold text-zinc-100 mt-2 capitalize flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
              {services.baileys.status === "connected" ? "Aktif & Online" : "Menunggu Sesi"}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">Baileys Multi-Device v6</p>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/25 text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Volume Chart & Quick Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat volume Chart */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          <div>
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">Volume Intersepsi Pesan Harian</h4>
            {/* Custom SVG/Tailwind Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-4 pt-4 font-mono">
              {volumeData.map((d, index) => {
                const heightPercentage = Math.round((d.count / maxVolume) * 100);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[9px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800">
                      {d.count}
                    </div>
                    <div className="w-full bg-[#050505] rounded-t-md relative overflow-hidden" style={{ height: "120px" }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-blue-500/70 hover:bg-blue-400/90 rounded-t-md transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 mt-4 border-t border-zinc-800/60 pt-3 flex items-center justify-between">
            <span>Rata-rata intersepsi harian: 195 pesan</span>
            <span className="text-blue-400 font-mono">Stabilitas Jaringan LAN: 99.98%</span>
          </div>
        </div>

        {/* Live Service Grid */}
        <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Status Layanan Docker Lokal</h4>
          <div className="space-y-2.5">
            {[
              { name: "PostgreSQL Database", port: 5432, status: services.postgresql.status },
              { name: "Redis Cache & Queue", port: 6379, status: services.redis.status },
              { name: "WhatsApp Gateway (Baileys)", port: 3001, status: services.baileys.status },
              { name: "Ollama Offline LLM", port: 11434, status: services.ollama.status },
              { name: "Laravel Queue Workers", port: "N/A", status: services.laravelQueue.status }
            ].map((srv, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-[#050505] rounded-lg border border-zinc-800/50">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-200">{srv.name}</span>
                  <span className="text-[9px] text-zinc-500 font-mono">Port {srv.port}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${srv.status === 'running' || srv.status === 'connected' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'}`}></span>
                  <span className="text-[10px] font-mono text-zinc-400 capitalize">{srv.status === 'running' || srv.status === 'connected' ? "Online" : "Offline"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Log Operasional Penting</h4>
          <button
            onClick={() => onNavigate("audit")}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono"
          >
            Lihat Semua Logs →
          </button>
        </div>
        <div className="space-y-3 font-mono">
          <div className="flex items-start gap-3 p-3 bg-[#050505] border border-zinc-800/40 rounded-lg">
            <span className="bg-rose-500/10 text-rose-400 p-1.5 rounded-lg border border-rose-500/20">
              <Shield className="w-3.5 h-3.5" />
            </span>
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-semibold">ANCAMAN SEDANG</span>
                <span className="text-[9px] text-zinc-500">Baru saja</span>
              </div>
              <p className="text-zinc-300 mt-1">Intersept chat "Hendra Wijaya" mendeteksi bukti transaksi keuangan mencurigakan senilai Rp 450.000.000.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#050505] border border-zinc-800/40 rounded-lg">
            <span className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg border border-blue-500/20">
              <Terminal className="w-3.5 h-3.5" />
            </span>
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-semibold">INFO SYSTEM</span>
                <span className="text-[9px] text-zinc-500">15 menit yang lalu</span>
              </div>
              <p className="text-zinc-300 mt-1">Sinkronisasi pesan selesai secara otomatis di latar belakang. 124 obrolan diperbarui.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
