import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to avoid crashing on startup if the key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. AI features will fallback to offline mock analysis.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-memory data store for the live session
let auditLogs = [
  { id: 1, timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), event: "User login successful", user: "admin", ip: "192.168.1.50", status: "Success" },
  { id: 2, timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(), event: "WhatsApp QR generated", user: "admin", ip: "192.168.1.50", status: "Success" },
  { id: 3, timestamp: new Date(Date.now() - 3600000 * 2.4).toISOString(), event: "WhatsApp gateway connected (Baileys v4.4)", user: "system", ip: "localhost", status: "Success" },
  { id: 4, timestamp: new Date(Date.now() - 3600000 * 2.2).toISOString(), event: "Sync contact data started", user: "admin", ip: "192.168.1.50", status: "Success" },
  { id: 5, timestamp: new Date(Date.now() - 3600000 * 2.1).toISOString(), event: "Sync chat history completed (482 messages)", user: "system", ip: "localhost", status: "Success" },
];

let backups = [
  { id: "backup_20260701_120000.sql", timestamp: "2026-07-01T12:00:00Z", size: "14.2 MB", status: "Completed", type: "Automatic" },
  { id: "backup_20260630_120000.sql", timestamp: "2026-06-30T12:00:00Z", size: "13.9 MB", status: "Completed", type: "Automatic" }
];

let syncStatus = {
  chats: { count: 124, lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(), isSyncing: false },
  contacts: { count: 850, lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(), isSyncing: false },
  groups: { count: 32, lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(), isSyncing: false }
};

// Seed chat conversations for intelligence analysis
const mockChats = [
  {
    id: "g1",
    name: "Internal Operasional & Logistik",
    isGroup: true,
    unreadCount: 3,
    lastMessage: "Pak, truk muatan B-9831-UXX sudah berangkat menuju gudang Cikampek.",
    timestamp: "2026-07-01T20:15:00Z",
    messages: [
      { sender: "Syarif (Driver)", phone: "+62 812-3456-001", text: "Pak, truk muatan B-9831-UXX sudah berangkat menuju gudang Cikampek.", timestamp: "2026-07-01T20:15:00Z" },
      { sender: "Andi Logistik", phone: "+62 812-3456-002", text: "Siap, tolong pastikan surat jalan sudah ditandatangani oleh vendor.", timestamp: "2026-07-01T19:40:00Z" },
      { sender: "Syarif (Driver)", phone: "+62 812-3456-001", text: "Sudah lengkap semua Pak, manifest barang juga aman.", timestamp: "2026-07-01T19:35:00Z" },
      { sender: "Budi SPV", phone: "+62 812-3456-003", text: "Kabari kalau sudah lewat tol Karawang Barat ya.", timestamp: "2026-07-01T19:30:00Z" }
    ]
  },
  {
    id: "c1",
    name: "Hendra Wijaya (Investigasi Lapangan)",
    isGroup: false,
    unreadCount: 0,
    lastMessage: "Saya sudah amankan beberapa berkas bukti transaksi mencurigakan dari kantor cabang.",
    timestamp: "2026-07-01T18:45:00Z",
    messages: [
      { sender: "Hendra Wijaya", phone: "+62 811-9988-771", text: "Saya sudah amankan beberapa berkas bukti transaksi mencurigakan dari kantor cabang.", timestamp: "2026-07-01T18:45:00Z" },
      { sender: "You", phone: "+62 811-0000-111", text: "Bagus. Ada bukti transfer fisik?", timestamp: "2026-07-01T18:40:00Z" },
      { sender: "Hendra Wijaya", phone: "+62 811-9988-771", text: "Ada slip setoran tunai senilai Rp 450.000.000 tertanggal kemarin lusa. Tidak ada nama penyetor.", timestamp: "2026-07-01T18:38:00Z" },
      { sender: "Hendra Wijaya", phone: "+62 811-9988-771", text: "Saya curiga ini ada keterlibatan orang dalam finance.", timestamp: "2026-07-01T18:35:00Z" }
    ]
  },
  {
    id: "g2",
    name: "Group Koordinasi VIP Intel",
    isGroup: true,
    unreadCount: 0,
    lastMessage: "Rapat koordinasi keamanan cyber dijadwalkan besok pagi jam 09.00 WIB.",
    timestamp: "2026-07-01T15:20:00Z",
    messages: [
      { sender: "Kolonel Danu", phone: "+62 813-1122-334", text: "Rapat koordinasi keamanan cyber dijadwalkan besok pagi jam 09.00 WIB.", timestamp: "2026-07-01T15:20:00Z" },
      { sender: "Mayor Rian", phone: "+62 813-1122-335", text: "Siap, materi paparan ancaman ransomware nasional sudah siap.", timestamp: "2026-07-01T15:10:00Z" },
      { sender: "Letnan Ambar", phone: "+62 813-1122-336", text: "Izin melaporkan, indikasi kebocoran database di instansi X sudah kami mitigasi sementara.", timestamp: "2026-07-01T14:45:00Z" }
    ]
  },
  {
    id: "c2",
    name: "Rudi Setiawan (Marketing Vendor)",
    isGroup: false,
    unreadCount: 0,
    lastMessage: "Bagaimana kelanjutan pengadaan server Ollama offline kemarin Pak?",
    timestamp: "2026-07-01T11:30:00Z",
    messages: [
      { sender: "Rudi Setiawan", phone: "+62 856-7890-123", text: "Bagaimana kelanjutan pengadaan server Ollama offline kemarin Pak?", timestamp: "2026-07-01T11:30:00Z" },
      { sender: "You", phone: "+62 811-0000-111", text: "Masih menunggu persetujuan anggaran dari Direktur Keuangan. Spek server sudah sesuai RTD?", timestamp: "2026-07-01T11:15:00Z" },
      { sender: "Rudi Setiawan", phone: "+62 856-7890-123", text: "Sudah Pak, 2x RTX 4090 untuk akselerasi LLM Llama3 70B, RAM 128GB, Storage NVMe 2TB.", timestamp: "2026-07-01T11:10:00Z" }
    ]
  },
  {
    id: "c3",
    name: "Informan Anonim C-12",
    isGroup: false,
    unreadCount: 1,
    lastMessage: "Ada rencana aksi demo buruh di kawasan industri pulogadung besok jam 10 pagi.",
    timestamp: "2026-07-01T20:30:00Z",
    messages: [
      { sender: "Informan Anonim C-12", phone: "+62 899-8888-999", text: "Ada rencana aksi demo buruh di kawasan industri pulogadung besok jam 10 pagi.", timestamp: "2026-07-01T20:30:00Z" },
      { sender: "Informan Anonim C-12", phone: "+62 899-8888-999", text: "Massa diperkirakan sekitar 1.200 orang dari gabungan serikat pekerja.", timestamp: "2026-07-01T20:25:00Z" }
    ]
  }
];

