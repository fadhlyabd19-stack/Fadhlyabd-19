// src/components/RfidPosTerminal.tsx
// Terminal Pos Absensi RFID di Gerbang Sekolah (Mendukung Hardware USB-HID Keyboard Wedge & Simulasi)

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Volume2,
  HelpCircle,
  RefreshCw,
  UserCheck,
  Building,
} from 'lucide-react';
import {
  Student,
  Teacher,
  Schedule,
  AttendanceRecord,
  AttendanceStatus,
  WhatsAppDeliveryLog,
} from '../types';
import { soundEffects } from '../utils/audio';

interface RfidPosTerminalProps {
  students: Student[];
  teachers: Teacher[];
  schedules: Schedule[];
  onAttendanceRecorded: (
    record: AttendanceRecord,
    waLog?: WhatsAppDeliveryLog
  ) => void;
  recentLogs: AttendanceRecord[];
}

export const RfidPosTerminal: React.FC<RfidPosTerminalProps> = ({
  students,
  teachers,
  schedules,
  onAttendanceRecorded,
  recentLogs,
}) => {
  const [selectedGate, setSelectedGate] = useState<string>('Gerbang Utama (Gate 1 Utara)');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineBuffer, setOfflineBuffer] = useState<AttendanceRecord[]>([]);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    entityName: string;
    entityType: 'STUDENT' | 'TEACHER';
    roleOrClass: string;
    avatarUrl?: string;
    status: AttendanceStatus;
    lateMinutes: number;
    timeStr: string;
    rfidUid: string;
    parentPhone?: string;
  } | null>(null);

  const [scanStatusMessage, setScanStatusMessage] = useState<string>(
    'Menunggu tap kartu RFID pada USB/Bluetooth reader...'
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus otomatis ke input agar hardware RFID USB-HID langsung terbaca
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [lastScannedResult]);

  // Listener keyboard global untuk menangkap input scanner RFID fisik
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika user sedang mengetik di textarea atau input form lain
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          (target.tagName === 'INPUT' && target.id !== 'rfid-hidden-input'))
      ) {
        return;
      }

      const currentTime = Date.now();
      // Hardware reader mengirim karakter berurutan sangat cepat (<50ms per key)
      if (currentTime - lastKeyTime > 150) {
        keyBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (keyBuffer.trim().length > 3) {
          processRfidCard(keyBuffer.trim());
          keyBuffer = '';
        }
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [students, teachers, schedules, isOfflineMode, selectedGate]);

  // Fungsi evaluasi status jam masuk berdasarkan jenjang
  const evaluateScheduleStatus = (
    gradeLevel: string | undefined,
    currentTime: Date
  ): { status: AttendanceStatus; lateMinutes: number } => {
    const defaultSchedule = schedules.find((s) => s.gradeLevel === gradeLevel) || schedules[1];
    const [targetHour, targetMinute] = defaultSchedule.lateThreshold.split(':').map(Number);

    const scheduleDate = new Date(currentTime);
    scheduleDate.setHours(targetHour, targetMinute, 0, 0);

    const diffMinutes = Math.floor((currentTime.getTime() - scheduleDate.getTime()) / (1000 * 60));

    if (diffMinutes > 0) {
      return { status: 'LATE', lateMinutes: diffMinutes };
    }
    return { status: 'ON_TIME', lateMinutes: 0 };
  };

  // Proses utama scan kartu RFID
  const processRfidCard = (cardUid: string) => {
    setIsScanning(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    // Cari di data siswa
    const matchedStudent = students.find(
      (s) => s.rfidCardUid?.toLowerCase() === cardUid.toLowerCase()
    );

    // Cari di data guru
    const matchedTeacher = teachers.find(
      (t) => t.rfidCardUid?.toLowerCase() === cardUid.toLowerCase()
    );

    if (matchedStudent) {
      const { status, lateMinutes } = evaluateScheduleStatus(matchedStudent.gradeLevel, now);

      if (status === 'ON_TIME') {
        soundEffects.playSuccessBeep();
      } else {
        soundEffects.playWarningBeep();
      }

      const newRecord: AttendanceRecord = {
        id: `att_${Date.now()}`,
        entityType: 'STUDENT',
        entityId: matchedStudent.id,
        entityName: matchedStudent.fullName,
        gradeLevel: matchedStudent.gradeLevel,
        className: matchedStudent.className,
        timestamp: now.toISOString(),
        timeStr,
        dateStr,
        type: 'CHECK_IN',
        method: 'RFID',
        posLocation: selectedGate,
        status,
        lateMinutes,
        rawRfidUid: cardUid,
        waDeliveryStatus: isOfflineMode ? 'QUEUED' : 'SENT',
        parentPhone: matchedStudent.parentPhone,
      };

      // Siapkan log notifikasi WhatsApp ke wali murid
      const waLog: WhatsAppDeliveryLog = {
        id: `wa_${Date.now()}`,
        attendanceId: newRecord.id,
        studentId: matchedStudent.id,
        studentName: matchedStudent.fullName,
        recipientPhone: matchedStudent.parentPhone,
        recipientName: matchedStudent.parentName,
        templateCode: status === 'LATE' ? 'WA_SISWA_HADIR_TERLAMBAT' : 'WA_SISWA_HADIR_TEPAT_WAKTU',
        messageText:
          status === 'LATE'
            ? `Assalamu’alaikum Wr. Wb.\nBapak/Ibu ${matchedStudent.parentName},\nKami informasikan ananda *${matchedStudent.fullName}* (${matchedStudent.className}) telah hadir di sekolah pukul *${timeStr} WIB*. Status: ⚠️ TERLAMBAT (${lateMinutes} menit).`
            : `Assalamu’alaikum Wr. Wb.\nBapak/Ibu ${matchedStudent.parentName},\nKami informasikan ananda *${matchedStudent.fullName}* (${matchedStudent.className}) telah hadir di sekolah pukul *${timeStr} WIB*. Status: ✅ HADIR TEPAT WAKTU.`,
        provider: 'META_CLOUD_API',
        status: isOfflineMode ? 'QUEUED' : 'DELIVERED',
        attempts: 1,
        maxAttempts: 3,
        timestamp: now.toISOString(),
      };

      if (isOfflineMode) {
        setOfflineBuffer((prev) => [...prev, newRecord]);
        setScanStatusMessage(`Offline: Kartu ${cardUid} tersimpan di antrian lokal cache.`);
      } else {
        onAttendanceRecorded(newRecord, waLog);
        setScanStatusMessage(`Presensi berhasil: ${matchedStudent.fullName} (${status === 'LATE' ? 'Terlambat' : 'Tepat Waktu'})`);
      }

      setLastScannedResult({
        entityName: matchedStudent.fullName,
        entityType: 'STUDENT',
        roleOrClass: `${matchedStudent.gradeLevel} • ${matchedStudent.className}`,
        avatarUrl: matchedStudent.avatarUrl,
        status,
        lateMinutes,
        timeStr,
        rfidUid: cardUid,
        parentPhone: matchedStudent.parentPhone,
      });
    } else if (matchedTeacher) {
      soundEffects.playSuccessBeep();

      const newRecord: AttendanceRecord = {
        id: `att_${Date.now()}`,
        entityType: 'TEACHER',
        entityId: matchedTeacher.id,
        entityName: matchedTeacher.fullName,
        timestamp: now.toISOString(),
        timeStr,
        dateStr,
        type: 'CHECK_IN',
        method: 'RFID',
        posLocation: selectedGate,
        status: 'ON_TIME',
        lateMinutes: 0,
        rawRfidUid: cardUid,
        waDeliveryStatus: 'NOT_REQUIRED',
      };

      if (isOfflineMode) {
        setOfflineBuffer((prev) => [...prev, newRecord]);
      } else {
        onAttendanceRecorded(newRecord);
      }

      setScanStatusMessage(`Guru Hadir: ${matchedTeacher.fullName}`);
      setLastScannedResult({
        entityName: matchedTeacher.fullName,
        entityType: 'TEACHER',
        roleOrClass: matchedTeacher.subject,
        avatarUrl: matchedTeacher.avatarUrl,
        status: 'ON_TIME',
        lateMinutes: 0,
        timeStr,
        rfidUid: cardUid,
      });
    } else {
      // Kartu tidak terdaftar
      soundEffects.playErrorBeep();
      setScanStatusMessage(`Peringatan: Kartu UID ${cardUid} tidak terdaftar di database!`);
      setLastScannedResult({
        entityName: 'Kartu Tidak Dikenal',
        entityType: 'STUDENT',
        roleOrClass: 'UID Belum Terdaftar di Master Data',
        status: 'ABSENT',
        lateMinutes: 0,
        timeStr,
        rfidUid: cardUid,
      });
    }

    setTimeout(() => {
      setIsScanning(false);
    }, 400);
  };

  // Sinkronisasi antrian offline ke backend
  const syncOfflineBuffer = () => {
    if (offlineBuffer.length === 0) return;
    offlineBuffer.forEach((rec) => {
      onAttendanceRecorded(rec);
    });
    setOfflineBuffer([]);
    soundEffects.playSuccessBeep();
    setScanStatusMessage(`Berhasil menyinkronkan ${offlineBuffer.length} data absensi offline ke server.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Pos RFID */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/20">
              <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
              Terminal Kiosk Presensi Gerbang
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Pos Reader RFID Siswa & Guru
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Menerima tap kartu otomatis dari reader USB-HID, Bluetooth, maupun scanner OTG.
              Presensi otomatis mencocokkan jadwal jenjang dan mengirim pesan WhatsApp ke orang tua.
            </p>
          </div>

          {/* Pos Selector & Mode Offline Toggle */}
          <div className="flex flex-wrap items-center gap-3 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Lokasi Pos Gerbang:
              </label>
              <select
                id="select-pos-gate"
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value)}
                className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Gerbang Utama (Gate 1 Utara)">Gerbang Utama (Gate 1 Utara)</option>
                <option value="Gerbang 2 (SMP/SMA Selatan)">Gerbang 2 (SMP/SMA Selatan)</option>
                <option value="Lobi Drop-Off Preschool & SD">Lobi Drop-Off Preschool & SD</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Koneksi Jaringan:
              </label>
              <button
                id="btn-toggle-offline"
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  isOfflineMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isOfflineMode ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Mode Offline-First ({offlineBuffer.length})</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Online (Cloud Sync)</span>
                  </>
                )}
              </button>
            </div>

            {isOfflineMode && offlineBuffer.length > 0 && (
              <button
                id="btn-sync-offline"
                onClick={syncOfflineBuffer}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition self-end"
                title="Kirim data cache offline ke server"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync ({offlineBuffer.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Layar Display Kartu & Input Scanner (8 Col) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Reader Live Active Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Status Reader USB-HID
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Mendengarkan Kartu (Keyboard Wedge Siap)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Audio Beep: Aktif</span>
              </div>
            </div>

            {/* Hidden / Manual Input Field untuk Reader USB atau Keyboard */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Scan Reader UID (Ketik manual jika tidak memakai hardware fisik):
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  id="rfid-hidden-input"
                  type="text"
                  value={inputBuffer}
                  onChange={(e) => setInputBuffer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputBuffer.trim()) {
                      processRfidCard(inputBuffer.trim());
                      setInputBuffer('');
                    }
                  }}
                  placeholder="Contoh: RFID-SIS-10492 lalu tekan Enter..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  id="btn-manual-submit-rfid"
                  onClick={() => {
                    if (inputBuffer.trim()) {
                      processRfidCard(inputBuffer.trim());
                      setInputBuffer('');
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Tap Kartu
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                💡 <strong className="font-semibold text-slate-600">Info IT:</strong> Reader USB standar otomatis mengetik nomor UID lalu menekan tombol <code>Enter</code> seketika.
              </p>
            </div>

            {/* Hasil Tampilan Tap Terakhir (Layar Kiosk) */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Display Layar Siswa / Guru Saat Tap:</span>
                {isScanning && <span className="text-indigo-600 animate-pulse font-semibold">Memproses Kartu...</span>}
              </div>

              {lastScannedResult ? (
                <div
                  className={`rounded-2xl p-5 border transition-all ${
                    lastScannedResult.status === 'ON_TIME'
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : lastScannedResult.status === 'LATE'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <img
                      src={
                        lastScannedResult.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={lastScannedResult.entityName}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                    />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            lastScannedResult.status === 'ON_TIME'
                              ? 'bg-emerald-600 text-white'
                              : lastScannedResult.status === 'LATE'
                              ? 'bg-amber-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {lastScannedResult.status === 'ON_TIME'
                            ? '✅ HADIR TEPAT WAKTU'
                            : lastScannedResult.status === 'LATE'
                            ? `⚠️ TERLAMBAT ${lastScannedResult.lateMinutes} MENIT`
                            : '❌ KARTU TIDAK TERDAFTAR'}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          UID: {lastScannedResult.rfidUid}
                        </span>
                      </div>

                      <h4 className="text-lg font-extrabold text-slate-900 mt-2">
                        {lastScannedResult.entityName}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        {lastScannedResult.roleOrClass}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="bg-white/80 px-2.5 py-1 rounded-md border border-slate-200/60 font-semibold text-slate-800">
                          Waktu: {lastScannedResult.timeStr} WIB
                        </span>
                        <span className="bg-white/80 px-2.5 py-1 rounded-md border border-slate-200/60 font-semibold text-slate-800">
                          Lokasi: {selectedGate}
                        </span>
                      </div>

                      {lastScannedResult.parentPhone && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-xs">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-emerald-600" />
                            Notifikasi WhatsApp: Otomatis terkirim ke {lastScannedResult.parentPhone}
                          </span>
                          <span className="text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded text-[10px]">
                            WA Terkirim
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <Radio className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-bounce" />
                  <p className="text-xs font-medium">
                    {scanStatusMessage}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Silakan tap kartu fisik atau pilih simulasi kartu di panel sebelah kanan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Tombol Simulasi Kartu Cepat untuk Pengujian (4 Col) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Simulasi Kartu Siswa & Guru
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                1-Click Test
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Klik salah satu profil di bawah untuk menguji respon sistem dan notifikasi WhatsApp:
            </p>

            <div className="space-y-2.5">
              {students.map((student) => (
                <button
                  key={student.id}
                  id={`btn-tap-student-${student.id}`}
                  onClick={() => {
                    if (student.rfidCardUid) {
                      processRfidCard(student.rfidCardUid);
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatarUrl}
                      alt={student.fullName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                        {student.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {student.gradeLevel} • {student.className}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 block">
                      {student.rfidCardUid}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline">
                      Tap Kartu &rarr;
                    </span>
                  </div>
                </button>
              ))}

              {teachers.slice(0, 2).map((teacher) => (
                <button
                  key={teacher.id}
                  id={`btn-tap-teacher-${teacher.id}`}
                  onClick={() => {
                    if (teacher.rfidCardUid) {
                      processRfidCard(teacher.rfidCardUid);
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.avatarUrl}
                      alt={teacher.fullName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                        {teacher.fullName}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        Guru • {teacher.subject}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 block">
                      {teacher.rfidCardUid}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold group-hover:underline">
                      Tap Kartu &rarr;
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Aturan Jam Masuk Tiap Jenjang */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              Batas Waktu Masuk Jenjang:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {schedules.map((s) => (
                <div key={s.id} className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="font-bold text-indigo-700">{s.gradeLevel}</div>
                  <div className="text-slate-600">Maks: <strong>{s.lateThreshold} WIB</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
