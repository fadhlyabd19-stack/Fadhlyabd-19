// src/App.tsx
// Root Application Sistem Presensi Pintar Sekolah (Preschool s/d SMA)

import React, { useState } from 'react';
import { UserRole, User, Student, Teacher, Schedule, AttendanceRecord, WhatsAppDeliveryLog, WhatsAppMessageTemplate, ClassRoom } from './types';
import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_CLASSES,
  INITIAL_SCHEDULES,
  INITIAL_TEMPLATES,
  INITIAL_ATTENDANCE,
  INITIAL_WA_LOGS,
  DEFAULT_GEOFENCE,
} from './data/initialData';
import { HeaderNav } from './components/HeaderNav';
import { SuperAdminPortal } from './components/SuperAdminPortal';
import { RfidPosTerminal } from './components/RfidPosTerminal';
import { FaceIdAttendance } from './components/FaceIdAttendance';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { WhatsAppHub } from './components/WhatsAppHub';
import { MasterDataManagement } from './components/MasterDataManagement';
import { PythonHub } from './components/PythonHub';
import { SystemArchitectureDocs } from './components/SystemArchitectureDocs';
import { CheckCircle2, MessageSquare, Radio, Smartphone, AlertCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPER_ADMIN');
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [activeTab, setActiveTab] = useState<string>('super-admin');

  // Master Data State
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [classes, setClasses] = useState<ClassRoom[]>(INITIAL_CLASSES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [templates, setTemplates] = useState<WhatsAppMessageTemplate[]>(INITIAL_TEMPLATES);

  // Transaction Logs State
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [deliveryLogs, setDeliveryLogs] = useState<WhatsAppDeliveryLog[]>(INITIAL_WA_LOGS);

  // Device & Queue Status
  const [rfidConnected, setRfidConnected] = useState<boolean>(true);
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'SUCCESS' | 'WA' | 'WARNING' | 'DELETE';
  } | null>(null);

  const showToast = (title: string, message: string, type: 'SUCCESS' | 'WA' | 'WARNING' | 'DELETE' = 'SUCCESS') => {
    setToastNotification({
      id: `toast_${Date.now()}`,
      title,
      message,
      type,
    });
    setTimeout(() => {
      setToastNotification(null);
    }, 4000);
  };

  // Ganti User & Role saat Switcher diklik
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    const matchedUser = users.find((u) => u.role === role) || users[0];
    setCurrentUser(matchedUser);

    // Bawa ke tab yang paling relevan untuk role tersebut
    if (role === 'SUPER_ADMIN') {
      setActiveTab('super-admin');
    } else if (role === 'GURU') {
      setActiveTab('face-id');
    } else if (role === 'KEPALA_SEKOLAH' || role === 'WAKA') {
      setActiveTab('dashboard');
    } else if (role === 'ORANG_TUA') {
      setActiveTab('whatsapp');
    } else {
      setActiveTab('rfid-pos');
    }
  };

  // ==========================================
  // HANDLERS CRUD SISWA (SUPER ADMIN & MASTER)
  // ==========================================
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
    showToast('Siswa Baru Ditambahkan', `Siswa ${newStudent.fullName} (${newStudent.className}) berhasil disimpan ke database.`, 'SUCCESS');
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    showToast('Data Siswa Diperbarui', `Perubahan data untuk ${updatedStudent.fullName} berhasil disimpan.`, 'SUCCESS');
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    showToast('Siswa Dihapus', `Data siswa ${student?.fullName || studentId} telah dihapus permanen.`, 'DELETE');
  };

  // ==========================================
  // HANDLERS CRUD GURU (SUPER ADMIN & MASTER)
  // ==========================================
  const handleAddTeacher = (newTeacher: Teacher) => {
    setTeachers((prev) => [newTeacher, ...prev]);
    showToast('Guru Baru Ditambahkan', `${newTeacher.fullName} berhasil ditambahkan sebagai tenaga pendidik.`, 'SUCCESS');
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers((prev) => prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)));
    showToast('Profil Guru Diperbarui', `Perubahan data untuk ${updatedTeacher.fullName} berhasil disimpan.`, 'SUCCESS');
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    showToast('Guru Dihapus', `Data guru ${teacher?.fullName || teacherId} telah dihapus.`, 'DELETE');
  };

  // ==========================================
  // HANDLERS CRUD KELAS (SUPER ADMIN)
  // ==========================================
  const handleAddClass = (newClass: ClassRoom) => {
    setClasses((prev) => [newClass, ...prev]);
    showToast('Kelas Baru Dibuat', `Rombel ${newClass.className} berhasil dibuat.`, 'SUCCESS');
  };

  const handleUpdateClass = (updatedClass: ClassRoom) => {
    setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
    showToast('Data Kelas Diperbarui', `Kelas ${updatedClass.className} berhasil diperbarui.`, 'SUCCESS');
  };

  const handleDeleteClass = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    showToast('Kelas Dihapus', `Kelas ${cls?.className || classId} telah dihapus.`, 'DELETE');
  };

  // ==========================================
  // HANDLERS CRUD USER (SUPER ADMIN)
  // ==========================================
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
    showToast('Akun Pengguna Dibuat', `Akun ${newUser.fullName} (${newUser.role}) berhasil ditambahkan.`, 'SUCCESS');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    showToast('Akun Diperbarui', `Perubahan akun ${updatedUser.fullName} berhasil disimpan.`, 'SUCCESS');
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find((item) => item.id === userId);
    setUsers((prev) => prev.filter((item) => item.id !== userId));
    showToast('Akun Dihapus', `Akun ${u?.fullName || userId} telah dihapus.`, 'DELETE');
  };

  // Handler Pencatatan Presensi Baru (dari RFID Pos atau Face ID HP Guru)
  const handleAttendanceRecorded = (
    newRecord: AttendanceRecord,
    waLog?: WhatsAppDeliveryLog
  ) => {
    setAttendanceLogs((prev) => [newRecord, ...prev]);

    if (waLog) {
      setDeliveryLogs((prev) => [waLog, ...prev]);
    }

    // Tampilkan Toast Notifikasi
    showToast(
      `${newRecord.entityName} Berhasil Presensi`,
      `${newRecord.method === 'RFID' ? 'Tap Kartu RFID' : 'Verifikasi Face ID'} di ${newRecord.posLocation}. Status: ${
        newRecord.status === 'LATE' ? 'Terlambat (' + newRecord.lateMinutes + ' mnt)' : 'Tepat Waktu'
      }.`,
      waLog ? 'WA' : 'SUCCESS'
    );
  };

  // Handler Kirim Notifikasi Manual Simulasi
  const handleTriggerManualNotification = (studentId: string, templateCode: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const template = templates.find((t) => t.templateCode === templateCode) || templates[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newWaLog: WhatsAppDeliveryLog = {
      id: `wa_manual_${Date.now()}`,
      attendanceId: `att_sim_${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      recipientPhone: student.parentPhone,
      recipientName: student.parentName,
      templateCode,
      messageText: template.contentTemplate
        .replace(/{{nama_wali}}/g, student.parentName)
        .replace(/{{nama_siswa}}/g, student.fullName)
        .replace(/{{kelas}}/g, student.className)
        .replace(/{{jam_masuk}}/g, timeStr),
      provider: 'META_CLOUD_API',
      status: 'DELIVERED',
      attempts: 1,
      maxAttempts: 3,
      timestamp: now.toISOString(),
    };

    setDeliveryLogs((prev) => [newWaLog, ...prev]);
    showToast(
      'WhatsApp Berhasil Terkirim',
      `Pesan "${template.title}" terkirim ke ${student.parentPhone} (${student.parentName}).`,
      'WA'
    );
  };

  const currentTeacher = teachers.find((t) => t.userId === currentUser.id) || teachers[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-rose-500 selection:text-white pb-16">
      {/* Header Navigasi & Role Bar */}
      <HeaderNav
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rfidConnected={rfidConnected}
        waQueueCount={deliveryLogs.filter((l) => l.status === 'QUEUED').length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {/* PORTAL SUPER ADMIN (TAMBAH, EDIT, HAPUS DATA) */}
        {activeTab === 'super-admin' && (
          <SuperAdminPortal
            students={students}
            teachers={teachers}
            classes={classes}
            users={users}
            currentSuperAdmin={currentUser}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'rfid-pos' && (
          <RfidPosTerminal
            students={students}
            teachers={teachers}
            schedules={schedules}
            onAttendanceRecorded={handleAttendanceRecorded}
            recentLogs={attendanceLogs.slice(0, 5)}
          />
        )}

        {activeTab === 'face-id' && (
          <FaceIdAttendance
            currentTeacher={currentTeacher}
            geofence={DEFAULT_GEOFENCE}
            onAttendanceRecorded={handleAttendanceRecorded}
            recentLogs={attendanceLogs.filter((l) => l.entityId === currentTeacher.id)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardAnalytics
            attendanceLogs={attendanceLogs}
            students={students}
            teachers={teachers}
            classes={classes}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppHub
            templates={templates}
            onUpdateTemplate={(updated) =>
              setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
            }
            deliveryLogs={deliveryLogs}
            onTriggerManualNotification={handleTriggerManualNotification}
            students={students}
          />
        )}

        {activeTab === 'master-data' && (
          <MasterDataManagement
            students={students}
            teachers={teachers}
            classes={classes}
            schedules={schedules}
            onAddStudent={handleAddStudent}
            onAddTeacher={handleAddTeacher}
            onUpdateSchedule={(sch) =>
              setSchedules((prev) => prev.map((s) => (s.id === sch.id ? sch : s)))
            }
          />
        )}

        {activeTab === 'python-hub' && <PythonHub />}

        {activeTab === 'architecture' && <SystemArchitectureDocs />}
      </main>

      {/* Floating Real-Time Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="mt-0.5">
            {toastNotification.type === 'WA' ? (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
            ) : toastNotification.type === 'SUCCESS' ? (
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : toastNotification.type === 'DELETE' ? (
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h5 className="text-xs font-bold text-white">{toastNotification.title}</h5>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toastNotification.message}</p>
          </div>
        </div>
      )}

      {/* Footer Branding Info */}
      <footer className="mt-12 text-center text-xs text-slate-400 border-t border-slate-200/60 pt-6">
        <p className="font-semibold text-slate-600">
          Sistem Presensi Sekolah Pintar (Preschool – SMA) • Portal Super Admin
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Otoritas Penuh Manajemen Data Anak/Siswa, Guru, Kelas, & RFID Card Mapping
        </p>
      </footer>
    </div>
  );
}