// 1. GET /api/status - Returns system & container metrics
app.get("/api/status", (req, res) => {
  // Generate slightly dynamic server metrics
  const seconds = Math.floor(Date.now() / 1000);
  const cpuUsage = 15 + Math.floor(Math.sin(seconds / 10) * 8) + Math.floor(Math.random() * 3);
  const ramUsage = 64.5 + Math.sin(seconds / 20) * 1.5;
  const storageUsage = 42.1; // Fixed GB used

  res.json({
    metrics: {
      cpu: cpuUsage,
      ram: Math.min(Math.max(ramUsage, 0), 100),
      storage: storageUsage,
      ram_bytes: "10.3 GB / 16 GB",
      storage_bytes: "210.5 GB / 500 GB"
    },
    services: {
      postgresql: { status: "running", port: 5432, uptime: "12 days, 4 hours", dbSize: "182.4 MB" },
      redis: { status: "running", port: 6379, uptime: "12 days, 4 hours", memoryUsed: "4.2 MB" },
      baileys: { status: "connected", phone: "+62 821-4433-2211", device: "Linux - WhatsApp Web", delay: "45ms" },
      ollama: { status: "running", port: 11434, modelLoaded: "llama3:8b (running on CPU/GPU)", statusText: "Ready" },
      laravelQueue: { status: "running", activeWorkers: 2, pendingJobs: 0, failedJobs: 2 }
    }
  });
});

// 2. GET /api/chats - Returns chats database
app.get("/api/chats", (req, res) => {
  res.json({ chats: mockChats });
});

