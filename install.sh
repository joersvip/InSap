#!/bin/bash

# ==============================================================================
# ENTERPRISE INTELLIGENCE WHATSAPP ANALYZER - AUTOMATED INSTALLER
# Supported OS: Kali Linux, Ubuntu Server, Debian
# Fully Local & Offline Ready
# ==============================================================================

# ANSI Color Codes for terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================================${NC}"
echo -e "${GREEN}      INTELLIGENCE WHATSAPP ANALYZER - AUTOMATED INSTALLER v1.0${NC}"
echo -e "${BLUE}========================================================================${NC}"
echo -e "Target OS: Kali Linux / Ubuntu Server / Debian"
echo -e "Environment: Fully Offline / Local Network (localhost & Local IP)"
echo ""

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Harap jalankan script ini sebagai root (sudo ./install.sh)${NC}"
  exit 1
fi

# 2. Detect OS
OS_TYPE=""
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_TYPE=$ID
fi

echo -e "${YELLOW}[1/7] Mendeteksi Sistem Operasi...${NC}"
echo -e "Sistem terdeteksi: ${GREEN}$OS_TYPE${NC}"

if [[ "$OS_TYPE" != "ubuntu" && "$OS_TYPE" != "debian" && "$OS_TYPE" != "kali" ]]; then
    echo -e "${YELLOW}[WARNING] OS $OS_TYPE tidak diuji secara penuh, namun instalasi akan tetap dicoba.${NC}"
fi

# 3. Check and Install Docker
echo -e "${YELLOW}[2/7] Memeriksa Docker Engine...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}[INFO] Docker tidak ditemukan. Memulai proses instalasi Docker...${NC}"
    apt-get update -y
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker GPG Key and Repo based on OS
    mkdir -p /etc/apt/keyrings
    if [[ "$OS_TYPE" == "kali" ]]; then
        # Kali is Debian-based
        curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    else
        curl -fsSL https://download.docker.com/linux/$OS_TYPE/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS_TYPE $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    fi
    
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}[SUCCESS] Docker Engine berhasil diinstal.${NC}"
else
    echo -e "${GREEN}[SUCCESS] Docker Engine sudah terpasang.${NC}"
fi

# 4. Check and Install Docker Compose
echo -e "${YELLOW}[3/7] Memeriksa Docker Compose...${NC}"
if ! docker compose version &> /dev/null; then
    echo -e "${BLUE}[INFO] Docker Compose v2 tidak ditemukan. Menginstal docker-compose-plugin...${NC}"
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}[SUCCESS] Docker Compose Plugin berhasil diinstal.${NC}"
else
    echo -e "${GREEN}[SUCCESS] Docker Compose sudah terpasang.${NC}"
fi

# 5. Create Local Project Directories & Assets
echo -e "${YELLOW}[4/7] Membuat struktur folder operasional...${NC}"
mkdir -p backend/storage/framework/cache
mkdir -p backend/storage/framework/sessions
mkdir -p backend/storage/framework/views
mkdir -p backend/storage/logs
mkdir -p database/backups
mkdir -p storage/backups
mkdir -p docs

# Set correct permissions
chmod -R 777 backend/storage
chmod -R 777 storage/backups

# 6. Generate Environment Configuration Files (.env)
echo -e "${YELLOW}[5/7] Mengonfigurasi variabel lingkungan (.env)...${NC}"
if [ ! -f backend/.env ]; then
  cat <<EOT > backend/.env
APP_NAME="INTELLIGENCE WHATSAPP ANALYZER"
APP_ENV=local
APP_KEY=base64:$(openssl rand -base64 32)
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=whatsapp_analyzer
DB_USERNAME=intel_admin
DB_PASSWORD=supersecure_db_pass_99

BROADCAST_DRIVER=log
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

OLLAMA_HOST=http://ollama:11434
BAILEYS_SERVICE_URL=http://baileys:3001
EOT
  echo -e "${GREEN}[SUCCESS] File konfigurasi backend/.env berhasil dibuat.${NC}"
else
  echo -e "${BLUE}[INFO] File backend/.env sudah ada. Melewati pembuatan file.${NC}"
fi

# 7. Start Containers with Docker Compose
echo -e "${YELLOW}[6/7] Menarik image dan menjalankan kontainer Docker Compose...${NC}"
cd docker
docker compose pull
docker compose up -d --build

# Wait for database to boot up safely
echo -e "${BLUE}[INFO] Menunggu database PostgreSQL dan kontainer siap (10 detik)...${NC}"
sleep 10

# 8. Run Migration and Seed Admin
echo -e "${YELLOW}[7/7] Menjalankan Laravel Migration & Seeder...${NC}"
docker compose exec -T backend php artisan migrate --force
docker compose exec -T backend php artisan db:seed --class=AdminSeeder --force

# 9. Finished installation & credentials report
echo ""
echo -e "${GREEN}========================================================================${NC}"
echo -e "${GREEN}      INSTALASI SELESAI - INTELLIGENCE WHATSAPP ANALYZER AKTiF!${NC}"
echo -e "${GREEN}========================================================================${NC}"
echo -e "Aplikasi sekarang dapat diakses secara lokal di:"
echo -e "Nginx Gateway: ${BLUE}http://localhost${NC} atau ${BLUE}http://192.168.x.x${NC} (IP Lokal Anda)"
echo -e "WhatsApp API Gateway: ${BLUE}http://localhost:3001${NC}"
echo -e "Ollama Offline LLM: ${BLUE}http://localhost:11434${NC}"
echo ""
echo -e "Akun administrator bawaan:"
echo -e "Username: ${YELLOW}admin${NC}"
echo -e "Password: ${YELLOW}password${NC}"
echo ""
echo -e "Untuk memantau logs container:"
echo -e "  ${BLUE}docker compose logs -f${NC} (di dalam folder docker/)"
echo -e "Gunakan script ${BLUE}./start.sh${NC}, ${BLUE}./stop.sh${NC}, ${BLUE}./backup.sh${NC} di root folder."
echo -e "========================================================================"
