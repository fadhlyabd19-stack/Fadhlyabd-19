// src/components/SystemArchitectureDocs.tsx
// Dokumentasi Arsitektur Sistem, Skema Database SQL DDL, Struktur Folder, Analisis RFID/FaceID, Rekomendasi Hosting & UU PDP

import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  Network,
  Cpu,
  Server,
  ShieldCheck,
  Code2,
  CheckCircle2,
  Copy,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';

export const SystemArchitectureDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'ARCHITECTURE' | 'DATABASE_SCHEMA' | 'FOLDER_STRUCTURE' | 'RFID_FACEID_TECH' | 'HOSTING_COST' | 'SECURITY_CHECKLIST'
  >('ARCHITECTURE');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sqlDdlSchema = `-- ============================================================
-- SKEMA DATABASE SISTEM ABSENSI SEKOLAH (POSTGRESQL / SUPABASE)
-- Jenjang: Preschool s/d SMA | Modul: RFID, FaceID, & WhatsApp Queue
-- ============================================================

-- 1. TABEL PENGGUNA SISTEM (USERS & RBAC)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN_IT', 'GURU', 'KEPALA_SEKOLAH', 'WAKA', 'ORANG_TUA')),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL GURU & PEGAWAI (TEACHERS)
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL KELAS SEKOLAH (CLASSES)
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level VARCHAR(20) NOT NULL CHECK (grade_level IN ('PRESCHOOL', 'SD', 'SMP', 'SMA')),
    class_name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(10) NOT NULL, -- Contoh: '2026/2027'
    homeroom_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL SISWA (STUDENTS)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(20) UNIQUE NOT NULL,
    nisn VARCHAR(20) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE RESTRICT,
    gender CHAR(1) CHECK (gender IN ('L', 'P')),
    date_of_birth DATE,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL KONTAK ORANG TUA / WALI (PARENT_CONTACTS)
CREATE TABLE parent_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_name VARCHAR(100) NOT NULL,
    relation_type VARCHAR(20) CHECK (relation_type IN ('AYAH', 'IBU', 'WALI')),
    whatsapp_number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL MAPPING KARTU RFID (RFID_CARDS)
CREATE TABLE rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_uid VARCHAR(64) UNIQUE NOT NULL, -- Serial Number UID kartu RFID
    entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('STUDENT', 'TEACHER')),
    entity_id UUID NOT NULL, -- ID siswa atau ID guru
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOST', 'BLOCKED')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scanned_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_rfid_card_uid ON rfid_cards(card_uid);

-- 7. TABEL VEKTOR EMBEDDING BIOMETRIK WAJAH (FACE_EMBEDDINGS)
-- Vektor 128 atau 512 dimensi disimpan sebagai array numerik, BUKAN foto mentah!
CREATE TABLE face_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('STUDENT', 'TEACHER')),
    entity_id UUID NOT NULL,
    embedding_vector REAL[] NOT NULL, -- 128 float array hasil ekstraksi model
    model_version VARCHAR(50) DEFAULT 'MobileFaceNet-v2',
    photo_hash VARCHAR(64), -- SHA-256 hash untuk integritas data
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_face_entity ON face_embeddings(entity_type, entity_id);

-- 8. TABEL JADWAL JAM MASUK SEKOLAH TIAP JENJANG (SCHEDULES)
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level VARCHAR(20) NOT NULL CHECK (grade_level IN ('PRESCHOOL', 'SD', 'SMP', 'SMA')),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1: Senin, 7: Minggu
    check_in_start TIME NOT NULL, -- Jam gerbang mulai dibuka (mis. 06:30)
    check_in_end TIME NOT NULL,   -- Jam batas tepat waktu (mis. 07:15)
    late_threshold TIME NOT NULL, -- Toleransi akhir sebelum dianggap terlambat
    check_out_start TIME NOT NULL,-- Jam mulai presensi pulang
    is_active BOOLEAN DEFAULT TRUE
);

-- 9. TABEL LOG TRANSAKSI ABSENSI REAL-TIME (ATTENDANCE_LOGS)
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('STUDENT', 'TEACHER')),
    entity_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_time TIME NOT NULL DEFAULT CURRENT_TIME,
    attendance_type VARCHAR(15) NOT NULL CHECK (attendance_type IN ('CHECK_IN', 'CHECK_OUT')),
    method VARCHAR(15) NOT NULL CHECK (method IN ('RFID', 'FACE_ID', 'MANUAL')),
    pos_location VARCHAR(100) NOT NULL, -- Misal: 'Gerbang 1 Utara', 'Mobile App'
    status VARCHAR(20) NOT NULL CHECK (status IN ('ON_TIME', 'LATE', 'EARLY_DEPARTURE', 'ABSENT')),
    late_minutes INTEGER DEFAULT 0,
    confidence_score REAL, -- Khusus Face ID (0.00 - 1.00)
    distance_meters INTEGER, -- Jarak GPS dari koordinat sekolah
    raw_rfid_uid VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_attendance_date ON attendance_logs(date_date);
CREATE INDEX idx_attendance_entity ON attendance_logs(entity_type, entity_id);

-- 10. TABEL TEMPLATE PESAN WHATSAPP (MESSAGE_TEMPLATES)
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    content_template TEXT NOT NULL,
    parameters_json JSONB, -- Daftar variable {{nama_siswa}}, {{jam_masuk}}, dll
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABEL ANTRIAN & LOG PENGIRIMAN WHATSAPP (WHATSAPP_DELIVERY_LOGS)
CREATE TABLE whatsapp_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_log_id UUID REFERENCES attendance_logs(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    message_text TEXT NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('META_CLOUD_API', 'FONNTE', 'WABLAS', 'QONTAK')),
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_wa_queue_status ON whatsapp_delivery_logs(status);

-- 12. TABEL AUDIT LOG AKTIVITAS ADMIN (AUDIT_LOGS)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- e.g. 'UPDATE_STUDENT_RFID', 'EDIT_SCHEDULE'
    entity_name VARCHAR(50) NOT NULL,
    record_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    changes_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Cetak Biru Arsitektur & Panduan Teknis IT Sekolah
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Rancangan arsitektur lengkap, skema relasional SQL 12 tabel, struktur proyek monorepo, integrasi hardware RFID USB-HID, privasi biometrik wajah, estimasi biaya hosting ramah sekolah, dan checklist kepatuhan UU PDP.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSection('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'ARCHITECTURE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Arsitektur Sistem
          </button>
          <button
            onClick={() => setActiveSection('DATABASE_SCHEMA')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'DATABASE_SCHEMA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Skema Database (SQL DDL)
          </button>
          <button
            onClick={() => setActiveSection('FOLDER_STRUCTURE')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'FOLDER_STRUCTURE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Struktur Folder
          </button>
          <button
            onClick={() => setActiveSection('RFID_FACEID_TECH')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'RFID_FACEID_TECH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Hardware & Biometrik
          </button>
          <button
            onClick={() => setActiveSection('HOSTING_COST')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'HOSTING_COST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Hosting & Biaya
          </button>
          <button
            onClick={() => setActiveSection('SECURITY_CHECKLIST')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'SECURITY_CHECKLIST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Checklist UU PDP
          </button>
        </div>
      </div>

      {/* 1. ARSITEKTUR SISTEM */}
      {activeSection === 'ARCHITECTURE' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-600" />
              1. Rancangan Arsitektur Sistem & Diagram Alur Data
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Alur pemrosesan data end-to-end: dari kartu RFID di pos gerbang dan kamera HP Guru hingga notifikasi WhatsApp ke orang tua dan visualisasi dashboard real-time.
            </p>
          </div>

          {/* Flow Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h4 className="text-xs font-bold text-slate-900">Input Data Terminal</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong>Pos Gerbang:</strong> Siswa/Guru tap kartu RFID di USB reader (Keyboard Wedge / WebHID).<br />
                <strong>HP Guru (Mobile PWA):</strong> Akses kamera WebRTC + uji keaktifan (liveness check) + validasi geofence GPS radius sekolah (150m).
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h4 className="text-xs font-bold text-slate-900">Backend & Evaluasi</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Backend REST API menerima UID / Vektor Embedding biometrik. Sistem mencocokkan jadwal jenjang (Preschool 08:00, SD 07:15, SMP 07:00, SMA 06:45) untuk menentukan status <strong>Tepat Waktu</strong> atau <strong>Terlambat</strong>.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h4 className="text-xs font-bold text-slate-900">Notifikasi WhatsApp</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Event presensi memicu antrian pesan WA otomatis. Pesan dirender menggunakan template kustom dari tabel <code>message_templates</code>, lalu dikirim via Meta Cloud API / Fonnte dengan mekanisme retry jika terjadi kegagalan jaringan.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h4 className="text-xs font-bold text-slate-900">Real-Time Dashboard</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Kepala Sekolah, Waka, dan Admin IT memantau rekap harian, persentase kehadiran per jenjang, daftar siswa terlambat, serta mengunduh laporan berkala format Excel/CSV.
              </p>
            </div>
          </div>

          {/* Diagram Alur Data ASCII */}
          <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner">
            <pre>{`[Kartu RFID] ──(Tap)──> [Reader USB/BT] ──(Keyboard Wedge)──> [POS Kiosk Web App]
                                                                     │