// 3. POST /api/sync - Trigger synchronization of WhatsApp data
app.post("/api/sync", (req, res) => {
  const { type } = req.body; // 'chats', 'contacts', 'groups'
  if (type === "chats" || type === "contacts" || type === "groups") {
    syncStatus[type].isSyncing = true;
    
    // Create audit log
    const timestamp = new Date().toISOString();
    auditLogs.unshift({
      id: auditLogs.length + 1,
      timestamp,
      event: `Manual synchronization initiated for ${type}`,
      user: "admin",
      ip: "192.168.1.50",
      status: "In Progress"
    });

    // Simulate completion after some seconds
    setTimeout(() => {
      syncStatus[type].isSyncing = false;
      syncStatus[type].lastSync = new Date().toISOString();
      if (type === "chats") syncStatus.chats.count += Math.floor(Math.random() * 10) + 5;
      if (type === "contacts") syncStatus.contacts.count += Math.floor(Math.random() * 20);
      if (type === "groups") syncStatus.groups.count += Math.floor(Math.random() * 2);

      // Log success
      auditLogs.unshift({
        id: auditLogs.length + 1,
        timestamp: new Date().toISOString(),
        event: `Sync ${type} completed successfully`,
        user: "system",
        ip: "localhost",
        status: "Success"
      });
    }, 4000);

    res.json({ success: true, message: `Syncing ${type} in background...` });
  } else {
    res.status(400).json({ error: "Invalid sync type" });
  }
});

// 4. GET /api/audit-logs - Fetch logs
app.get("/api/audit-logs", (req, res) => {
  res.json({ logs: auditLogs });
});

// 5. POST /api/backup - Simulate trigger db backup
app.post("/api/backup", (req, res) => {
  const timestamp = new Date().toISOString();
  const formatTime = timestamp.replace(/[-:T.]/g, "").slice(0, 14);
  const backupId = `backup_${formatTime}.sql`;

  // Simulate backup process
  const newBackup = {
    id: backupId,
    timestamp,
    size: `${(14.2 + Math.random() * 0.5).toFixed(1)} MB`,
    status: "Completed",
    type: "Manual"
  };

  backups.unshift(newBackup);

  auditLogs.unshift({
    id: auditLogs.length + 1,
    timestamp,
    event: `Manual Database Backup completed (${backupId})`,
    user: "admin",
    ip: "192.168.1.50",
    status: "Success"
  });

  res.json({ success: true, backup: newBackup });
});

// 6. GET /api/backups - Fetch backups list
app.get("/api/backups", (req, res) => {
  res.json({ backups });
});

