import React, { useState } from "react";
import { Database, Search, FileText, Download, CheckCircle2, RefreshCw, Plus } from "lucide-react";
import { AuditLog, DatabaseBackup } from "../types";

interface AuditLogViewProps {
  logs: AuditLog[];
  backups: DatabaseBackup[];
  triggerBackup: () => void;
  isBackingUp: boolean;
  addToast: (msg: string, type: "success" | "info" | "warning") => void;
}

export default function AuditLogView({
  logs,
  backups,
  triggerBackup,
  isBackingUp,
  addToast
}: AuditLogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.event.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.ip.includes(searchQuery);
    const matchesStatus = filterStatus === "all" || log.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Audit Log & Database Backup Manager</h2>
        <p className="text-zinc-400 text-xs">Pencatatan aktivitas administrator, log autentikasi, serta manajemen snapshot basis data PostgreSQL.</p>
      </div>

      {/* Database Backup Section */}
      <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-4 shadow-lg">
        <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">PostgreSQL Snapshot Backup</h3>
              <p className="text-[11px] text-zinc-500">Buat, unduh, dan pelihara cadangan database whatsapp_analyzer secara instan.</p>
            </div>
          </div>

          <button
            onClick={triggerBackup}
            disabled={isBackingUp}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-[0.98]"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Mengekspor Dump...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Backup Sekarang
              </>
            )}
          </button>
        </div>

        {/* Backups List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-850 text-zinc-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Nama File Backup</th>
                <th className="py-3 px-4">Waktu Pembuatan</th>
                <th className="py-3 px-4">Ukuran File</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-zinc-300">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-[#050505]/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">{b.id}</td>
                  <td className="py-3.5 px-4 text-zinc-450">
                    {new Date(b.timestamp).toLocaleString("id-ID")}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-450">{b.size}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-1.5 py-0.5 bg-[#050505] border border-zinc-800 rounded text-[10px] text-zinc-400">
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        addToast(`Mendownload ${b.id}...`, "success");
                        // Trigger file download simulation
                        const blob = new Blob(["-- PostgreSQL Dump File Simulation"], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = b.id;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="p-1 text-blue-450 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-sans">Unduh SQL</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Table Section */}
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        {/* Table header with filter controls */}
        <div className="p-4 border-b border-zinc-800 bg-[#050505]/40 flex flex-col md:flex-row justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Aktivitas Sistem & Audit Log</h3>
          </div>

          <div className="flex gap-2 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari event, IP, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#050505] text-zinc-200 text-[11px] pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40"
              />
            </div>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#050505] text-zinc-355 text-[11px] px-2.5 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40"
            >
              <option value="all">Semua Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="processing">In Progress</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-850 text-zinc-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Waktu Log</th>
                <th className="py-3 px-4">Peristiwa (Event)</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-zinc-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#050505]/40 transition-colors">
                  <td className="py-3 px-4 text-zinc-500">
                    {new Date(log.timestamp).toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-4 text-zinc-200 font-semibold">{log.event}</td>
                  <td className="py-3 px-4 text-zinc-400">{log.user}</td>
                  <td className="py-3 px-4 text-zinc-500">{log.ip}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      log.status === "Success" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      log.status === "Failed" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
