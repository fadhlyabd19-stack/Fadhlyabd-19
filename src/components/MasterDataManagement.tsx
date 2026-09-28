// src/components/MasterDataManagement.tsx
// Manajemen Data Master: Guru, Siswa, Kelas, Jadwal Jam Masuk Tiap Jenjang, Mapping Kartu RFID, dan Pendaftaran Face ID

import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
  Radio,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Camera,
  Search,
  School,
  Sparkles,
} from 'lucide-react';
import { Student, Teacher, ClassRoom, Schedule, GradeLevel } from '../types';
import { soundEffects } from '../utils/audio';

interface MasterDataManagementProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  schedules: Schedule[];
  onAddStudent: (student: Student) => void;
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateSchedule: (schedule: Schedule) => void;
}

export const MasterDataManagement: React.FC<MasterDataManagementProps> = ({
  students,
  teachers,
  classes,
  schedules,
  onAddStudent,
  onAddTeacher,
  onUpdateSchedule,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'STUDENTS' | 'TEACHERS' | 'SCHEDULES' | 'RFID_MAP'>('STUDENTS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State Tambah Siswa
  const [isAddStudentOpen, setIsAddStudentOpen] = useState<boolean>(false);
  const [newNis, setNewNis] = useState<string>('');
  const [newNisn, setNewNisn] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newGrade, setNewGrade] = useState<GradeLevel>('SD');
  const [newClassName, setNewClassName] = useState<string>('1 SD Al-Fatih');
  const [newParentName, setNewParentName] = useState<string>('');
  const [newParentPhone, setNewParentPhone] = useState<string>('');
  const [newRfidUid, setNewRfidUid] = useState<string>('');

  // Edit Schedule State
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editLateThreshold, setEditLateThreshold] = useState<string>('');
  const [editCheckInStart, setEditCheckInStart] = useState<string>('');

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const student: Student = {
      id: `std_${Date.now()}`,
      nis: newNis || `${Math.floor(100000 + Math.random() * 900000)}`,
      nisn: newNisn || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      fullName: newName,
      gradeLevel: newGrade,
      classId: 'cls_custom',
      className: newClassName,
      gender: 'L',
      parentName: newParentName || 'Wali Siswa',
      parentPhone: newParentPhone || '081234567890',
      parentRelation: 'AYAH',
      rfidCardUid: newRfidUid || `RFID-SIS-${Math.floor(10000 + Math.random() * 90000)}`,
      faceEnrolled: false,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: true,
    };

    onAddStudent(student);
    setIsAddStudentOpen(false);
    soundEffects.playSuccessBeep();

    // Reset Form
    setNewName('');
    setNewNis('');
    setNewNisn('');
    setNewParentName('');
    setNewParentPhone('');
    setNewRfidUid('');
  };

  const handleStartEditSchedule = (sch: Schedule) => {
    setEditingScheduleId(sch.id);
    setEditCheckInStart(sch.checkInStart);
    setEditLateThreshold(sch.lateThreshold);
  };

  const handleSaveSchedule = (sch: Schedule) => {
    onUpdateSchedule({
      ...sch,
      checkInStart: editCheckInStart,
      lateThreshold: editLateThreshold,
      checkInEnd: editLateThreshold,
    });
    setEditingScheduleId(null);
    soundEffects.playSuccessBeep();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            Manajemen Master Data Sekolah Terpadu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data siswa, guru, jadwal masuk tiap jenjang, serta mapping UID kartu RFID dan registrasi Face ID.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('STUDENTS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'STUDENTS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Siswa ({students.length})
          </button>
          <button
            onClick={() => setActiveSubTab('TEACHERS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'TEACHERS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Guru & Pegawai ({teachers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('SCHEDULES')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'SCHEDULES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Jadwal Masuk ({schedules.length})
          </button>
          <button
            onClick={() => setActiveSubTab('RFID_MAP')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'RFID_MAP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Mapping Kartu RFID
          </button>
        </div>
      </div>

      {/* TAB 1: DATA SISWA */}
      {activeSubTab === 'STUDENTS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NIS siswa..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Tambah Siswa Baru
            </button>
          </div>

          {/* Modal Form Tambah Siswa */}
          {isAddStudentOpen && (
            <form onSubmit={handleSaveNewStudent} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Form Tambah Siswa Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Nama Lengkap Siswa:</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Muhammad Ali"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Jenjang:</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value as GradeLevel)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="PRESCHOOL">Preschool</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Nama Kelas:</label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Contoh: 7 SMP Sains 1"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Nama Orang Tua / Wali:</label>
                  <input
                    type="text"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    placeholder="Contoh: Bpk. Ahmad"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">No. WhatsApp Wali:</label>
                  <input
                    type="text"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">UID Kartu RFID (Opsional):</label>
                  <input
                    type="text"
                    value={newRfidUid}
                    onChange={(e) => setNewRfidUid(e.target.value)}
                    placeholder="Scan atau ketik UID..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          )}

          {/* Tabel Data Siswa */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NIS / NISN</th>
                  <th className="py-3 px-4">Jenjang & Kelas</th>
                  <th className="py-3 px-4">Wali Murid & No WA</th>
                  <th className="py-3 px-4">UID Kartu RFID</th>
                  <th className="py-3 px-4">Status Face ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <img src={std.avatarUrl} alt={std.fullName} className="w-7 h-7 rounded-lg object-cover" />
                      {std.fullName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {std.nis} / {std.nisn}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{std.className}</span>
                      <span className="ml-1 text-[9px] bg-slate-100 px-1 py-0.5 rounded font-bold">
                        {std.gradeLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{std.parentName}</div>
                      <div className="font-mono text-[10px] text-emerald-700 font-bold">{std.parentPhone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">
                      {std.rfidCardUid || <span className="text-slate-400 font-normal">Belum di-mapping</span>}
                    </td>
                    <td className="py-3 px-4">
                      {std.faceEnrolled ? (
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          Terdaftar
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px]">
                          Belum Enrol
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DATA GURU */}
      {activeSubTab === 'TEACHERS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nama Guru & NIP</th>
                  <th className="py-3 px-4">Mata Pelajaran / Tugas</th>
                  <th className="py-3 px-4">Nomor HP</th>
                  <th className="py-3 px-4">UID Kartu RFID</th>
                  <th className="py-3 px-4">Status Face ID Mobile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {teachers.map((tch) => (
                  <tr key={tch.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <img src={tch.avatarUrl} alt={tch.fullName} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <div>{tch.fullName}</div>
                        <div className="font-mono text-[10px] text-slate-400 font-normal">NIP: {tch.nip}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{tch.subject}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{tch.phone}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">{tch.rfidCardUid}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Siap Face ID
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: JADWAL MASUK TIAP JENJANG */}
      {activeSubTab === 'SCHEDULES' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Aturan Jam Masuk & Batas Toleransi per Jenjang Sekolah
            </h4>
            <p>
              Tiap jenjang (Preschool, SD, SMP, SMA) memiliki jam masuk yang berbeda. Sistem secara dinamis menghitung keterlambatan berdasarkan tabel ini saat siswa/guru melakukan tap RFID atau scan Face ID.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((sch) => (
              <div key={sch.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900">{sch.gradeLevel}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                      {sch.dayName}
                    </span>
                  </div>
                  {editingScheduleId !== sch.id && (
                    <button
                      onClick={() => handleStartEditSchedule(sch)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Ubah Jam
                    </button>
                  )}
                </div>

                {editingScheduleId === sch.id ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">Mulai Buka Gerbang:</label>
                        <input
                          type="time"
                          value={editCheckInStart}
                          onChange={(e) => setEditCheckInStart(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">Batas Jam Masuk (Terlambat):</label>
                        <input
                          type="time"
                          value={editLateThreshold}
                          onChange={(e) => setEditLateThreshold(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold text-rose-600"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingScheduleId(null)}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleSaveSchedule(sch)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mulai Presensi Dibuka:</span>
                      <span className="font-mono font-semibold text-slate-800">{sch.checkInStart} WIB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Batas Masuk (Tepat Waktu):</span>
                      <span className="font-mono font-bold text-emerald-600">{sch.lateThreshold} WIB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mulai Presensi Pulang:</span>
                      <span className="font-mono font-semibold text-slate-800">{sch.checkOutStart} WIB</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
                      Catatan: {sch.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MAPPING KARTU RFID */}
      {activeSubTab === 'RFID_MAP' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600" />
              Mapping Kartu Fisik RFID ke Data Guru & Siswa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungkan kartu RFID contactless 13.56MHz (Mifare 1K) atau 125kHz EM-ID dengan siswa atau guru secara instan.
            </p>
          </div>

          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
            <Radio className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Cara Menambahkan / Mengganti Kartu RFID Siswa:</div>
              <p className="mt-0.5 leading-relaxed text-indigo-800">
                1. Hubungkan reader USB-HID ke komputer Admin IT.<br />
                2. Tap kartu fisik baru di reader.<br />
                3. Reader akan menginput nomor UID unik (misal: <code>RFID-SIS-10492</code>) ke input field profil siswa yang dituju.<br />
                4. Klik simpan. Kartu langsung aktif dan dapat digunakan di semua pos gerbang sekolah secara instan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
