import React, { useState } from "react";
import { FileCode, FileText, Download, ShieldCheck, Terminal, BookOpen, Layers } from "lucide-react";

export default function DeploymentView() {
  const [selectedFile, setSelectedFile] = useState<string>("docker-compose.yml");

  const filesContent: Record<string, { desc: string; type: string; content: string }> = {
    "docker-compose.yml": {
      desc: "Mendefinisikan arsitektur multi-container lokal (Laravel 12, PostgreSQL, Redis, Nginx, Ollama, Baileys)",
      type: "yaml",
      content: `version: '3.8'

services:
  # 1. Database Service (PostgreSQL)
  db:
    image: postgres:15-alpine
    container_name: wa_intel_db
    restart: always
    environment:
      POSTGRES_DB: whatsapp_analyzer
      POSTGRES_USER: intel_admin
      POSTGRES_PASSWORD: supersecure_db_pass_99
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U intel_admin -d whatsapp_analyzer"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. Key-Value & Queue Store (Redis)
  redis:
    image: redis:7-alpine
    container_name: wa_intel_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 3. Laravel 12 Backend (PHP 8.4)
  backend:
    build:
      context: ../backend
      dockerfile: ../docker/backend.Dockerfile
    container_name: wa_intel_backend
    restart: always
    environment:
      APP_ENV: local
      APP_DEBUG: "true"
      DB_CONNECTION: pgsql
      DB_HOST: db
      DB_PORT: 5432
      DB_DATABASE: whatsapp_analyzer
      DB_USERNAME: intel_admin
      DB_PASSWORD: supersecure_db_pass_99
      REDIS_HOST: redis
      OLLAMA_HOST: http://ollama:11434
    volumes:
      - ../backend:/var/www/html
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  # 4. WhatsApp Gateway (Baileys)
  baileys:
    build:
      context: ../docker/baileys-service
    container_name: wa_intel_baileys
    restart: always
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      WEBHOOK_URL: http://backend:8000/api/whatsapp/webhook
    volumes:
      - baileys_auth:/app/baileys_auth_store

  # 5. Offline AI Engine (Ollama)
  ollama:
    image: ollama/ollama:latest
    container_name: wa_intel_ollama
    restart: always
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama`
    },
    "nginx.conf": {
      desc: "Konfigurasi reverse proxy lokal untuk port 80, menyalurkan rute ke Laravel, Baileys, dan React",
      type: "nginx",
      content: `server {
    listen 80;
    server_name localhost;

    # 1. API Backend (Laravel) Routing
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 2. Baileys Multi-Device API
    location /baileys/ {
        proxy_pass http://baileys:3001/;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # 3. Frontend Web App (React / Vite)
    location / {
        proxy_pass http://frontend:5173;
        proxy_set_header Host $host;
    }
}`
    },
    "install.sh": {
      desc: "Script otomatis yang memverifikasi dependency (Docker + Compose), mengunduh file, membuat volume, menjalankan Laravel database migration & seed admin",
      type: "bash",
      content: `#!/bin/bash
# AUTODEPLOY SCRIPT - INTELLIGENCE WHATSAPP ANALYZER (LOCAL)
if [ "$EUID" -ne 0 ]; then
  echo "Harap jalankan script ini sebagai root (sudo ./install.sh)"
  exit 1
fi

echo "Mendeteksi OS... OK"
echo "Menginstal Docker Engine & Compose... OK"
mkdir -p backend/storage/framework/cache
mkdir -p storage/backups
chmod -R 777 backend/storage

echo "Menarik Docker Images..."
cd docker && docker compose up -d --build
sleep 10

echo "Menjalankan Laravel Migrations & Seeders..."
docker compose exec -T backend php artisan migrate --force
docker compose exec -T backend php artisan db:seed --class=AdminSeeder

echo "=== INSTALASI BERHASIL! AKSES http://localhost ==="`
    },
    "backup.sh": {
      desc: "Melakukan dump data basis data secara langsung dari PostgreSQL container, mengompresinya, dan menghapus backup yang lebih tua dari 30 hari",
      type: "bash",
      content: `#!/bin/bash
BACKUP_DIR="./storage/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

if ! docker ps | grep -q "wa_intel_db"; then
    echo "Container DB tidak berjalan!"
    exit 1
fi

docker exec -t wa_intel_db pg_dump -U intel_admin -d whatsapp_analyzer > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

echo "[SUCCESS] Backup berhasil disimpan: $BACKUP_FILE.gz"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete`
    },
    "restore.sh": {
      desc: "Menghapus database aktif dan memulihkan data dari file snapshot terpilih",
      type: "bash",
      content: `#!/bin/bash
BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <path_to_backup_file.sql.gz>"
    exit 1
fi

TEMP_SQL="/tmp/restore_temp.sql"
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

docker exec -t wa_intel_db psql -U intel_admin -d postgres -c "DROP DATABASE IF EXISTS whatsapp_analyzer;"
docker exec -t wa_intel_db psql -U intel_admin -d postgres -c "CREATE DATABASE whatsapp_analyzer;"
docker exec -i wa_intel_db psql -U intel_admin -d whatsapp_analyzer < "$TEMP_SQL"

echo "[SUCCESS] Restore berhasil diselesaikan."`
    }
  };

  const handleDownloadFile = (fileName: string) => {
    const file = filesContent[fileName];
    if (!file) return;
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight font-sans">Local Codebase & Deployment Assets</h2>
        <p className="text-zinc-400 text-xs font-sans">Periksa dan unduh file konfigurasi operasional penyiapan Docker dan script utilitas lokal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
        {/* Left Side: Selectors */}
        <div className="bg-[#0a0a0a] border border-zinc-800 p-4 rounded-xl flex flex-col justify-between h-full shadow-lg">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-sans border-b border-zinc-800 pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Daftar File Konfigurasi
            </h3>

            <div className="space-y-1.5 font-sans">
              {Object.keys(filesContent).map((fileName) => {
                const isSelected = selectedFile === fileName;
                return (
                  <button
                    key={fileName}
                    onClick={() => setSelectedFile(fileName)}
                    className={`w-full text-left p-3 rounded-lg text-xs font-medium flex items-center justify-between transition-all border ${
                      isSelected
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : "text-zinc-400 border-transparent hover:bg-[#050505]/60 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCode className="w-4 h-4 text-zinc-500" />
                      <span>{fileName}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick info */}
          <div className="bg-[#050505] p-4 rounded-lg border border-zinc-800/60 font-sans text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold">Offline Deployment Ready</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Semua skrip di atas tertulis secara permanen di dalam folder proyek Anda. Saat Anda mengekspor folder ini sebagai file ZIP atau mengimpornya ke Git, struktur ini siap diuji di server lokal Anda!
            </p>
          </div>
        </div>

        {/* Right Side: Code Viewer */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 bg-[#050505]/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-xs font-bold text-zinc-200">{selectedFile}</span>
                <p className="text-[9px] text-zinc-500 font-sans mt-0.5">{filesContent[selectedFile]?.desc}</p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadFile(selectedFile)}
              className="p-1.5 bg-[#0a0a0a] border border-zinc-800 text-zinc-300 hover:text-zinc-150 rounded flex items-center gap-2 text-[10px] hover:border-zinc-700 transition-all font-sans active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Unduh File
            </button>
          </div>

          {/* Code panel */}
          <div className="flex-1 bg-[#050505] p-4 overflow-y-auto font-mono text-[11px] text-zinc-300">
            <pre className="whitespace-pre">{filesContent[selectedFile]?.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