[HP Guru WebRTC] ──(Kamera + GPS)──> [Liveness & Vector Extractor] ──┤
                                                                     │
                                                                     ▼ (HTTPS POST /api/attendance)
                                                     ┌──────────────────────────────┐
                                                     │    EXPRESS REST API BACKEND   │
                                                     │  - Autentikasi & RBAC JWT   │
                                                     │  - Cocokkan Vektor / UID     │
                                                     │  - Evaluasi Jadwal Jenjang   │
                                                     └──────────────┬───────────────┘
                                                                    │
                     ┌──────────────────────────────────────────────┴──────────────────────────────────┐
                     ▼                                                                                 ▼
      ┌──────────────────────────────┐                                                 ┌──────────────────────────────┐
      │   POSTGRESQL DATABASE CLOUD   │                                                 │     WHATSAPP QUEUE WORKER    │
      │  - attendance_logs           │                                                 │  - Ambil template pesan      │
      │  - rfid_cards & embeddings   │                                                 │  - Rate limiter (15 msg/dtk) │
      │  - students & teachers       │                                                 │  - Retry backoff exponential │
      └──────────────┬───────────────┘                                                 └──────────────┬───────────────┘
                     │                                                                                │
                     ▼                                                                                ▼
      ┌──────────────────────────────┐                                                 ┌──────────────────────────────┐
      │ DASHBOARD MONITORING REALTIME│                                                 │  GATEWAY API (Meta / Fonnte) │
      │  - Kepsek & Waka Kurikulum   │                                                 └──────────────┬───────────────┘
      │  - Rekap per Jenjang         │                                                                │
      │  - Export CSV / Excel Laporan│                                                                ▼
      └──────────────────────────────┘                                                 [HP Orang Tua / Wali Siswa]`}</pre>
          </div>
        </div>
      )}

      {/* 2. SKEMA DATABASE SQL DDL */}
      {activeSection === 'DATABASE_SCHEMA' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                2. Skema Database Relasional Lengkap (12 Tabel PostgreSQL)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mencakup tabel users, teachers, classes, students, parent_contacts, rfid_cards, face_embeddings, schedules, attendance_logs, message_templates, whatsapp_delivery_logs, dan audit_logs.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(sqlDdlSchema, 'sql')}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedCode === 'sql' ? 'Tersalin!' : 'Salin SQL DDL'}
            </button>
          </div>

          <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre>{sqlDdlSchema}</pre>
          </div>
        </div>
      )}

      {/* 3. STRUKTUR FOLDER PROYEK */}
      {activeSection === 'FOLDER_STRUCTURE' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              3. Struktur Folder & Proyek Frontend/Backend (Clean Architecture)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Struktur modular memisahkan antarmuka pengguna (React), logika perutean API (Express), service biometrik/WhatsApp, dan skema database.
            </p>
          </div>

          <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
            <pre>{`school-attendance-system/
