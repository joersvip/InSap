import React, { useEffect, useState } from "react";
import { Shield, Lock, Activity, Users, MessageSquare, Terminal, Database, FileCode, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import Navigation from "./components/Navigation";
import DashboardView from "./components/DashboardView";
import WhatsAppSyncView from "./components/WhatsAppSyncView";
import IntelligenceView from "./components/IntelligenceView";
import MonitoringView from "./components/MonitoringView";
import AuditLogView from "./components/AuditLogView";
import DeploymentView from "./components/DeploymentView";
import { Chat, SystemMetrics, ServiceStatus, AuditLog, DatabaseBackup } from "./types";

interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
}

export default function App() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [authError, setAuthError] = useState("");

  // UI Tabs
  const [activeTab, setActiveTab] = useState("dashboard");

  // Telemetry Metrics
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 18,
    ram: 64.5,
    storage: 42.1,
    ram_bytes: "10.3 GB / 16 GB",
    storage_bytes: "210.5 GB / 500 GB"
  });

  const [services, setServices] = useState<ServiceStatus>({
    postgresql: { status: "running", port: 5432, uptime: "12 days, 4 hours", dbSize: "182.4 MB" },
    redis: { status: "running", port: 6379, uptime: "12 days, 4 hours", memoryUsed: "4.2 MB" },
    baileys: { status: "connected", phone: "+62 821-4433-2211", device: "Linux - WhatsApp Web", delay: "45ms" },
    ollama: { status: "running", port: 11434, modelLoaded: "llama3:8b (running on CPU/GPU)" },
    laravelQueue: { status: "running", activeWorkers: 2, pendingJobs: 0, failedJobs: 2 }
  });

  // App Data states
  const [chats, setChats] = useState<Chat[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  
  // Progress/Interaction states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Floating Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "info" | "warning") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch initial telemetry data
  const fetchStatusAndData = async () => {
    try {
      // Fetch system status
      const statusRes = await fetch("/api/status");
      if (statusRes.ok) {
        const data = await statusRes.json();
        setMetrics(data.metrics);
        setServices(data.services);
      }

      // Fetch chats
      const chatsRes = await fetch("/api/chats");
      if (chatsRes.ok) {
        const data = await chatsRes.json();
        setChats(data.chats);
        if (data.chats.length > 0 && !selectedChatId) {
          setSelectedChatId(data.chats[0].id);
        }
      }

      // Fetch audit logs
      const logsRes = await fetch("/api/audit-logs");
      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs);
      }

      // Fetch backups
      const backupsRes = await fetch("/api/backups");
      if (backupsRes.ok) {
        const data = await backupsRes.json();
        setBackups(data.backups);
      }
    } catch (err) {
      console.error("Failed to load backend telemetry feed:", err);
    }
  };

  // Periodical metrics updater (every 5 seconds)
  useEffect(() => {
    fetchStatusAndData();
    const interval = setInterval(() => {
      fetchStatusAndData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true);
      setAuthError("");
      addToast("Selamat Datang, Komandan! Sesi aman terverifikasi.", "success");
    } else {
      setAuthError("Kredensial salah. Gunakan admin / admin.");
    }
  };

  // Trigger sync simulation
  const handleTriggerSync = async (type: "chats" | "contacts" | "groups") => {
    setIsSyncing(true);
    addToast(`Menghubungi Baileys microservice untuk sinkronisasi ${type}...`, "info");
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (response.ok) {
        // Wait for background sync delay
        setTimeout(() => {
          fetchStatusAndData();
          setIsSyncing(false);
          addToast(`Sinkronisasi ${type} selesai! Database diperbarui.`, "success");
        }, 4000);
      }
    } catch (err) {
      setIsSyncing(false);
      addToast("Koneksi ke Baileys service gagal.", "warning");
    }
  };

  // Trigger manual database backup
  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    addToast("Menjalankan pg_dump di dalam PostgreSQL container...", "info");
    try {
      const response = await fetch("/api/backup", { method: "POST" });
      if (response.ok) {
        fetchStatusAndData();
        addToast("Database PostgreSQL berhasil dibackup lokal!", "success");
      }
    } catch (err) {
      addToast("Gagal melakukan backup database.", "warning");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleManualMetricsRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatusAndData();
    setTimeout(() => {
      setIsRefreshing(false);
      addToast("Kinerja host berhasil disegarkan.", "success");
    }, 8000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e4e4e7] flex font-sans antialiased selection:bg-blue-500/30 selection:text-blue-400">
      
      {/* 1. Login Gate */}
      {!isLoggedIn ? (
        <div className="w-full flex items-center justify-center p-6 bg-[#050505]">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-zinc-800 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden space-y-6">
            
            {/* Design accents */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            
            <div className="text-center space-y-2">
              <div className="inline-flex bg-blue-500/10 p-3 rounded-full border border-blue-500/30 text-blue-400 mb-1 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-lg font-bold tracking-widest text-zinc-100 uppercase">INTELLIGENCE WHATSAPP</h1>
              <p className="text-[10px] text-blue-400 font-mono tracking-wider uppercase">SECURE TERMINAL ACCESS</p>
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-lg text-xs text-rose-400 font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-zinc-500">@</span>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#050505] text-zinc-200 text-xs pl-10 pr-4 py-3 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-zinc-500">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#050505] text-zinc-200 text-xs pl-10 pr-4 py-3 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-blue-950/20 hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                Autentikasi Sesi
              </button>
            </form>

            <div className="text-center text-[10px] text-zinc-500 font-mono">
              IP LOKAL: 192.168.1.100 • ENKRIPSI AES-256
            </div>
          </div>
        </div>
      ) : (
        
        // 2. Full Dashboard Workspace
        <div className="w-full h-screen flex overflow-hidden bg-[#050505]">
          
          {/* Side navigation */}
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={() => {
              setIsLoggedIn(false);
              addToast("Sesi terminal ditutup dengan aman.", "info");
            }}
          />

          {/* Main workspace container */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
            
            {/* Topbar */}
            <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#0a0a0a]/50">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                <span className="text-xs font-semibold text-zinc-300">Stasiun Intelijen Lokal Aktif</span>
              </div>

              <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-4">
                <span>DATABASE: postgres@localhost</span>
                <span className="text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> OLLAMA: READY
                </span>
                <span>UTC TIME: 2026-07-01 20:38:47</span>
              </div>
            </header>

            {/* Dynamic workspace view scrollable */}
            <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
              {activeTab === "dashboard" && (
                <DashboardView
                  metrics={metrics}
                  services={services}
                  chats={chats}
                  onNavigate={setActiveTab}
                  triggerSyncAll={() => handleTriggerSync("chats")}
                  isSyncing={isSyncing}
                />
              )}

              {activeTab === "whatsapp" && (
                <WhatsAppSyncView
                  chats={chats}
                  isSyncing={isSyncing}
                  onSync={handleTriggerSync}
                  onSelectChat={setSelectedChatId}
                  selectedChatId={selectedChatId}
                  addToast={addToast}
                />
              )}

              {activeTab === "ai" && (
                <IntelligenceView
                  chats={chats}
                  addToast={addToast}
                />
              )}

              {activeTab === "monitoring" && (
                <MonitoringView
                  metrics={metrics}
                  services={services}
                  onRefresh={handleManualMetricsRefresh}
                  isRefreshing={isRefreshing}
                />
              )}

              {activeTab === "audit" && (
                <AuditLogView
                  logs={auditLogs}
                  backups={backups}
                  triggerBackup={handleTriggerBackup}
                  isBackingUp={isBackingUp}
                  addToast={addToast}
                />
              )}

              {activeTab === "deployment" && (
                <DeploymentView />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Floating toast notifications array */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg backdrop-blur-md animate-fade-in ${
              toast.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-200"
                : toast.type === "warning"
                ? "bg-rose-950/80 border-rose-500/30 text-rose-200"
                : "bg-slate-900/90 border-slate-800 text-slate-200"
            }`}
          >
            <span className="mt-0.5">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : toast.type === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <Info className="w-4 h-4 text-slate-400" />
              )}
            </span>
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
