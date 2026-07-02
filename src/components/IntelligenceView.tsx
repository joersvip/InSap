import React, { useState } from "react";
import { Shield, Radio, MessageSquare, AlertTriangle, Cpu, CheckCircle2, Download, RefreshCw, FileText } from "lucide-react";
import { Chat, AIAnalysisResult } from "../types";

interface IntelligenceViewProps {
  chats: Chat[];
  addToast: (msg: string, type: "success" | "info" | "warning") => void;
}

export default function IntelligenceView({ chats, addToast }: IntelligenceViewProps) {
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || "");
  const [analysisType, setAnalysisType] = useState<string>("Security Threat & Espionage Detection");
  const [aiEngine, setAiEngine] = useState<string>("ollama"); // 'ollama' or 'openai'
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  const selectedChat = chats.find(c => c.id === selectedChatId) || chats[0];

  const triggerAIAnalysis = async () => {
    if (!selectedChat) {
      addToast("Tidak ada chat yang dapat dianalisis.", "warning");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    addToast("Memulai pemrosesan AI pada log percakapan...", "info");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedChat.id,
          messages: selectedChat.messages,
          analysisType: analysisType,
          aiEngine: aiEngine
        })
      });

      const data = await response.json();
      if (data.result) {
        setAnalysisResult(data.result);
        addToast("Analisis intelijen AI selesai!", "success");
      } else {
        throw new Error(data.error || "Gagal mengambil hasil.");
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal: ${err.message || "Koneksi terputus."}`, "warning");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fully functional Client-Side Export Report
  const exportReportAsCSV = () => {
    if (!analysisResult) return;
    
    let content = `LAPORAN INTELIJEN WHATSAPP - ${selectedChat.name}\n`;
    content += `Tanggal Analisis: ${new Date().toISOString()}\n`;
    content += `Tingkat Ancaman: ${analysisResult.threatLevel}\n`;
    content += `Sentimen: ${analysisResult.sentiment}\n\n`;
    content += `RINGKASAN:\n${analysisResult.summary}\n\n`;
    content += `TOPIK UTAMA:\n${analysisResult.keyTopics.join(", ")}\n\n`;
    content += `INSIGHTS & ANOMALI:\n${analysisResult.insights.map((i, idx) => `${idx+1}. ${i}`).join("\n")}\n\n`;
    content += `REKOMENDASI TAKTIS:\n${analysisResult.recommendations.map((r, idx) => `${idx+1}. ${r}`).join("\n")}\n\n`;
    content += `PESAN YANG DITANDAI:\n`;
    analysisResult.flaggedMessages.forEach(m => {
      content += `- Pesan: "${m.text}" | Alasan: ${m.reason}\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Intelijen_${selectedChat.name.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Laporan intelijen berhasil diunduh!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">AI Intelligence Chat Analyzer</h2>
        <p className="text-zinc-400 text-xs">Jalankan model bahasa offline (Ollama) untuk melakukan profiling perilaku, deteksi kebocoran data, dan klasifikasi ancaman keamanan.</p>
      </div>

      {/* Control Configuration Grid */}
      <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2">Konfigurasi Mesin Analitik</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
          {/* Select Chat */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pilih Target Chat / Grup</label>
            <select
              value={selectedChatId}
              onChange={(e) => setSelectedChatId(e.target.value)}
              className="w-full bg-[#050505] text-zinc-355 text-xs px-3 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40"
            >
              {chats.map(c => (
                <option key={c.id} value={c.id}>
                  {c.isGroup ? "👥 [Grup] " : "👤 [Kontak] "} {c.name} ({c.messages.length} msg)
                </option>
              ))}
            </select>
          </div>

          {/* Select Template Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kategori Analisis Intelijen</label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full bg-[#050505] text-zinc-355 text-xs px-3 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40"
            >
              <option>Security Threat & Espionage Detection</option>
              <option>Financial Anomaly & Bribery Audit</option>
              <option>Sentiment, Emotion & Psychological Profiling</option>
              <option>Key Information Summarization & Chronology</option>
            </select>
          </div>

          {/* Select AI Engine */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mesin AI Pemroses</label>
            <select
              value={aiEngine}
              onChange={(e) => setAiEngine(e.target.value)}
              className="w-full bg-[#050505] text-zinc-355 text-xs px-3 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500/40"
            >
              <option value="ollama">Ollama: Llama3 8B (Lokal Offline)</option>
              <option value="openai">OpenAI API (Cloud Hybrid - Opsional)</option>
            </select>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-3 flex justify-end">
          <button
            onClick={triggerAIAnalysis}
            disabled={isAnalyzing}
            className={`px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-[0.98] ${
              isAnalyzing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Menganalisis Percakapan...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-blue-300" />
                Mulai Analisis Intelijen
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loader */}
      {isAnalyzing && (
        <div className="bg-[#0a0a0a] border border-zinc-800 p-8 rounded-xl flex flex-col items-center justify-center text-center space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
          <div className="relative">
            {/* Radar Animation */}
            <div className="w-16 h-16 rounded-full border border-blue-500/30 flex items-center justify-center animate-ping"></div>
            <Cpu className="w-8 h-8 text-blue-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-200">Mengekstrak Obrolan & Memproses LLM lokal</h4>
            <p className="text-xs text-zinc-500 font-mono mt-1">Mengkueri Ollama Llama3 @ http://localhost:11434...</p>
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Quick Stats Header */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-[#050505] p-4 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono font-semibold">Hasil Analisis Terenkripsi</span>
                <h4 className="text-sm font-bold text-zinc-100">{selectedChat.name}</h4>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={exportReportAsCSV}
                  className="px-3 py-1.5 bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono rounded flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  Unduh Laporan (.TXT)
                </button>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800 text-center bg-[#050505]/40">
              <div className="p-4">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-semibold">Tingkat Ancaman Keamanan</p>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold font-mono rounded ${
                  analysisResult.threatLevel === "Kritis" ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.2)]" :
                  analysisResult.threatLevel === "Tinggi" ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)]" :
                  analysisResult.threatLevel === "Sedang" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" :
                  "bg-green-500/15 text-green-400 border border-green-500/30"
                }`}>
                  🚨 {analysisResult.threatLevel}
                </span>
              </div>

              <div className="p-4">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-semibold">Klasifikasi Emosi / Sentimen</p>
                <span className="inline-block mt-2 px-3 py-1 bg-[#050505] border border-zinc-800 text-zinc-300 text-xs font-semibold font-mono rounded">
                  {analysisResult.sentiment}
                </span>
              </div>

              <div className="p-4">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-semibold">Jumlah Pesan Bendera</p>
                <span className="inline-block mt-2 px-3 py-1 bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono rounded">
                  {analysisResult.flaggedMessages.length} Pesan Ditandai
                </span>
              </div>
            </div>
          </div>

          {/* Detailed report breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Summary & Topics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-3 shadow-lg">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/80 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Ringkasan Intelijen Lapangan
                </h4>
                <p className="text-xs text-zinc-350 leading-relaxed font-sans">{analysisResult.summary}</p>

                <div className="pt-2">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 font-semibold">Entitas & Topik Kunci Terdeteksi</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.keyTopics.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#050505] border border-zinc-800 text-zinc-400 text-[10px] font-mono rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Insights Column */}
              <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-4 shadow-lg">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/80 pb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Analisis Pola Perilaku & Anomali
                </h4>
                <div className="space-y-3">
                  {analysisResult.insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 text-xs leading-relaxed text-zinc-300 items-start">
                      <span className="text-blue-400 mt-0.5">▪</span>
                      <p>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Tactical Recommendations */}
            <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-xl space-y-4 shadow-lg">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/80 pb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                Rekomendasi Tindakan Operasional
              </h4>
              <div className="space-y-4 font-sans">
                {analysisResult.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-[#050505]/40 border border-zinc-800/60 rounded-lg">
                    <span className="bg-blue-500/10 text-blue-400 p-1.5 rounded-md border border-blue-500/25 text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-zinc-300 leading-normal">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Flagged Messages Subtable */}
          {analysisResult.flaggedMessages.length > 0 && (
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-[#050505]/40 p-4 border-b border-zinc-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Pesan Yang Terkena Sensor / Flagged</h4>
              </div>

              <div className="divide-y divide-zinc-800/40 bg-[#050505]/20 font-mono">
                {analysisResult.flaggedMessages.map((msg, idx) => (
                  <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2 space-y-1">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-semibold">Kutipan Percakapan</span>
                      <p className="text-zinc-200 bg-[#0a0a0a]/65 p-2.5 rounded border border-zinc-800 italic">
                        "{msg.text}"
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider font-semibold">Analisis Resiko</span>
                      <p className="text-rose-300 bg-rose-950/10 p-2.5 rounded border border-rose-900/20 leading-relaxed">
                        {msg.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
