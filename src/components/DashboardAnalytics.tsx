// src/components/DashboardAnalytics.tsx
// Dashboard Rekap Kehadiran Guru & Siswa untuk Kepala Sekolah, Waka Kurikulum/Kesiswaan, dan Admin IT

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Radio,
  Smartphone,
  ChevronRight,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  AttendanceRecord,
  GradeLevel,
  Student,
  Teacher,
  ClassRoom,
  AttendanceStatus,
} from '../types';

interface DashboardAnalyticsProps {
  attendanceLogs: AttendanceRecord[];
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  attendanceLogs,
  students,
  teachers,
  classes,
}) => {
  // Filter States
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('TODAY');

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      if (selectedGrade !== 'ALL' && log.gradeLevel !== selectedGrade) return false;
      if (selectedClass !== 'ALL' && log.className !== selectedClass) return false;
      if (selectedStatus !== 'ALL' && log.status !== selectedStatus) return false;
      if (selectedMethod !== 'ALL' && log.method !== selectedMethod) return false;
      if (
        searchKeyword.trim() &&
        !log.entityName.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !log.className?.toLowerCase().includes(searchKeyword.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [attendanceLogs, selectedGrade, selectedClass, selectedStatus, selectedMethod, searchKeyword]);

  // Statistik Ringkasan (KPIs)
  const totalStudents = students.length;
  const totalTeachers = teachers.length;

  const presentStudentsCount = useMemo(() => {
    const uniquePresentStudents = new Set(
      attendanceLogs
        .filter((l) => l.entityType === 'STUDENT' && (l.status === 'ON_TIME' || l.status === 'LATE'))
        .map((l) => l.entityId)
    );
    return uniquePresentStudents.size;
  }, [attendanceLogs]);

  const presentTeachersCount = useMemo(() => {
    const uniquePresentTeachers = new Set(
      attendanceLogs
        .filter((l) => l.entityType === 'TEACHER' && (l.status === 'ON_TIME' || l.status === 'LATE'))
        .map((l) => l.entityId)
    );
    return uniquePresentTeachers.size;
  }, [attendanceLogs]);

  const lateStudentsCount = useMemo(() => {
    return attendanceLogs.filter((l) => l.entityType === 'STUDENT' && l.status === 'LATE').length;
  }, [attendanceLogs]);

  const unrecordedStudentsCount = Math.max(0, totalStudents - presentStudentsCount);

  // Rekap Kehadiran per Jenjang
  const statsByGrade = useMemo(() => {
    const grades: GradeLevel[] = ['PRESCHOOL', 'SD', 'SMP', 'SMA'];
    return grades.map((g) => {
      const gradeStudents = students.filter((s) => s.gradeLevel === g);
      const gradePresent = attendanceLogs.filter(
        (l) => l.gradeLevel === g && (l.status === 'ON_TIME' || l.status === 'LATE')
      );
      const uniquePresent = new Set(gradePresent.map((p) => p.entityId)).size;
      const totalInGrade = gradeStudents.length || 1;
      const percentage = Math.round((uniquePresent / totalInGrade) * 100);
      return {
        grade: g,
        total: totalInGrade,
        present: uniquePresent,
        percentage,
      };
    });
  }, [students, attendanceLogs]);

  // Data Grafik 7 Hari Terakhir (Senin s.d Minggu)
  const weeklyTrendData = [
    { day: 'Sen', onTime: 96, late: 4, absent: 0 },
    { day: 'Sel', onTime: 94, late: 5, absent: 1 },
    { day: 'Rab', onTime: 97, late: 3, absent: 0 },
    { day: 'Kam', onTime: 92, late: 6, absent: 2 },
    { day: 'Jum', onTime: 95, late: 4, absent: 1 },
    { day: 'Sab', onTime: 98, late: 2, absent: 0 },
    { day: 'Hari Ini', onTime: Math.round((presentStudentsCount / (totalStudents || 1)) * 100), late: lateStudentsCount * 15, absent: unrecordedStudentsCount * 15 },
  ];

  // Ekspor ke CSV / Excel
  const handleExportCsv = () => {
    const headers = ['ID Log', 'Tanggal', 'Jam', 'Tipe', 'Nama', 'Role/Kelas', 'Jenjang', 'Metode', 'Pos/Lokasi', 'Status', 'Keterlambatan (Mnt)', 'Status Notif WA'];
    const rows = filteredLogs.map((log) => [
      log.id,
      log.dateStr,
      log.timeStr,
      log.type,
      `"${log.entityName}"`,
      `"${log.className || (log.entityType === 'TEACHER' ? 'Guru' : '-')}"`,
      log.gradeLevel || '-',
      log.method,
      `"${log.posLocation}"`,
      log.status,
      log.lateMinutes,
      log.waDeliveryStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Presensi_Sekolah_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Kehadiran Guru */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Presensi Guru
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {presentTeachersCount} / {totalTeachers}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {Math.round((presentTeachersCount / (totalTeachers || 1)) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Presensi via Face ID Mobile HP & RFID Card
          </p>
        </div>

        {/* KPI 2: Kehadiran Siswa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Presensi Siswa
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {presentStudentsCount} / {totalStudents}
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {Math.round((presentStudentsCount / (totalStudents || 1)) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Jenjang Preschool s/d SMA Terpadu
          </p>
        </div>

        {/* KPI 3: Jumlah Terlambat */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Siswa Terlambat
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">
              {lateStudentsCount}
            </span>
            <span className="text-xs text-slate-500">Siswa tercatat</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            Notifikasi WA peringatan otomatis ke orang tua
          </p>
        </div>

        {/* KPI 4: Belum Absen / Tanpa Keterangan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Belum Hadir
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600">
              {unrecordedStudentsCount}
            </span>
            <span className="text-xs text-slate-500">Siswa</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-1">
            Peringatan otomatis dikirim 15 menit pasca jam masuk
          </p>
        </div>
      </div>

      {/* Grid Grafik Tren & Persentase per Jenjang */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik 7 Hari Terakhir (8 Col) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Tren Kehadiran Siswa 7 Hari Terakhir
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rata-rata kehadiran tepat waktu vs keterlambatan harian
              </p>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg">
              Target Sekolah: ≥ 95%
            </span>
          </div>

          {/* Clean Interactive SVG Bar Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {weeklyTrendData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition">
                  {item.onTime}%
                </div>
                <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    style={{ height: `${item.onTime}%` }}
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 group-hover:from-indigo-500 group-hover:to-indigo-400 transition-all rounded-t-md"
                    title={`Hadir: ${item.onTime}%, Terlambat: ${item.late}%`}
                  ></div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 group-hover:text-indigo-600">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600"></span> Hadir Tepat Waktu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400"></span> Terlambat
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Diperbarui otomatis tiap scan masuk</span>
          </div>
        </div>

        {/* Persentase per Jenjang (4 Col) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Presensi Tiap Jenjang
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
              Hari Ini
            </span>
          </div>

          <div className="space-y-3.5">
            {statsByGrade.map((item) => (
              <div key={item.grade} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.grade}</span>
                  <span className="font-semibold text-slate-600">
                    {item.present}/{item.total} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.percentage >= 90
                        ? 'bg-emerald-500'
                        : item.percentage >= 75
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
            💡 <strong className="font-semibold text-slate-800">Evaluasi Waka:</strong> Kedisiplinan jenjang SMA terpantau 100% tepat waktu pada gerbang utama.
          </div>
        </div>
      </div>

      {/* Filter Bar & Tabel Log Real-Time */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Log Kehadiran & Audit Trail Real-Time
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredLogs.length} dari {attendanceLogs.length} catatan presensi
            </p>
          </div>

          {/* Export Button */}
          <button
            id="btn-export-attendance-csv"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export ke Excel / CSV
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Jenjang:</label>
            <select
              id="filter-grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="PRESCHOOL">Preschool</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Kelas:</label>
            <select
              id="filter-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status Kehadiran:</label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="ON_TIME">Tepat Waktu</option>
              <option value="LATE">Terlambat</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Metode Presensi:</label>
            <select
              id="filter-method"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white"
            >
              <option value="ALL">Semua Metode</option>
              <option value="RFID">Kartu RFID (Pos)</option>
              <option value="FACE_ID">Face ID (Mobile HP)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cari Nama:</label>
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Cari guru atau siswa..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>
        </div>

        {/* Tabel Data Logs */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Nama Siswa / Guru</th>
                <th className="py-3 px-4">Jenjang & Kelas</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Lokasi Pos / GPS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notifikasi WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {log.timeStr} <span className="text-[10px] text-slate-400">({log.dateStr})</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.entityName}
                      <span className="block text-[10px] text-slate-400">
                        {log.entityType === 'TEACHER' ? 'Guru' : 'Siswa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.className || '-'}
                      {log.gradeLevel && (
                        <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                          {log.gradeLevel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          log.method === 'RFID'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {log.method === 'RFID' ? (
                          <>
                            <Radio className="w-3 h-3" /> RFID
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-3 h-3" /> Face ID
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.posLocation}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.status === 'ON_TIME'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status === 'ON_TIME'
                          ? 'Tepat Waktu'
                          : log.status === 'LATE'
                          ? `Terlambat (${log.lateMinutes}m)`
                          : 'Tidak Hadir'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.entityType === 'STUDENT' ? (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            log.waDeliveryStatus === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.waDeliveryStatus === 'QUEUED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {log.waDeliveryStatus === 'DELIVERED'
                            ? 'Terkirim ke Ortu'
                            : log.waDeliveryStatus === 'QUEUED'
                            ? 'Dalam Antrian WA'
                            : 'Siap Dikirim'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data presensi yang sesuai dengan filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
