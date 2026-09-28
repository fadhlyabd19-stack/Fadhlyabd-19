// src/components/SuperAdminPortal.tsx
// Halaman Khusus Super Admin: Kelola Penuh (Tambah, Edit, Hapus) Siswa/Anak, Guru, Kelas, dan Akun Pengguna

import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  GraduationCap,
  School,
  UserPlus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle,
  Radio,
  Camera,
  Filter,
  ArrowUpDown,
  History,
  Lock,
  Sparkles,
  KeyRound,
  Download,
  Eye,
  Check,
} from 'lucide-react';
import { Student, Teacher, ClassRoom, User, UserRole, GradeLevel } from '../types';
import { soundEffects } from '../utils/audio';

interface SuperAdminPortalProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  users: User[];
  currentSuperAdmin: User;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onAddClass: (newClass: ClassRoom) => void;
  onUpdateClass: (updatedClass: ClassRoom) => void;
  onDeleteClass: (classId: string) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  students,
  teachers,
  classes,
  users,
  currentSuperAdmin,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'TEACHERS' | 'CLASSES' | 'USERS' | 'AUDIT'>('STUDENTS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Modal State Tambah & Edit Siswa
  const [studentModalMode, setStudentModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<{
    fullName: string;
    nis: string;
    nisn: string;
    gradeLevel: GradeLevel;
    className: string;
    gender: 'L' | 'P';
    parentName: string;
    parentPhone: string;
    parentRelation: 'AYAH' | 'IBU' | 'WALI';
    rfidCardUid: string;
    faceEnrolled: boolean;
    avatarUrl: string;
    isActive: boolean;
  }>({
    fullName: '',
    nis: '',
    nisn: '',
    gradeLevel: 'SD',
    className: '1 SD Al-Fatih',
    gender: 'L',
    parentName: '',
    parentPhone: '',
    parentRelation: 'AYAH',
    rfidCardUid: '',
    faceEnrolled: false,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  });

  // Modal State Tambah & Edit Guru
  const [teacherModalMode, setTeacherModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState<{
    fullName: string;
    nip: string;
    subject: string;
    phone: string;
    email: string;
    rfidCardUid: string;
    faceEnrolled: boolean;
    isActive: boolean;
    avatarUrl: string;
  }>({
    fullName: '',
    nip: '',
    subject: '',
    phone: '',
    email: '',
    rfidCardUid: '',
    faceEnrolled: true,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });

  // Modal State Tambah & Edit Kelas
  const [classModalMode, setClassModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [classForm, setClassForm] = useState<{
    className: string;
    gradeLevel: GradeLevel;
    academicYear: string;
    homeroomTeacherId: string;
  }>({
    className: '',
    gradeLevel: 'SMA',
    academicYear: '2026/2027',
    homeroomTeacherId: teachers[0]?.id || '',
  });

  // Modal State Tambah & Edit User
  const [userModalMode, setUserModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<{
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
  }>({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'GURU',
  });

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'STUDENT' | 'TEACHER' | 'CLASS' | 'USER';
    id: string;
    name: string;
    extraInfo?: string;
  } | null>(null);

  // Super Admin Local Audit Log State
  const [auditLogs, setAuditLogs] = useState<
    { id: string; timestamp: string; action: string; targetName: string; details: string }[]
  >([
    {
      id: 'audit_01',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      action: 'LOGIN_SESSION',
      targetName: currentSuperAdmin.fullName,
      details: 'Sesi Super Admin diaktifkan dengan hak akses manipulasi master data penuh.',
    },
  ]);

  const pushAuditLog = (action: string, targetName: string, details: string) => {
    setAuditLogs((prev) => [
      {
        id: `audit_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action,
        targetName,
        details,
      },
      ...prev,
    ]);
  };

  // ==========================================
  // HANDLERS UNTUK SISWA (NAMA ANAK / MURID)
  // ==========================================
  const handleOpenAddStudent = () => {
    const randomNis = `${Math.floor(240000 + Math.random() * 90000)}`;
    setStudentForm({
      fullName: '',
      nis: randomNis,
      nisn: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      gradeLevel: 'SD',
      className: classes.find((c) => c.gradeLevel === 'SD')?.className || '1 SD Al-Fatih',
      gender: 'L',
      parentName: '',
      parentPhone: '0812',
      parentRelation: 'AYAH',
      rfidCardUid: `RFID-SIS-${Math.floor(10000 + Math.random() * 90000)}`,
      faceEnrolled: false,
      avatarUrl: `https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80`,
      isActive: true,
    });
    setSelectedStudent(null);
    setStudentModalMode('ADD');
  };

  const handleOpenEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentForm({
      fullName: student.fullName,
      nis: student.nis,
      nisn: student.nisn,
      gradeLevel: student.gradeLevel,
      className: student.className,
      gender: student.gender,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentRelation: student.parentRelation,
      rfidCardUid: student.rfidCardUid || '',
      faceEnrolled: student.faceEnrolled,
      avatarUrl: student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: student.isActive,
    });
    setStudentModalMode('EDIT');
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.fullName.trim()) return;

    if (studentModalMode === 'ADD') {
      const newStudent: Student = {
        id: `std_${Date.now()}`,
        nis: studentForm.nis,
        nisn: studentForm.nisn,
        fullName: studentForm.fullName.trim(),
        gradeLevel: studentForm.gradeLevel,
        classId: classes.find((c) => c.className === studentForm.className)?.id || 'cls_custom',
        className: studentForm.className,
        gender: studentForm.gender,
        parentName: studentForm.parentName || 'Orang Tua / Wali Murid',
        parentPhone: studentForm.parentPhone,
        parentRelation: studentForm.parentRelation,
        rfidCardUid: studentForm.rfidCardUid.trim() || undefined,
        faceEnrolled: studentForm.faceEnrolled,
        avatarUrl: studentForm.avatarUrl,
        isActive: studentForm.isActive,
      };

      onAddStudent(newStudent);
      pushAuditLog('TAMBAH_SISWA', newStudent.fullName, `Menambahkan siswa baru jenjang ${newStudent.gradeLevel} kelas ${newStudent.className}`);
      soundEffects.playSuccessBeep();
    } else if (studentModalMode === 'EDIT' && selectedStudent) {
      const updatedStudent: Student = {
        ...selectedStudent,
        fullName: studentForm.fullName.trim(),
        nis: studentForm.nis,
        nisn: studentForm.nisn,
        gradeLevel: studentForm.gradeLevel,
        className: studentForm.className,
        gender: studentForm.gender,
        parentName: studentForm.parentName,
        parentPhone: studentForm.parentPhone,
        parentRelation: studentForm.parentRelation,
        rfidCardUid: studentForm.rfidCardUid.trim() || undefined,
        faceEnrolled: studentForm.faceEnrolled,
        avatarUrl: studentForm.avatarUrl,
        isActive: studentForm.isActive,
      };

      onUpdateStudent(updatedStudent);
      pushAuditLog('EDIT_SISWA', updatedStudent.fullName, `Memperbarui data profil, kelas, nomor WA orang tua, atau kartu RFID`);
      soundEffects.playSuccessBeep();
    }

    setStudentModalMode(null);
  };

  const handleConfirmDeleteStudent = (student: Student) => {
    setDeleteConfirm({
      type: 'STUDENT',
      id: student.id,
      name: student.fullName,
      extraInfo: `NIS: ${student.nis} • Kelas: ${student.className} (${student.gradeLevel})`,
    });
  };

  // ==========================================
  // HANDLERS UNTUK GURU
  // ==========================================
  const handleOpenAddTeacher = () => {
    const randomNip = `1985${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
    setTeacherForm({
      fullName: '',
      nip: randomNip,
      subject: 'Guru Mata Pelajaran',
      phone: '0813',
      email: '',
      rfidCardUid: `RFID-GUR-${Math.floor(10000 + Math.random() * 90000)}`,
      faceEnrolled: true,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });
    setSelectedTeacher(null);
    setTeacherModalMode('ADD');
  };

  const handleOpenEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTeacherForm({
      fullName: teacher.fullName,
      nip: teacher.nip,
      subject: teacher.subject,
      phone: teacher.phone,
      email: `${teacher.nip}@sekolah.sch.id`,
      rfidCardUid: teacher.rfidCardUid || '',
      faceEnrolled: teacher.faceEnrolled,
      isActive: teacher.isActive,
      avatarUrl: teacher.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });
    setTeacherModalMode('EDIT');
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.fullName.trim()) return;

    if (teacherModalMode === 'ADD') {
      const newTeacher: Teacher = {
        id: `tch_${Date.now()}`,
        userId: `usr_${Date.now()}`,
        nip: teacherForm.nip,
        fullName: teacherForm.fullName.trim(),
        subject: teacherForm.subject.trim(),
        phone: teacherForm.phone,
        rfidCardUid: teacherForm.rfidCardUid.trim() || undefined,
        faceEnrolled: teacherForm.faceEnrolled,
        avatarUrl: teacherForm.avatarUrl,
        isActive: teacherForm.isActive,
      };

      onAddTeacher(newTeacher);
      pushAuditLog('TAMBAH_GURU', newTeacher.fullName, `Menambahkan guru baru pengampu ${newTeacher.subject} (NIP: ${newTeacher.nip})`);
      soundEffects.playSuccessBeep();
    } else if (teacherModalMode === 'EDIT' && selectedTeacher) {
      const updatedTeacher: Teacher = {
        ...selectedTeacher,
        fullName: teacherForm.fullName.trim(),
        nip: teacherForm.nip,
        subject: teacherForm.subject.trim(),
        phone: teacherForm.phone,
        rfidCardUid: teacherForm.rfidCardUid.trim() || undefined,
        faceEnrolled: teacherForm.faceEnrolled,
        avatarUrl: teacherForm.avatarUrl,
        isActive: teacherForm.isActive,
      };

      onUpdateTeacher(updatedTeacher);
      pushAuditLog('EDIT_GURU', updatedTeacher.fullName, `Memperbarui profil guru, tugas mengajar, atau mapping kartu RFID`);
      soundEffects.playSuccessBeep();
    }

    setTeacherModalMode(null);
  };

  const handleConfirmDeleteTeacher = (teacher: Teacher) => {
    setDeleteConfirm({
      type: 'TEACHER',
      id: teacher.id,
      name: teacher.fullName,
      extraInfo: `NIP: ${teacher.nip} • Bidang: ${teacher.subject}`,
    });
  };

  // ==========================================
  // HANDLERS UNTUK KELAS
  // ==========================================
  const handleOpenAddClass = () => {
    setClassForm({
      className: '',
      gradeLevel: 'SMA',
      academicYear: '2026/2027',
      homeroomTeacherId: teachers[0]?.id || '',
    });
    setSelectedClass(null);
    setClassModalMode('ADD');
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setSelectedClass(cls);
    setClassForm({
      className: cls.className,
      gradeLevel: cls.gradeLevel,
      academicYear: cls.academicYear,
      homeroomTeacherId: cls.homeroomTeacherId,
    });
    setClassModalMode('EDIT');
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.className.trim()) return;

    const teacher = teachers.find((t) => t.id === classForm.homeroomTeacherId);
    const homeroomName = teacher ? teacher.fullName : 'Belum Ditunjuk';

    if (classModalMode === 'ADD') {
      const newClass: ClassRoom = {
        id: `cls_${Date.now()}`,
        gradeLevel: classForm.gradeLevel,
        className: classForm.className.trim(),
        academicYear: classForm.academicYear,
        homeroomTeacherId: classForm.homeroomTeacherId,
        homeroomTeacherName: homeroomName,
        totalStudents: 0,
      };
      onAddClass(newClass);
      pushAuditLog('TAMBAH_KELAS', newClass.className, `Membuat rombel kelas baru jenjang ${newClass.gradeLevel}`);
      soundEffects.playSuccessBeep();
    } else if (classModalMode === 'EDIT' && selectedClass) {
      const updatedClass: ClassRoom = {
        ...selectedClass,
        className: classForm.className.trim(),
        gradeLevel: classForm.gradeLevel,
        academicYear: classForm.academicYear,
        homeroomTeacherId: classForm.homeroomTeacherId,
        homeroomTeacherName: homeroomName,
      };
      onUpdateClass(updatedClass);
      pushAuditLog('EDIT_KELAS', updatedClass.className, `Memperbarui nama kelas atau wali kelas`);
      soundEffects.playSuccessBeep();
    }
    setClassModalMode(null);
  };

  // ==========================================
  // HANDLERS UNTUK AKUN PENGGUNA
  // ==========================================
  const handleOpenAddUser = () => {
    setUserForm({
      username: '',
      fullName: '',
      email: '',
      phone: '0812',
      role: 'GURU',
    });
    setSelectedUser(null);
    setUserModalMode('ADD');
  };

  const handleOpenEditUser = (u: User) => {
    setSelectedUser(u);
    setUserForm({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
    });
    setUserModalMode('EDIT');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.fullName.trim()) return;

    if (userModalMode === 'ADD') {
      const newUser: User = {
        id: `usr_${Date.now()}`,
        username: userForm.username.trim().toLowerCase(),
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        role: userForm.role,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
      onAddUser(newUser);
      pushAuditLog('TAMBAH_USER', newUser.fullName, `Membuat akun pengguna baru dengan role ${newUser.role}`);
      soundEffects.playSuccessBeep();
    } else if (userModalMode === 'EDIT' && selectedUser) {
      const updatedUser: User = {
        ...selectedUser,
        username: userForm.username.trim().toLowerCase(),
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        role: userForm.role,
      };
      onUpdateUser(updatedUser);
      pushAuditLog('EDIT_USER', updatedUser.fullName, `Mengubah data akun atau hak akses peran`);
      soundEffects.playSuccessBeep();
    }
    setUserModalMode(null);
  };

  // ==========================================
  // EKSEKUSI HAPUS PERMANEN
  // ==========================================
  const executeDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'STUDENT') {
      onDeleteStudent(deleteConfirm.id);
      pushAuditLog('HAPUS_SISWA', deleteConfirm.name, `Menghapus data siswa permanen dari basis data.`);
    } else if (deleteConfirm.type === 'TEACHER') {
      onDeleteTeacher(deleteConfirm.id);
      pushAuditLog('HAPUS_GURU', deleteConfirm.name, `Menghapus data guru permanen dari basis data.`);
    } else if (deleteConfirm.type === 'CLASS') {
      onDeleteClass(deleteConfirm.id);
      pushAuditLog('HAPUS_KELAS', deleteConfirm.name, `Menghapus kelas / rombel.`);
    } else if (deleteConfirm.type === 'USER') {
      onDeleteUser(deleteConfirm.id);
      pushAuditLog('HAPUS_USER', deleteConfirm.name, `Menghapus akun pengguna dari sistem.`);
    }

    soundEffects.playErrorBeep();
    setDeleteConfirm(null);
  };

  // Filtering Siswa
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery) ||
      s.nisn.includes(searchQuery) ||
      (s.rfidCardUid && s.rfidCardUid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.parentPhone.includes(searchQuery);
    const matchesGrade = gradeFilter === 'ALL' || s.gradeLevel === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // Filtering Guru
  const filteredTeachers = teachers.filter((t) => {
    return (
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.includes(searchQuery) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.rfidCardUid && t.rfidCardUid.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Super Admin Badge & Access Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-rose-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-rose-500/20 text-rose-300 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Akses Otoritas Tertinggi: Super Admin
              </span>
              <span className="text-slate-400 text-xs font-medium">
                Masuk sebagai: <strong>{currentSuperAdmin.fullName}</strong>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Portal Manajemen Master Data & Hak Akses Penuh
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Anda memiliki kewenangan penuh untuk <strong>menambahkan</strong>, <strong>mengubah (edit)</strong>, dan{' '}
              <strong>menghapus</strong> data anak/siswa, guru pendidik, kelas rombel, serta akun hak akses seluruh jenjang sekolah.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-lg font-black text-white">{students.length}</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Total Siswa</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-lg font-black text-white">{teachers.length}</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Total Guru</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-lg font-black text-white">{classes.length}</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Total Kelas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-lg font-black text-white">{users.length}</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Total Akun</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigasi Super Admin */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10">
          <button
            id="super-tab-students"
            onClick={() => {
              setActiveTab('STUDENTS');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'STUDENTS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Nama Anak / Siswa ({students.length})
          </button>

          <button
            id="super-tab-teachers"
            onClick={() => {
              setActiveTab('TEACHERS');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'TEACHERS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Guru & Pendidik ({teachers.length})
          </button>

          <button
            id="super-tab-classes"
            onClick={() => {
              setActiveTab('CLASSES');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'CLASSES'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <School className="w-4 h-4" />
            Kelas & Rombel ({classes.length})
          </button>

          <button
            id="super-tab-users"
            onClick={() => {
              setActiveTab('USERS');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'USERS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Akun & Hak Akses ({users.length})
          </button>

          <button
            id="super-tab-audit"
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'AUDIT'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Log Aktivitas Super Admin ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: MANAJEMEN SISWA (NAMA ANAK) */}
      {/* ========================================================================= */}
      {activeTab === 'STUDENTS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          {/* Action Toolbar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-rose-600" />
                Data Siswa Terdaftar (Preschool s/d SMA)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola nama anak, kelas, NIS/NISN, nomor WhatsApp orang tua untuk notifikasi, dan mapping kartu RFID.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                id="btn-tambah-siswa-super"
                onClick={handleOpenAddStudent}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-rose-200"
              >
                <Plus className="w-4 h-4" />
                Tambah Siswa Baru
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                id="search-input-students"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama anak, NIS, UID RFID, atau nomor HP orang tua..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <span className="text-[10px] text-slate-500 px-2 font-bold uppercase">Jenjang:</span>
              {['ALL', 'PRESCHOOL', 'SD', 'SMP', 'SMA'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGradeFilter(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${
                    gradeFilter === g ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {g === 'ALL' ? 'Semua' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Table Siswa */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nama Lengkap Anak</th>
                  <th className="py-3.5 px-4">NIS / NISN</th>
                  <th className="py-3.5 px-4">Jenjang & Kelas</th>
                  <th className="py-3.5 px-4">Wali Murid & WhatsApp</th>
                  <th className="py-3.5 px-4">Kartu RFID</th>
                  <th className="py-3.5 px-4">Face ID</th>
                  <th className="py-3.5 px-4 text-center">Aksi Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={std.avatarUrl}
                            alt={std.fullName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {std.fullName}
                              {!std.isActive && (
                                <span className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                  Non-Aktif
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Gender: {std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        <div>{std.nis}</div>
                        <div className="text-[10px] text-slate-400">NISN: {std.nisn}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{std.className}</div>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
                          {std.gradeLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{std.parentName}</div>
                        <div className="font-mono text-emerald-700 text-[11px] font-bold">
                          {std.parentPhone}
                        </div>
                        <span className="text-[10px] text-slate-400">{std.parentRelation}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {std.rfidCardUid ? (
                          <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {std.rfidCardUid}
                          </span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[10px]">
                            Belum Ada Kartu
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {std.faceEnrolled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Terdaftar
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Belum Enrol
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-edit-student-${std.id}`}
                            onClick={() => handleOpenEditStudent(std)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-transparent hover:border-indigo-100"
                            title="Edit Data Siswa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-student-${std.id}`}
                            onClick={() => handleConfirmDeleteStudent(std)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-100"
                            title="Hapus Siswa Permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Tidak ditemukan data siswa dengan kriteria pencarian tersebut.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: MANAJEMEN GURU */}
      {/* ========================================================================= */}
      {activeTab === 'TEACHERS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                Data Tenaga Pendidik & Guru Sekolah
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data guru pengampu, NIP, nomor HP untuk presensi mobile HP guru, dan mapping kartu fisik RFID.
              </p>
            </div>

            <button
              id="btn-tambah-guru-super"
              onClick={handleOpenAddTeacher}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-rose-200"
            >
              <Plus className="w-4 h-4" />
              Tambah Guru Baru
            </button>
          </div>

          {/* Search Guru */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama guru, NIP, atau mata pelajaran..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Table Guru */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nama Lengkap & NIP</th>
                  <th className="py-3.5 px-4">Mata Pelajaran / Tugas</th>
                  <th className="py-3.5 px-4">Nomor HP / WhatsApp</th>
                  <th className="py-3.5 px-4">UID Kartu RFID</th>
                  <th className="py-3.5 px-4">Status Presensi Mobile</th>
                  <th className="py-3.5 px-4 text-center">Aksi Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTeachers.map((tch) => (
                  <tr key={tch.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={tch.avatarUrl}
                          alt={tch.fullName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{tch.fullName}</div>
                          <div className="font-mono text-[10px] text-slate-400">NIP: {tch.nip}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{tch.subject}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{tch.phone}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {tch.rfidCardUid ? (
                        <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {tch.rfidCardUid}
                        </span>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                          Belum Dimapping
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Face ID Siap
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-edit-teacher-${tch.id}`}
                          onClick={() => handleOpenEditTeacher(tch)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Data Guru"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-teacher-${tch.id}`}
                          onClick={() => handleConfirmDeleteTeacher(tch)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Guru Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: MANAJEMEN KELAS & ROMBEL */}
      {/* ========================================================================= */}
      {activeTab === 'CLASSES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-rose-600" />
                Data Rombongan Belajar (Kelas)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola penamaan kelas tiap jenjang, tahun ajaran aktif, dan penugasan wali kelas.
              </p>
            </div>

            <button
              onClick={handleOpenAddClass}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-rose-200"
            >
              <Plus className="w-4 h-4" />
              Tambah Kelas Baru
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const studentsInClass = students.filter((s) => s.className === cls.className).length;
              return (
                <div key={cls.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-100">
                        {cls.gradeLevel}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{cls.academicYear}</span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900">{cls.className}</h4>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Wali Kelas:</span>{' '}
                        <strong className="text-slate-800">{cls.homeroomTeacherName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Jumlah Siswa:</span>{' '}
                        <strong className="text-indigo-700 font-mono font-bold">
                          {studentsInClass} Siswa
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      Ubah Kelas
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'CLASS',
                          id: cls.id,
                          name: cls.className,
                          extraInfo: `Jenjang: ${cls.gradeLevel} • ${studentsInClass} siswa terdaftar`,
                        })
                      }
                      className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: MANAJEMEN AKUN & PENGGUNA */}
      {/* ========================================================================= */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-rose-600" />
                Manajemen Akun Pengguna & Hak Akses Sistem
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi akun login untuk Super Admin, Admin IT, Guru, Kepala Sekolah, dan Waka.
              </p>
            </div>

            <button
              onClick={handleOpenAddUser}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-rose-200"
            >
              <Plus className="w-4 h-4" />
              Tambah Akun Baru
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Nama Pengguna</th>
                  <th className="py-3.5 px-4">Username Login</th>
                  <th className="py-3.5 px-4">Peran (Role)</th>
                  <th className="py-3.5 px-4">Email & No Telp</th>
                  <th className="py-3.5 px-4 text-center">Aksi Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700">{u.username}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : u.role === 'ADMIN_IT'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : u.role === 'GURU'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>{u.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Akun"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'USER',
                                id: u.id,
                                name: u.fullName,
                                extraInfo: `Role: ${u.role} • Username: ${u.username}`,
                              })
                            }
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: AUDIT LOG AKTIVITAS */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-rose-600" />
              Audit Trail & Rekam Jejak Modifikasi Super Admin
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap aksi penambahan, perubahan, dan penghapusan data terekam secara otomatis untuk kepatuhan regulasi keamanan dan privasi.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                    <span className="font-extrabold text-slate-800">{log.targetName}</span>
                  </div>
                  <p className="text-slate-600 text-xs pl-0">{log.details}</p>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Success
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM SISWA (TAMBAH / EDIT) */}
      {/* ========================================================================= */}
      {studentModalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-rose-600" />
                {studentModalMode === 'ADD' ? 'Tambah Nama Anak / Siswa Baru' : 'Edit Data Anak / Siswa'}
              </h3>
              <button
                onClick={() => setStudentModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Lengkap Anak / Murid: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-student-fullname"
                    type="text"
                    required
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    placeholder="Contoh: Muhammad Alvaro Gunawan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Jenjang */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenjang Sekolah:</label>
                  <select
                    value={studentForm.gradeLevel}
                    onChange={(e) => {
                      const newG = e.target.value as GradeLevel;
                      const defaultClass = classes.find((c) => c.gradeLevel === newG)?.className || '';
                      setStudentForm({ ...studentForm, gradeLevel: newG, className: defaultClass });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="PRESCHOOL">Preschool (Playgroup / TK)</option>
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                  </select>
                </div>

                {/* Nama Kelas */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kelas / Rombel:</label>
                  <input
                    type="text"
                    value={studentForm.className}
                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                    placeholder="Contoh: 11 SMA MIPA Unggulan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>

                {/* NIS & NISN */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Induk Siswa (NIS):</label>
                  <input
                    type="text"
                    required
                    value={studentForm.nis}
                    onChange={(e) => setStudentForm({ ...studentForm, nis: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NISN Nasional:</label>
                  <input
                    type="text"
                    value={studentForm.nisn}
                    onChange={(e) => setStudentForm({ ...studentForm, nisn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Kelamin:</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                {/* UID Kartu RFID */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UID Kartu RFID Fisik:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={studentForm.rfidCardUid}
                      onChange={(e) => setStudentForm({ ...studentForm, rfidCardUid: e.target.value })}
                      placeholder="Tempel kartu di reader atau ketik UID..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-2.5 py-2.5 text-xs font-mono font-bold text-indigo-700"
                    />
                    <Radio className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 top-3" />
                  </div>
                </div>

                {/* Hubungan & Nama Orang Tua */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Orang Tua / Wali:</label>
                  <input
                    type="text"
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    placeholder="Contoh: Bpk. Hendra Gunawan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>

                {/* Nomor WhatsApp Wali */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    No. WhatsApp Orang Tua (Untuk Notifikasi):
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    placeholder="081288990011"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                {/* Status Face ID & Status Siswa */}
                <div className="flex items-center gap-4 sm:col-span-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentForm.faceEnrolled}
                      onChange={(e) => setStudentForm({ ...studentForm, faceEnrolled: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Wajah Terdaftar di Sistem Face ID
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentForm.isActive}
                      onChange={(e) => setStudentForm({ ...studentForm, isActive: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Status Siswa Aktif</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStudentModalMode(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {studentModalMode === 'ADD' ? 'Simpan Siswa Baru' : 'Simpan Perubahan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM GURU (TAMBAH / EDIT) */}
      {/* ========================================================================= */}
      {teacherModalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                {teacherModalMode === 'ADD' ? 'Tambah Guru / Tenaga Pendidik Baru' : 'Edit Profil Guru'}
              </h3>
              <button onClick={() => setTeacherModalMode(null)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Lengkap Guru & Gelar: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.fullName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                    placeholder="Contoh: Budi Santoso, S.Pd"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIP / Nomor Pegawai:</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.nip}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mata Pelajaran / Tugas:</label>
                  <input
                    type="text"
                    value={teacherForm.subject}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                    placeholder="Fisika, Matematika, BK..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor HP / WhatsApp Guru:</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">UID Kartu RFID Guru:</label>
                  <input
                    type="text"
                    value={teacherForm.rfidCardUid}
                    onChange={(e) => setTeacherForm({ ...teacherForm, rfidCardUid: e.target.value })}
                    placeholder="RFID-GUR-XXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-indigo-700"
                  />
                </div>

                <div className="flex items-center gap-4 sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teacherForm.faceEnrolled}
                      onChange={(e) => setTeacherForm({ ...teacherForm, faceEnrolled: e.target.checked })}
                      className="rounded text-rose-600 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Aktifkan Fitur Presensi Face ID Mobile HP
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTeacherModalMode(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {teacherModalMode === 'ADD' ? 'Simpan Guru Baru' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM KELAS */}
      {/* ========================================================================= */}
      {classModalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-rose-600" />
              {classModalMode === 'ADD' ? 'Tambah Rombel Kelas Baru' : 'Edit Data Kelas'}
            </h3>
            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kelas:</label>
                <input
                  type="text"
                  required
                  value={classForm.className}
                  onChange={(e) => setClassForm({ ...classForm, className: e.target.value })}
                  placeholder="Contoh: 10 SMA MIPA Unggulan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenjang:</label>
                <select
                  value={classForm.gradeLevel}
                  onChange={(e) => setClassForm({ ...classForm, gradeLevel: e.target.value as GradeLevel })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option value="PRESCHOOL">Preschool</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tahun Ajaran:</label>
                <input
                  type="text"
                  value={classForm.academicYear}
                  onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Wali Kelas:</label>
                <select
                  value={classForm.homeroomTeacherId}
                  onChange={(e) => setClassForm({ ...classForm, homeroomTeacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setClassModalMode(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM USER & HAK AKSES */}
      {/* ========================================================================= */}
      {userModalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-rose-600" />
              {userModalMode === 'ADD' ? 'Tambah Akun Pengguna Baru' : 'Edit Akun Pengguna'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Username Login:</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Peran (Role):</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-rose-700"
                >
                  <option value="SUPER_ADMIN">Super Admin (Akses Tertinggi)</option>
                  <option value="ADMIN_IT">Admin IT</option>
                  <option value="GURU">Guru / Pendidik</option>
                  <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
                  <option value="WAKA">Waka Kurikulum / Kesiswaan</option>
                  <option value="ORANG_TUA">Orang Tua / Wali Murid</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email:</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setUserModalMode(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS DATA PERMANEN */}
      {/* ========================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                Konfirmasi Hapus Data Permanen
              </h4>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus data{' '}
                <strong>
                  {deleteConfirm.type === 'STUDENT'
                    ? 'Siswa'
                    : deleteConfirm.type === 'TEACHER'
                    ? 'Guru'
                    : deleteConfirm.type === 'CLASS'
                    ? 'Kelas'
                    : 'Pengguna'}
                </strong>{' '}
                berikut?
              </p>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center space-y-1">
              <div className="text-sm font-extrabold text-rose-950">{deleteConfirm.name}</div>
              {deleteConfirm.extraInfo && (
                <div className="text-[11px] text-rose-700 font-medium">{deleteConfirm.extraInfo}</div>
              )}
            </div>

            <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-center font-medium">
              ⚠️ Perhatian: Tindakan ini tidak dapat dibatalkan. Riwayat presensi terkait mungkin akan terpengaruh.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                id="btn-cancel-delete"
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex-1"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={executeDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex-1 shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
