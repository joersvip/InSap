# 🛡️ INTELLIGENCE WHATSAPP ANALYZER

Enterprise-grade local offline WhatsApp interception and intelligence analysis platform. This application is designed specifically to run in secure local environments without needing external cloud hosting, VPS, or cloud databases.

## 🎯 Target Operating Systems
* **Kali Linux** (Recommended for security operations)
* **Ubuntu Server** (18.04 LTS, 20.04 LTS, 22.04 LTS, 24.04 LTS)
* **Debian** (11 Bullseye, 12 Bookworm)

---

## 🛠️ Tech Stack & Services

### 🧱 Architecture
The system operates fully containerized via **Docker Compose**:

* **Frontend:** React + Vite + TailwindCSS
* **Backend:** Laravel 12 (PHP 8.4) with queue worker
* **Database:** PostgreSQL 15 (with durable local storage volume)
* **Cache & Queues:** Redis 7 (alpine)
* **WhatsApp Gateway:** Baileys Multi-Device API Microservice (Node.js daemon)
* **AI Engine:** Ollama (Offline Local LLM) / OpenAI API (Optional)
* **Web Server:** Nginx Reverse Proxy (handling port `80` gateway routing)

---

## 📥 Cara Install (Automated Installation)

We provide an all-in-one shell script that automates dependency verification, Docker engine setups, volume declarations, and Laravel databases seeding.

### Langkah-langkah:

1. **Clone / Salin repository ke server lokal:**
   ```bash
   git clone <repository_url> wa-analyzer
   cd wa-analyzer
   ```

2. **Berikan izin eksekusi pada script utama:**
   ```bash
   chmod +x install.sh start.sh stop.sh restart.sh backup.sh restore.sh update.sh
   ```

3. **Jalankan Installer otomatis sebagai Root (Sudo):**
   ```bash
   sudo ./install.sh
   ```

Sistem akan otomatis:
* Memeriksa OS (Kali, Ubuntu, Debian)
* Memasang **Docker Engine** & **Docker Compose** jika belum terpasang
* Membuat volume Docker untuk PostgreSQL, Redis, Baileys, dan Ollama
* Mengunduh/menarik seluruh Docker images
* Membangun container backend & WhatsApp gateway
* Menjalankan Laravel database migration & seeder administrator bawaan

---

## 📲 Cara Menjalankan & Menghentikan

Gunakan script utilitas di root folder:

### 1. Menjalankan Layanan:
```bash
./start.sh
```
Aplikasi akan aktif di **Nginx Port 80**. Buka browser Anda: `http://localhost` atau `http://192.168.x.x`.

### 2. Menghentikan Layanan:
```bash
./stop.sh
```

### 3. Merestart Layanan:
```bash
./restart.sh
```

---

## 📸 Cara Scan QR WhatsApp (Baileys Gateway)

Untuk mulai menyadap/sinkronisasi chat:

1. Buka dashboard web **Intelligence WhatsApp Analyzer**.
2. Masuk ke tab/halaman **WhatsApp Scanner**.
3. Di sana Anda akan melihat QR Code dinamis yang diproduksi oleh Baileys.
4. Buka aplikasi WhatsApp di HP target/HP operasional Anda:
   * Ketuk **Menu / Setelan (Settings)**
   * Pilih **Perangkat Tertaut (Linked Devices)**
   * Ketuk **Tautkan Perangkat (Link a Device)**
   * Arahkan kamera HP ke QR Code di layar.
5. Setelah terhubung, status di dashboard akan berubah menjadi **Connected** dan proses sinkronisasi chat akan dimulai secara otomatis di latar belakang.

---

## 💾 Cara Backup Database (PostgreSQL)

Platform dilengkapi fitur backup otomatis (Retention Policy: 30 hari). Anda juga dapat melakukan backup manual secara instan:

```bash
./backup.sh
```
Hasil backup berupa file terkompresi `.sql.gz` akan disimpan di:
`./storage/backups/backup_YYYYMMDD_HHMMSS.sql.gz`

### Cara Otomatisasi Backup (Cron Job):
Jalankan perintah berikut untuk mengedit cron job server:
```bash
sudo crontab -e
```
Tambahkan baris berikut di paling bawah untuk memicu backup harian setiap jam 2 malam:
```text
0 2 * * * /path/to/project/backup.sh >> /path/to/project/storage/logs/cron_backup.log 2>&1
```

---

## 🔄 Cara Restore Database

Untuk memulihkan database dari snapshot tertentu:

```bash
./restore.sh ./storage/backups/backup_nama_file.sql.gz
```
*Peringatan: Proses restore akan menghapus data database aktif saat ini dan menggantinya dengan snapshot backup.*

---

## ⬆️ Cara Update Aplikasi

Guna memperbarui source code aplikasi, skema database, cache, dan Docker image terbaru secara offline/lokal:

```bash
./update.sh
```

---

## 🌐 Cara Deploy di Jaringan Lokal (LAN)

Karena sistem ini tidak memerlukan hosting atau VPS, Anda dapat mengaksesnya di seluruh jaringan kantor/lokal (LAN/Wi-Fi):

1. Pastikan server lokal Anda terhubung ke router LAN/Wi-Fi.
2. Cari tahu IP lokal server Anda:
   ```bash
   ip a | grep inet
   ```
   *Misalnya, IP lokal server adalah: `192.168.1.100`*
3. Pastikan port 80 pada firewall server dalam kondisi terbuka:
   ```bash
   sudo ufw allow 80/tcp
   ```
4. Dari HP atau PC lain yang terhubung ke Wi-Fi / Router yang sama, buka browser dan akses:
   `http://192.168.1.100`
5. Aplikasi, WhatsApp QR scanner, dan visualisasi status sistem monitoring siap digunakan secara bersamaan oleh tim operasional Anda!

---

## 🛡️ Akun Administrator Bawaan
* **Username:** `admin`
* **Password:** `password`

*(Harap segera mengganti password di halaman profil setelah login pertama kali demi keamanan operasional)*