// 7. POST /api/analyze - Intensive Intelligence Chat Analysis using Gemini API or Offline simulation
app.post("/api/analyze", async (req, res) => {
  const { chatId, messages, analysisType, aiEngine } = req.body;
  
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided for analysis." });
  }

  // Create audit log for analysis starting
  auditLogs.unshift({
    id: auditLogs.length + 1,
    timestamp: new Date().toISOString(),
    event: `AI intelligence analysis initiated on ${chatId} (${aiEngine} - ${analysisType})`,
    user: "admin",
    ip: "192.168.1.50",
    status: "Processing"
  });

  const chatContext = messages.map((m: any) => `[${m.timestamp}] ${m.sender} (${m.phone || 'N/A'}): ${m.text}`).join("\n");

  const systemInstruction = `You are the core AI of the ENTERPRISE INTELLIGENCE WHATSAPP ANALYZER.
Your job is to analyze intercept/chat sync logs and generate a structured intelligence report in clean, professional Indonesian.
You MUST analyze the conversations carefully and produce a comprehensive, structured response formatted as JSON with the following schema:
{
  "summary": "Ringkasan analisis intelijen singkat",
  "sentiment": "Positif/Negatif/Netral/Sangat Sensitif",
  "threatLevel": "Rendah/Sedang/Tinggi/Kritis",
  "keyTopics": ["Topik 1", "Topik 2"],
  "insights": ["Analisis mendalam 1", "Analisis mendalam 2"],
  "recommendations": ["Rekomendasi taktis/operasional 1", "Rekomendasi taktis 2"],
  "flaggedMessages": [{"text": "Pesan mencurigakan", "reason": "Alasan dicurigai"}]
}
Make your intelligence report highly realistic, formal, tactical, and helpful for local operations or intelligence monitoring. Keep the language Indonesian.`;

  const prompt = `Analisis riwayat percakapan berikut untuk tipe analisis "${analysisType}":
Percakapan:
${chatContext}

Tolong berikan laporan analitis terstruktur lengkap dalam format JSON yang ditentukan.`;

  try {
    const isMock = !process.env.GEMINI_API_KEY;
    
    if (!isMock) {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      if (responseText) {
        try {
          const parsedResult = JSON.parse(responseText.trim());
          
          // Complete audit log
          auditLogs.unshift({
            id: auditLogs.length + 1,
            timestamp: new Date().toISOString(),
            event: `AI intelligence analysis completed for ${chatId}`,
            user: "system",
            ip: "localhost",
            status: "Success"
          });

          return res.json({ result: parsedResult });
        } catch (parseErr) {
          console.error("Failed to parse JSON from Gemini response. Raw text:", responseText);
          throw new Error("Invalid JSON structure in AI output");
        }
      } else {
        throw new Error("Empty response from AI model");
      }
    } else {
      // Fallback to beautiful mock analysis representing local Ollama outputs
      console.log("Running offline mock simulation for Gemini...");
      setTimeout(() => {
        let mockResult = {
          summary: "Analisis lokal mendeteksi koordinasi logistik operasional dan potensi pemantauan aset strategis atau bukti transaksi keuangan.",
          sentiment: "Sangat Sensitif",
          threatLevel: "Sedang",
          keyTopics: ["Logistik Cikampek", "Pemeriksaan Transaksi", "Keamanan Aset"],
          insights: [
            "Pesan menunjukkan koordinasi logistik yang aktif dan formal dengan pelacakan posisi rute Karawang-Cikampek.",
            "Terdapat pengamanan dokumen slip setoran senilai Rp 450 Juta tanpa nama penyetor, mengindikasikan aktivitas finansial luar biasa (Laporan Transaksi Keuangan Mencurigakan)."
          ],
          recommendations: [
            "Lakukan audit internal forensik terhadap sistem pembukuan keuangan divisi Finance.",
            "Lakukan pengawasan ketat terhadap pergerakan armada kontainer di rute tol Cikampek.",
            "Simpan salinan fisik slip setoran tunai tersebut di brankas berkeamanan tinggi."
          ],
          flaggedMessages: [
            { text: "Ada slip setoran tunai senilai Rp 450.000.000 tertanggal kemarin lusa. Tidak ada nama penyetor.", reason: "Indikasi transaksi keuangan misterius / pencucian uang / gratifikasi." }
          ]
        };

        if (chatId === "c3") {
          mockResult = {
            summary: "Terdeteksi informasi intelijen penting mengenai aksi demonstrasi buruh berskala besar di kawasan industri strategis.",
            sentiment: "Negatif",
            threatLevel: "Tinggi",
            keyTopics: ["Demonstrasi Buruh", "Pulogadung", "Ketertiban Umum"],
            insights: [
              "Estimasi massa mencapai 1.200 personel dari gabungan serikat pekerja.",
              "Aksi dijadwalkan besok jam 10 pagi, menimbulkan potensi kemacetan total dan gangguan operasional pabrik."
            ],
            recommendations: [
              "Koordinasikan pengamanan perimeter luar dengan Polsek/Polres Pulogadung.",
              "Amankan jalur evakuasi VIP dan lakukan mitigasi lockdown parsial kawasan industri.",
              "Alihkan rute logistik masuk dan keluar dari kawasan Pulogadung sebelum jam 09.00 WIB."
            ],
            flaggedMessages: [
              { text: "Ada rencana aksi demo buruh di kawasan industri pulogadung besok jam 10 pagi.", reason: "Informasi ancaman keamanan fisik dan gangguan ketertiban objek vital nasional." }
            ]
          };
        }

        // Complete audit log
        auditLogs.unshift({
          id: auditLogs.length + 1,
          timestamp: new Date().toISOString(),
          event: `AI offline mock analysis completed for ${chatId}`,
          user: "system",
          ip: "localhost",
          status: "Success"
        });

        return res.json({ result: mockResult });
      }, 1500);
    }
  } catch (err: any) {
    console.error("AI Analysis error:", err);
    
    // Log failure
    auditLogs.unshift({
      id: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      event: `AI intelligence analysis FAILED: ${err.message}`,
      user: "system",
      ip: "localhost",
      status: "Failed"
    });

    res.status(500).json({ error: "AI Analysis failed.", message: err.message });
  }
});

// Serve Vite client app
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    // Listen for requests
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running in development mode on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in production mode on port ${PORT}`);
  });
}
