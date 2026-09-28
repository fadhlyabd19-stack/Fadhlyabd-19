# Panduan Implementasi Sistem Presensi Sekolah Menggunakan Python (FastAPI & Edge IoT)

Dokumentasi resmi untuk Tim IT Sekolah (Al-Haraki / Sekolah Umum) untuk menerapkan solusi presensi berbasis **Python**.

---

## 1. Mengapa Menggunakan Python?

1. **Kompatibilitas Hardware IoT**:
   - Skrip Python (`rfid_pos_listener.py`) dapat langsung berjalan di **Raspberry Pi 4 / 5** atau Mini PC di pos satpam/gerbang untuk membaca reader kartu RFID (USB HID / Serial RS485).
2. **Kecerdasan Buatan & Biometrik Wajah**:
   - Python adalah standar industri untuk *Computer Vision* (OpenCV, InsightFace, DeepFace) untuk pencocokan wajah dan deteksi liveness anti-spoofing.
3. **Kecepatan & Performa Backend (FastAPI)**:
   - FastAPI mengungguli Flask/Django dalam hal kecepatan konkurensi (mampu menangani lonjakan 1.000+ tap kartu saat jam masuk sekolah 06:45 - 07:15).
4. **Otomasi Pesan WhatsApp**:
   - Integrasi langsung dengan Meta Cloud API atau Fonnte/Wablas dengan antrean asinkron.

---

## 2. Struktur Proyek Python

```
python/
├── requirements.txt           # Dependensi pustaka Python
├── README.md                  # Panduan deployment ini
└── app/
    ├── main.py                # Server REST API FastAPI
    ├── models.py              # Skema database ORM SQLAlchemy
    ├── schemas.py             # Validasi request & response Pydantic
    ├── rfid_pos_listener.py   # Skrip hardware di Raspberry Pi gerbang
    ├── face_engine.py         # Algoritma pencocokan wajah & GPS geofence
    └── whatsapp_sender.py     # Modul pengiriman notifikasi WhatsApp
```

---

## 3. Langkah Instalasi & Menjalankan Server (Ubuntu / Debian / Raspberry Pi)

### Langkah 1: Buat Virtual Environment
```bash
cd python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Langkah 2: Jalankan Server FastAPI
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Buka browser dan akses dokumentasi interaktif Swagger di:
`http://localhost:8000/docs`

---

## 4. Cara Menjalankan Skrip Pos RFID di Raspberry Pi (Gerbang Sekolah)

1. Pasang USB RFID Reader (Mifare 13.56 MHz) ke port USB Raspberry Pi.
2. Edit file `python/app/rfid_pos_listener.py`, sesuaikan `SERVER_URL` dengan IP server sekolah (misal: `http://192.168.1.100:8000/api/attendance/rfid-tap`).
3. Jalankan skrip:
```bash
python3 app/rfid_pos_listener.py
```
Saat kartu ditempelkan:
- Buzzer akan berbunyi beep konfirmasi (<0.3 detik).
- Data dikirim otomatis ke server.
- Orang tua menerima pesan WhatsApp seketika jika ananda terdaftar.
- Jika jaringan WiFi sekolah terputus, data otomatis tersimpan di SQLite lokal dan di-sync otomatis begitu koneksi pulih!