├── server.ts                    # Entry point backend Express (REST API + Vite Middleware)
├── package.json                 # Manifest dependensi & scripts
├── vite.config.ts               # Konfigurasi Vite & Tailwind CSS
├── tsconfig.json                # Konfigurasi TypeScript compiler
├── .env.example                 # Dokumentasi environment variables (DB_URL, WA_TOKEN, dll)
├── src/
│   ├── main.tsx                 # Entry point React frontend
│   ├── App.tsx                  # Root container, state management, & routing
│   ├── index.css                # Styling global Tailwind CSS
│   ├── types.ts                 # Shared interface & type TypeScript (User, Student, Attendance, dll)
│   ├── data/
│   │   └── initialData.ts       # Master seed data untuk Preschool - SMA
│   ├── utils/
│   │   ├── audio.ts             # Web Audio API synthesizer (feedback suara beep presensi)
│   │   ├── biometrics.ts        # Ekstraksi vektor embedding 128-D & algoritma cosine similarity
│   │   └── geofence.ts          # Formula Haversine validasi radius GPS sekolah
│   ├── components/
│   │   ├── HeaderNav.tsx        # Top bar navigasi, real-time clock, dan switcher multi-role
│   │   ├── RfidPosTerminal.tsx  # Kiosk pos gerbang (dukungan reader USB-HID keyboard wedge)
│   │   ├── FaceIdAttendance.tsx # Modul Face ID HP guru (kamera WebRTC + liveness check)
│   │   ├── DashboardAnalytics.tsx # Rekap kehadiran eksekutif, grafik 7 hari, & ekspor CSV
│   │   ├── WhatsAppHub.tsx      # Dispatcher antrian WA, template editor, & preview pesan
│   │   ├── MasterDataManagement.tsx # CRUD Siswa, Guru, Jadwal Jenjang, & mapping kartu RFID
│   │   └── SystemArchitectureDocs.tsx # Dokumentasi teknis terpadu & checklist UU PDP
└── dist/                        # Bundle hasil build produksi (Vite frontend + server.cjs)`}</pre>
          </div>
        </div>
      )}

      {/* 4. PENJELASAN TEKNIS RFID & FACE RECOGNITION */}
      {activeSection === 'RFID_FACEID_TECH' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              4. Penjelasan Teknis: Integrasi RFID Reader & Face Recognition
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bagian A: RFID USB Reader */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                A. Membaca Input RFID USB Reader di Browser
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mayoritas reader RFID USB komersial (seperti ACR122U, YK-RFID, atau reader Mifare 13.56MHz standar) bekerja dalam mode <strong>USB HID Keyboard Emulation (Keyboard Wedge)</strong>:
              </p>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li>
                  <strong>Mekanisme Kerja:</strong> Saat kartu ditempelkan, reader mengonversi nomor kartu menjadi serangkaian keystroke virtual berkecepatan tinggi (&lt;30ms per karakter) dan diakhiri dengan tombol <code>Enter</code>.
                </li>
                <li>
                  <strong>Teknik Penangkapan di Web:</strong> Web app memasang event listener <code>keydown</code> global yang mendeteksi interval antar karakter. Jika serangkaian angka masuk dengan jeda &lt;50ms, sistem mengenali input tersebut berasal dari scanner fisik, bukan ketikan manusia.
                </li>
                <li>
                  <strong>Opsi WebHID / WebUSB API:</strong> Untuk reader canggih yang butuh komunikasi 2 arah (misal menyalakan LED hijau/merah reader atau membunyikan buzzer internal reader), browser modern (Chrome/Edge) dapat memakai <code>navigator.hid.requestDevice()</code> tanpa perlu instalasi driver tambahan.
                </li>
                <li>
                  <strong>Local Agent Service (Opsional):</strong> Jika sekolah menggunakan tablet lama atau browser non-Chrome, cukup pasang daemon kecil berbasis Node.js/Python di pos absen yang membaca COM port serial dan mem-forward UID via WebSocket lokal ke web app.
                </li>
              </ul>
            </div>

            {/* Bagian B: Face Recognition & Liveness */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                B. Komparasi Solusi Face Recognition untuk Web
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemilihan teknologi pengenalan wajah ditinjau dari trade-off Akurasi, Privasi, Biaya, dan Bandwidth Sekolah:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <strong className="text-emerald-900 block font-bold">1. Client-Side (MediaPipe / TensorFlow.js / face-api.js) — SANGAT DIREKOMENDASIKAN</strong>
                  <span className="text-emerald-800 text-[11px]">
                    <strong>Akurasi:</strong> 96% - 99% dengan model MobileFaceNet / FaceMesh.<br />
                    <strong>Privasi:</strong> Maksimal. Foto tidak pernah dikirim lewat internet; HP guru hanya mengirim 128 angka vektor.<br />
                    <strong>Biaya:</strong> Rp 0 (Komputasi dijalankan oleh prosesor HP guru).<br />
                    <strong>Bandwidth:</strong> Sangat hemat, berjalan lancar meski internet sekolah lemot.
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block font-bold">2. Server-Side Matching (Python InsightFace / DeepFace)</strong>
                  <span className="text-slate-600 text-[11px]">
                    <strong>Akurasi:</strong> Sangat tinggi (99.8%).<br />
                    <strong>Privasi:</strong> Rentan jika transmisi foto tidak dienkripsi end-to-end.<br />
                    <strong>Biaya:</strong> Membutuhkan server VPS dengan GPU/CPU mumpuni (Rp 300rb - 800rb/bulan).
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block font-bold">3. Cloud Vision API (AWS Rekognition / Google Vision)</strong>
                  <span className="text-slate-600 text-[11px]">
                    <strong>Akurasi:</strong> Enterprise grade.<br />
                    <strong>Biaya:</strong> Mahal ($1 per 1.000 foto). Untuk 1.000 siswa x 22 hari = ~Rp 450.000/bln hanya untuk API wajah.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. REKOMENDASI HOSTING & ESTIMASI BIAYA */}
      {activeSection === 'HOSTING_COST' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              5. Rekomendasi Hosting Ramah Anggaran Sekolah & Estimasi Biaya Bulanan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Solusi yang dirancang agar terjangkau bagi yayasan sekolah tanpa mengorbankan uptime dan skalabilitas.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Opsi Hosting</th>
                  <th className="py-3 px-4">Komponen Layanan</th>
                  <th className="py-3 px-4">Estimasi Biaya Bulanan</th>
                  <th className="py-3 px-4">Kelebihan untuk Sekolah</th>
                  <th className="py-3 px-4">Kekurangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Opsi A: Cloud Serverless (Vercel / Cloud Run + Supabase)
                    <span className="block text-[10px] text-emerald-600 font-bold">Paling Direkomendasikan</span>
                  </td>
                  <td className="py-3.5 px-4">
                    - Frontend: Vercel Free Tier<br />
                    - Database: Supabase PostgreSQL (Free s.d 500MB)<br />
                    - WA Gateway: Fonnte (Rp 75rb/bln)
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">
                    Rp 75.000 - Rp 150.000 / bulan
                  </td>
                  <td className="py-3.5 px-4">
                    Zero maintenance, auto backup database harian, auto SSL HTTPS, gratis biaya server untuk kapasitas &lt;1.500 siswa.
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    Supabase free tier auto-pause jika tidak aktif 7 hari (dapat dicegah dengan cron job ping rutin).
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Opsi B: VPS Lokal Indonesia (IDCloudHost / Biznet GIO / Niagahoster)
                  </td>
                  <td className="py-3.5 px-4">
                    - 1x VPS Linux (2 Core CPU, 2-4 GB RAM, 40GB SSD)<br />
                    - Nginx reverse proxy + Docker<br />
                    - Domain sekolah .sch.id
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    Rp 120.000 - Rp 250.000 / bulan
                  </td>
                  <td className="py-3.5 px-4">
                    Server berada di Indonesia (latency sangat rendah &lt;15ms), kendali penuh data lokal, tidak ada batasan kuota record.
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    Tim IT sekolah wajib mengurus security patch, backup otomatis, dan SSL Let’s Encrypt mandiri.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Opsi C: Firebase Ecosystem (Google Cloud)
                  </td>
                  <td className="py-3.5 px-4">
                    - Firebase Hosting + Cloud Functions<br />
                    - Firestore DB NoSQL (Spark Plan Free Tier)
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    Gratis (Spark Tier) s.d ~Rp 100.000/bln jika read/write tinggi
                  </td>
                  <td className="py-3.5 px-4">
                    Sinkronisasi real-time instan ke dashboard guru dan orang tua.
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    Query agregasi laporan rekap bulanan di Firestore lebih rumit dibanding PostgreSQL (SQL).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CHECKLIST KEAMANAN & PRIVASI DATA (UU PDP) */}
      {activeSection === 'SECURITY_CHECKLIST' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              6. Checklist Kepatuhan Keamanan & UU Perlindungan Data Pribadi (UU No. 27/2022)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Wajib dipenuhi oleh Kepala IT Sekolah sebelum sistem diluncurkan untuk data guru dan siswa di bawah umur:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                1. Data Biometrik Spesifik (Pasal 16 & 28 UU PDP)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Wajah adalah data pribadi yang bersifat <em>spesifik</em>. Sistem <strong>dilarang menyimpan arsip foto mentah wajah siswa</strong> di public storage. Sistem hanya menyimpan koordinat vektor matematis 128-D yang telah di-hash, sehingga mustahil direkayasa balik menjadi foto anak.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                2. Persetujuan Tertulis Wali Murid (Parental Consent)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Untuk jenjang Preschool, SD, dan SMP (anak di bawah 18 tahun), sekolah wajib menyediakan lembar persetujuan (informed consent) digital/cetak bagi orang tua sebelum kartu RFID diterbitkan dan enrolment wajah dilakukan.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                3. Role-Based Access Control (RBAC) Ketat
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Guru hanya boleh mengakses data absensi kelasnya sendiri. Orang tua hanya bisa melihat presensi anandanya. Hanya Admin IT dan Kepala Sekolah yang memiliki izin melihat data agregat dan audit log sistem.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                4. Audit Trail & Retensi Data Otomatis
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap perubahan manual status kehadiran oleh guru atau admin dicatat dalam tabel <code>audit_logs</code> (siapa yang mengubah, kapan, dan alasannya). Buat aturan otomatis menghapus data biometrik alumni yang telah lulus setelah 6 bulan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
