// src/components/HeaderNav.tsx
// Header navigasi, jam real-time, status device RFID, dan pemilih role pengguna

import React, { useState, useEffect } from 'react';
import {
  School,
  Clock,
  Radio,
  MapPin,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Smartphone,
  LayoutDashboard,
  Database,
  BookOpen,
  ChevronDown,
  Sparkles,
  Code2,
} from 'lucide-react';
import { UserRole, User } from '../types';

interface HeaderNavProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  rfidConnected: boolean;
  waQueueCount: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  activeTab,
  onTabChange,
  rfidConnected,
  waQueueCount,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const rolesList: { role: UserRole; label: string; desc: string; badgeColor: string }[] = [
    {
      role: 'SUPER_ADMIN',
      label: 'Super Admin',
      desc: 'Akses Otoritas Penuh: Tambah, Edit, & Hapus Siswa, Guru, Kelas, & Akun',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      role: 'ADMIN_IT',
      label: 'Admin IT',
      desc: 'Kelola Master Data, Device, Log, & Template WA',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      role: 'GURU',
      label: 'Guru / Pendidik',
      desc: 'Presensi Face ID Mobile HP & Riwayat Pribadi',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      role: 'KEPALA_SEKOLAH',
      label: 'Kepala Sekolah',
      desc: 'Executive Summary Rekap Kehadiran Guru & Siswa',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      role: 'WAKA',
      label: 'Waka Kurikulum / Kesiswaan',
      desc: 'Pantau Kedisiplinan & Notifikasi Keterlambatan',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      role: 'ORANG_TUA',
      label: 'Orang Tua / Wali Murid',
      desc: 'Menerima Laporan Real-time WA & Status Ananda',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
  ];

  const tabs = [
    { id: 'super-admin', label: 'Portal Super Admin', icon: ShieldCheck, forRoles: ['SUPER_ADMIN', 'ADMIN_IT'] },
    { id: 'rfid-pos', label: 'Pos RFID (Gerbang)', icon: Radio, forRoles: ['SUPER_ADMIN', 'ADMIN_IT', 'KEPALA_SEKOLAH', 'WAKA'] },
    { id: 'face-id', label: 'Face ID Mobile (HP Guru)', icon: Smartphone, forRoles: ['SUPER_ADMIN', 'ADMIN_IT', 'GURU'] },
    { id: 'dashboard', label: 'Dashboard & Rekap', icon: LayoutDashboard, forRoles: ['SUPER_ADMIN', 'ADMIN_IT', 'KEPALA_SEKOLAH', 'WAKA', 'GURU'] },
    { id: 'whatsapp', label: 'Notifikasi WhatsApp', icon: MessageSquare, forRoles: ['SUPER_ADMIN', 'ADMIN_IT', 'KEPALA_SEKOLAH', 'WAKA', 'ORANG_TUA'], count: waQueueCount },
    { id: 'master-data', label: 'Master Data', icon: Database, forRoles: ['SUPER_ADMIN', 'ADMIN_IT'] },
    { id: 'python-hub', label: 'Script & Backend Python', icon: Code2, forRoles: ['SUPER_ADMIN', 'ADMIN_IT', 'KEPALA_SEKOLAH', 'WAKA', 'GURU', 'ORANG_TUA'] },
    { id: 'architecture', label: 'Arsitektur & Panduan IT', icon: BookOpen, forRoles: ['SUPER_ADMIN', 'ADMIN_IT', 'KEPALA_SEKOLAH', 'WAKA', 'GURU', 'ORANG_TUA'] },
  ];

  const currentRoleInfo = rolesList.find((r) => r.role === currentRole) || rolesList[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sistem Aktif (Preschool – SMA)
          </span>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${rfidConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
            RFID Reader Pos 1: {rfidConnected ? 'USB-HID Siap' : 'Mencari Device...'}
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            Geofence GPS: 150m Aktif
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-200 font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{timeStr || '07:00:00'}</span>
            <span className="hidden md:inline text-slate-400">({dateStr})</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & School Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Sistem Presensi Pintar
              </h1>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
                RFID & Face ID
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Preschool • SD • SMP • SMA Terpadu
            </p>
          </div>
        </div>

        {/* User Role Switcher */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{currentUser.fullName}</div>
              <div className="text-[11px] text-slate-500">{currentUser.email}</div>
            </div>
            <button
              id="btn-role-switcher"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition bg-white shadow-xs"
              title="Ganti Peran Pengguna untuk Pengujian"
            >
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${currentRoleInfo.badgeColor}`}>
                {currentRoleInfo.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Role Dropdown */}
          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Role untuk Simulasi Pengujian:
              </div>
              {rolesList.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    onRoleChange(item.role);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-slate-50 transition ${
                    currentRole === item.role ? 'bg-indigo-50/70' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    {item.role === 'ADMIN_IT' && <ShieldCheck className="w-4 h-4 text-purple-600" />}
                    {item.role === 'GURU' && <UserCheck className="w-4 h-4 text-emerald-600" />}
                    {item.role === 'KEPALA_SEKOLAH' && <School className="w-4 h-4 text-blue-600" />}
                    {item.role === 'WAKA' && <Sparkles className="w-4 h-4 text-amber-600" />}
                    {item.role === 'ORANG_TUA' && <MessageSquare className="w-4 h-4 text-rose-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{item.label}</span>
                      {currentRole === item.role && (
                        <span className="text-[10px] text-indigo-600 font-semibold">Aktif</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-100 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isAllowed = tab.forRoles.includes(currentRole);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isAllowed
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 opacity-75'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {!isAllowed && (
                  <span className="text-[9px] bg-slate-100 text-slate-400 px-1 rounded">Preview</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
