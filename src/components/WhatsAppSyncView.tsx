import React, { useState } from "react";
import { Users, MessageSquare, Smartphone, Radio, Search, Shield, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { Chat } from "../types";

interface WhatsAppSyncViewProps {
  chats: Chat[];
  isSyncing: boolean;
  onSync: (type: "chats" | "contacts" | "groups") => void;
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
  addToast: (msg: string, type: "success" | "info" | "warning") => void;
}

export default function WhatsAppSyncView({
  chats,
  isSyncing,
  onSync,
  onSelectChat,
  selectedChatId,
  addToast
}: WhatsAppSyncViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"chats" | "contacts" | "groups">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [qrStatus, setQrStatus] = useState<"unlinked" | "scanning" | "connected">("connected");
  
  // Custom message sender state
  const [customMsg, setCustomMsg] = useState("");

  const handleSimulateScan = () => {
    setQrStatus("scanning");
    addToast("Menghubungkan ke Baileys daemon...", "info");
    setTimeout(() => {
      setQrStatus("connected");
      addToast("WhatsApp Berhasil Tertaut via Baileys Multi-Device!", "success");
    }, 2500);
  };

  const handleSimulateUnlink = () => {
    setQrStatus("unlinked");
    addToast("WhatsApp terputus dari daemon.", "warning");
  };

  const selectedChat = chats.find(c => c.id === selectedChatId) || chats[0];

  const filteredChats = chats.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeSubTab === "groups") return matchesSearch && c.isGroup;
    if (activeSubTab === "contacts") return matchesSearch && !c.isGroup;
    return matchesSearch; // "chats" tab shows all
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Baileys WhatsApp Interceptor</h2>
        <p className="text-zinc-400 text-xs">Sinkronisasi pesan, kontak, dan grup obrolan secara lokal menggunakan modul multi-device daemon.</p>
      </div>

      {/* Connection & QR Simulator card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Section */}
        <div className="md:col-span-1 bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Device Auth QR Code</h4>
            <p className="text-[11px] text-zinc-500">Scan QR Code menggunakan menu WhatsApp Perangkat Tertaut untuk mulai merekam aktivitas.</p>
          </div>

          <div className="my-4 flex justify-center items-center">
            {qrStatus === "unlinked" && (
              <div className="relative bg-[#050505] p-4 rounded-lg border border-zinc-800 flex flex-col items-center gap-3">
                {/* SVG Mock QR Code */}
                <svg className="w-40 h-40 text-zinc-400" viewBox="0 0 100 100">
                  <path d="M5,5 h30 v30 h-30 z M15,15 h10 v10 h-10 z" fill="currentColor" />
                  <path d="M65,5 h30 v30 h-30 z M75,15 h10 v10 h-10 z" fill="currentColor" />
                  <path d="M5,65 h30 v30 h-30 z M15,75 h10 v10 h-10 z" fill="currentColor" />
                  <circle cx="50" cy="50" r="4" fill="currentColor" />
                  <rect x="40" y="20" width="10" height="10" fill="currentColor" />
                  <rect x="55" y="45" width="20" height="5" fill="currentColor" />
                  <rect x="45" y="60" width="10" height="15" fill="currentColor" />
                  <rect x="65" y="65" width="20" height="20" fill="currentColor" />
                </svg>
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
                  <p className="text-[10px] font-semibold text-zinc-350">Device Belum Terkoneksi</p>
                  <button
                    onClick={handleSimulateScan}
                    className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-md"
                  >
                    Minta Kode QR
                  </button>
                </div>
              </div>
            )}

            {qrStatus === "scanning" && (
              <div className="w-40 h-40 bg-[#050505] border border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-2 p-3 text-center">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-[10px] text-zinc-400 font-mono">Menghubungkan...</p>
              </div>
            )}

            {qrStatus === "connected" && (
              <div className="bg-[#050505]/60 p-5 rounded-lg border border-blue-500/20 text-center flex flex-col items-center gap-3 w-full">
                <div className="bg-blue-500/10 p-3 rounded-full border border-blue-500/30 text-blue-400 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-200">Device Connected</p>
                  <p className="text-[10px] text-blue-400 font-mono mt-0.5">+62 821-4433-2211</p>
                </div>
                <button
                  onClick={handleSimulateUnlink}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-950/30 text-zinc-400 hover:text-rose-400 text-[9px] font-mono border border-zinc-800 rounded transition-all"
                >
                  Unlink Device
                </button>
              </div>
            )}
          </div>

          <div className="text-[10px] text-zinc-500 text-center font-mono">
            IP LOCAL: 192.168.1.100 (Host)
          </div>
        </div>

        {/* Sync Controls & Information */}
        <div className="md:col-span-2 bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Smartphone className="w-5 h-5" />
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Metode Sinkronisasi Multi-Device</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Modul Baileys Multi-Device akan menyamar sebagai instansi WhatsApp Web yang berjalan di dalam kontainer Docker. 
              Semua chat lama maupun baru akan diduplikasi secara real-time ke database PostgreSQL lokal server. Anda tidak memerlukan 
              akses internet aktif dari server ini untuk membaca pesan yang sudah disinkronkan.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => onSync("chats")}
                disabled={isSyncing}
                className="p-3 bg-[#050505] border border-zinc-800/80 hover:border-blue-500/40 rounded-xl flex flex-col items-center text-center gap-2 group transition-all"
              >
                <MessageSquare className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-semibold text-zinc-300">Sync Chat</span>
              </button>

              <button
                onClick={() => onSync("contacts")}
                disabled={isSyncing}
                className="p-3 bg-[#050505] border border-zinc-800/80 hover:border-blue-500/40 rounded-xl flex flex-col items-center text-center gap-2 group transition-all"
              >
                <Users className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-semibold text-zinc-300">Sync Kontak</span>
              </button>

              <button
                onClick={() => onSync("groups")}
                disabled={isSyncing}
                className="p-3 bg-[#050505] border border-zinc-800/80 hover:border-blue-500/40 rounded-xl flex flex-col items-center text-center gap-2 group transition-all"
              >
                <Radio className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-semibold text-zinc-300">Sync Grup</span>
              </button>
            </div>
          </div>

          <div className="bg-[#050505]/40 border border-zinc-800 p-3.5 rounded-lg mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 animate-pulse"></span>
              </span>
              <span className="text-zinc-350 font-medium">WhatsApp Daemon Service Status:</span>
              <span className="text-blue-400 font-mono font-bold text-[10px] uppercase">Active</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Delay: ~45ms</span>
          </div>
        </div>
      </div>

      {/* Chat Synchronized explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Left Side: Chat Selectors list */}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl flex flex-col overflow-hidden h-full shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          {/* Subtabs & Search */}
          <div className="p-4 border-b border-zinc-800 space-y-3">
            <div className="flex bg-[#050505] p-1 rounded-lg border border-zinc-800/60">
              {["chats", "contacts", "groups"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab as any)}
                  className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    activeSubTab === tab
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari chat, pesan atau kontak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] text-zinc-200 text-xs pl-9 pr-4 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40"
              />
            </div>
          </div>

          {/* List scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
            {filteredChats.map((c) => {
              const isSelected = selectedChatId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  className={`w-full p-4 flex items-start gap-3 transition-colors text-left ${
                    isSelected ? "bg-zinc-800/40" : "hover:bg-zinc-800/15"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border ${c.isGroup ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                    {c.isGroup ? <Radio className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h5 className="text-xs font-bold text-zinc-200 truncate">{c.name}</h5>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-1">{c.lastMessage}</p>
                    {c.unreadCount > 0 && (
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-blue-500 text-[#050505] text-[9px] font-bold font-mono rounded-full leading-none shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                        {c.unreadCount} baru
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active message history */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-zinc-800 rounded-xl flex flex-col overflow-hidden h-full shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          {selectedChat ? (
            <>
              {/* Active chat header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#050505]/20">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedChat.isGroup ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {selectedChat.isGroup ? <Radio className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{selectedChat.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {selectedChat.isGroup ? "Grup Terenkripsi Baileys" : "Kontak Privat"}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-[9px] font-mono uppercase font-bold">
                  TERINKORPORASI DB
                </span>
              </div>

              {/* Chat log scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505]/30">
                {selectedChat.messages.map((msg, idx) => (
                  <div key={idx} className="flex flex-col max-w-[85%] bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 space-y-1 shadow-sm">
                    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-800/40 pb-1 mb-1.5">
                      <span className="text-[10px] font-bold text-zinc-300">{msg.sender}</span>
                      <span className="text-[8px] text-zinc-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed font-sans">{msg.text}</p>
                    <span className="text-[8px] text-zinc-500 font-mono self-end pt-1">{msg.phone}</span>
                  </div>
                ))}
              </div>

              {/* Message composer simulation */}
              <div className="p-3 border-t border-zinc-800 bg-[#050505]/20 flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik balasan untuk mengirim pesan via WhatsApp Gateway..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="flex-1 bg-[#050505] text-zinc-200 text-xs px-3 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customMsg.trim()) {
                      addToast(`Pesan berhasil dikirim ke ${selectedChat.name}!`, "success");
                      setCustomMsg("");
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (customMsg.trim()) {
                      addToast(`Pesan berhasil dikirim ke ${selectedChat.name}!`, "success");
                      setCustomMsg("");
                    }
                  }}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <MessageSquare className="w-12 h-12 text-zinc-700 mb-2" />
              <p className="text-xs">Silakan pilih obrolan di sebelah kiri untuk melihat pesan sinkronisasi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
