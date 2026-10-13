# DaSeven_Project — Anomali SMK: Cosmic Card RPG

Game 2D Pixel Art Turn-Based Action RPG bertema anak SMK melawan anomali alien abstrak di koridor sekolah dan menjelajahi kawasan Jalan Raya Baleendah.

---

## 🌟 Fitur Utama

### 1. Eksplorasi Koridor & Kampus SMKN 7 (Overworld)
- **Visual Retro 32x32 Pixel Art**: Eksplorasi koridor, ruang kelas, laboratorium komputer, dan lapangan upacara.
- **Animasi Karakter Dinamis**: Karakter Maine (anak SMK seragam putih abu-abu) dengan animasi melangkah 4 arah dan transisi otomatis ke pose **idle breathing** saat berhenti.
- **Interaksi Lingkungan**: Pintu gerbang sekolah, meja komputer, dispenser, dan NPC.

### 2. Dunia Terbuka Jalan Raya Baleendah (Street Map)
- **Simulasi Lalu Lintas Dinamis**:
  - **Angkot Hijau Toska**: Minivan legendaris khas Bandung/Baleendah dengan animasi roda dan pintu lipat.
  - **Mobil Pick-up Muatan**: Pick-up biru Carry/L300 dengan bak terpal hijau.
  - **Mobil Avanza Hitam**: MPV keluarga hitam metalik dengan pelat D (Bandung).
- **Sistem Lampu Lalu Lintas & Zebra Cross**:
  - Lampu merah, kuning, dan hijau di perempatan vertikal.
  - Kendaraan otomatis berhenti saat lampu merah.
  - Peringatan klakson dan bahaya tabrakan (-50% HP) saat menyeberang sembarangan di luar zebra cross.
- **Kawasan Pertokoan & Industri**:
  - PT. Textile Baleendah (Pabrik & Gudang)
  - Fotocopy & ATK Kurnia
  - Warmindo Putra Kuningan
  - Baleendah Mart 24 Jam
  - Counter Pulsa, Bengkel Motor, dan Warung Madura

### 3. Sistem Pertarungan Turn-Based Card RPG
- **Kartu Aksi Khas Anak Teknik**:
  - *Serangan*: Penggaris Besi 30cm, Pecutan Kabel LAN, Hantaman Kunci Pas.
  - *Bertahan*: Buku Modul Tebal, Tas Ransel Eiger.
  - *Pemulihan*: Es Teh Kantin Segar, Mie Dok-Dok Hangat.
  - *Spesial*: Tespen Volt Surge, Solder Overclock.
- **Active Action Timing (QTE)**: Mekanik timing sweet spot (Spacebar) saat menyerang untuk memicu **Critical Hit x2.0**.
- **Enemy Parry Reaction**: Sistem tangkisan bertahan saat alien menyerang untuk meredam damage hingga 80%.

### 4. Audio Sintetis Procedural
- **Synthesizer Web Audio API**: 100% audio prosedural retro tanpa dependensi file audio eksternal (langkah kaki, kartu, intro pertarungan, klakson kendaraan, dan tabrakan).

---

## 🎮 Kontrol Game
- **W / A / S / D** atau **Tombol Panah**: Bergerak melangkah (Atas, Kiri, Bawah, Kanan).
- **Spasi (Spacebar)**: 
  - Masuk kembali ke gerbang sekolah saat di Jalan Raya.
  - QTE Action Timing saat pertarungan kartu.
- **Klik Kiri Mouse**: Memilih kartu dan tombol aksi.

---

## 🚀 Cara Menjalankan

```bash
# Install dependensi
npm install

# Jalankan development server
npm run dev
```

Buka browser di `http://localhost:5173`.
