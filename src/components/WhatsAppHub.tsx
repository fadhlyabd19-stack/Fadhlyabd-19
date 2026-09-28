// src/components/WhatsAppHub.tsx
// Modul Integrasi WhatsApp: Queue Dispatcher, Template Editor, Log Pengiriman, Komparasi Provider (Meta vs Fonnte/Wablas)

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCheck,
  AlertCircle,
  Settings,
  Smartphone,
  RefreshCw,
  Edit3,
  Save,
  CheckCircle2,
  HelpCircle,
  Zap,
  ListOrdered,
} from 'lucide-react';
import { WhatsAppDeliveryLog, WhatsAppMessageTemplate, Student } from '../types';
import { soundEffects } from '../utils/audio';

interface WhatsAppHubProps {
  templates: WhatsAppMessageTemplate[];
  onUpdateTemplate: (updated: WhatsAppMessageTemplate) => void;
  deliveryLogs: WhatsAppDeliveryLog[];
  onTriggerManualNotification: (studentId: string, templateCode: string) => void;
  students: Student[];
}

export const WhatsAppHub: React.FC<WhatsAppHubProps> = ({
  templates,
  onUpdateTemplate,
  deliveryLogs,
  onTriggerManualNotification,
  students,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'QUEUE_LOGS' | 'TEMPLATES' | 'SIMULATOR' | 'COMPARISON'>('QUEUE_LOGS');

  // Editing Template State
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Simulator State
  const [simSelectedStudentId, setSimSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [simSelectedTemplateCode, setSimSelectedTemplateCode] = useState<string>('WA_SISWA_HADIR_TEPAT_WAKTU');

  const handleStartEdit = (tmpl: WhatsAppMessageTemplate) => {
    setEditingTemplateId(tmpl.id);
    setEditTitle(tmpl.title);
    setEditContent(tmpl.contentTemplate);
  };

  const handleSaveEdit = (tmplId: string) => {
    const original = templates.find((t) => t.id === tmplId);
    if (!original) return;

    const updated: WhatsAppMessageTemplate = {
      ...original,
      title: editTitle,
      contentTemplate: editContent,
    };
    onUpdateTemplate(updated);
    setEditingTemplateId(null);
    setSaveSuccessMsg(`Template "${updated.title}" berhasil diperbarui tanpa reload aplikasi!`);
    soundEffects.playSuccessBeep();
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Preview Render Pesan Dinamis untuk Simulator
  const selectedSimStudent = students.find((s) => s.id === simSelectedStudentId) || students[0];
  const selectedSimTemplate = templates.find((t) => t.templateCode === simSelectedTemplateCode) || templates[0];

  const generatePreviewMessage = () => {
    if (!selectedSimStudent || !selectedSimTemplate) return '';
    return selectedSimTemplate.contentTemplate
      .replace(/{{nama_wali}}/g, selectedSimStudent.parentName)
      .replace(/{{nama_siswa}}/g, selectedSimStudent.fullName)
      .replace(/{{kelas}}/g, selectedSimStudent.className)
      .replace(/{{nama_sekolah}}/g, 'Sekolah Al-Haraki Terpadu')
      .replace(/{{hari}}/g, 'Kamis')
      .replace(/{{tanggal}}/g, '17 September 2026')
      .replace(/{{jam_masuk}}/g, '06:38')
      .replace(/{{jam_pulang}}/g, '15:10')
      .replace(/{{jam_sekarang}}/g, '07:30')
      .replace(/{{batas_masuk}}/g, '07:00')
      .replace(/{{selisih_menit}}/g, '12')
      .replace(/{{metode}}/g, 'Tap Kartu RFID')
      .replace(/{{pos_lokasi}}/g, 'Gerbang Utama (Gate 1)');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Integrasi WhatsApp & Notifikasi Orang Tua
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Sistem pengiriman real-time setiap kali siswa tap RFID / Face ID, peringatan siswa belum hadir (15 menit pasca masuk), antrian retry otomatis, serta editor template dinamis.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('QUEUE_LOGS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'QUEUE_LOGS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Antrian & Log Pengiriman ({deliveryLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('TEMPLATES')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'TEMPLATES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Template Pesan Kustom
          </button>
          <button
            onClick={() => setActiveSubTab('SIMULATOR')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'SIMULATOR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preview HP Orang Tua
          </button>
          <button
            onClick={() => setActiveSubTab('COMPARISON')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'COMPARISON' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Komparasi Provider WA
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveSuccessMsg}
        </div>
      )}

      {/* TAB 1: ANTRIAN & LOG PENGIRIMAN */}
      {activeSubTab === 'QUEUE_LOGS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Pengiriman & Antrian Pesan WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Setiap pesan diantrekan dengan limit rate 15 pesan/detik untuk menghindari pemblokiran provider.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" />
                Meta Cloud API: Connected
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Nomor WhatsApp Wali</th>
                  <th className="py-3 px-4">Template Code</th>
                  <th className="py-3 px-4">Cuplikan Pesan</th>
                  <th className="py-3 px-4">Status & Retry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {deliveryLogs.length > 0 ? (
                  deliveryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.studentName}</td>
                      <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">
                        {log.recipientPhone}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Wali: {log.recipientName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-600">
                        {log.templateCode}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={log.messageText}>
                        {log.messageText.replace(/\n/g, ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : log.status === 'QUEUED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status === 'DELIVERED' && <CheckCheck className="w-3 h-3" />}
                          {log.status === 'QUEUED' && <Clock className="w-3 h-3" />}
                          {log.status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                          {log.status} ({log.attempts}/{log.maxAttempts})
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada notifikasi WhatsApp terkirim pada sesi ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE PESAN KUSTOM */}
      {activeSubTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              Editor Template Pesan WhatsApp Tanpa Koding
            </h4>
            <p>
              Admin IT sekolah dapat menyesuaikan redaksi pesan tanpa perlu mengubah source code aplikasi.
              Gunakan parameter dinamis berikut di dalam template:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[11px]">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{nama_wali}}'}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{nama_siswa}}'}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{kelas}}'}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{nama_sekolah}}'}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{jam_masuk}}'}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{batas_masuk}}'}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{selisih_menit}}'}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{metode}}'}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">{'{{pos_lokasi}}'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{tmpl.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">{tmpl.templateCode}</span>
                    </div>
                    {editingTemplateId !== tmpl.id && (
                      <button
                        onClick={() => handleStartEdit(tmpl)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Template
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-2 mb-3">{tmpl.description}</p>

                  {editingTemplateId === tmpl.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Judul Template:</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Isi Template (Format WA):</label>
                        <textarea
                          rows={6}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800 focus:bg-white"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingTemplateId(null)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveEdit(tmpl.id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Simpan Template
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {tmpl.contentTemplate}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SIMULATOR HP ORANG TUA */}
      {activeSubTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Form Kontrol Simulator (5 Col) */}
          <div className="md:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              Kontrol Uji Coba Pengiriman WA
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Siswa:</label>
              <select
                value={simSelectedStudentId}
                onChange={(e) => setSimSelectedStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
              >
                {students.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.fullName} ({std.gradeLevel} • {std.className})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Kasus Notifikasi:</label>
              <select
                value={simSelectedTemplateCode}
                onChange={(e) => setSimSelectedTemplateCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.templateCode}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900">
              <div className="font-bold">Nomor Tujuan:</div>
              <div className="font-mono text-emerald-800 mt-0.5">
                {selectedSimStudent?.parentPhone} (Wali: {selectedSimStudent?.parentName})
              </div>
            </div>

            <button
              onClick={() => {
                onTriggerManualNotification(selectedSimStudent.id, simSelectedTemplateCode);
                soundEffects.playSuccessBeep();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Notifikasi Simulasi ke Antrian
            </button>
          </div>

          {/* Smartphone Mockup Preview (7 Col) */}
          <div className="md:col-span-7 flex justify-center">
            <div className="w-full max-w-sm bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative">
              {/* Notch */}
              <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-2"></div>

              {/* WhatsApp App Mockup Screen */}
              <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden min-h-[480px] flex flex-col justify-between shadow-inner">
                {/* WA Top Bar */}
                <div className="bg-[#075E54] text-white p-3 flex items-center gap-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                    SP
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold leading-tight truncate">Sistem Presensi Sekolah</div>
                    <div className="text-[10px] text-emerald-200">Akun WhatsApp Bisnis Resmi</div>
                  </div>
                </div>

                {/* Chat Bubble Area */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  <div className="text-center">
                    <span className="text-[10px] bg-white/70 text-slate-600 px-2 py-0.5 rounded-md shadow-2xs">
                      HARI INI
                    </span>
                  </div>

                  {/* Bubble Message */}
                  <div className="bg-[#DCF8C6] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-xs max-w-[90%] ml-auto text-xs whitespace-pre-wrap leading-relaxed">
                    {generatePreviewMessage()}
                    <div className="text-right mt-1 text-[9px] text-slate-500 flex items-center justify-end gap-1">
                      <span>06:38</span>
                      <CheckCheck className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* WA Fake Input Bar */}
                <div className="bg-[#F0F2F5] p-2 flex items-center gap-2 border-t border-slate-200 text-slate-400 text-xs">
                  <div className="flex-1 bg-white rounded-full py-1.5 px-3 text-[11px]">
                    Ketik balasan untuk konfirmasi sakit/izin...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#00A884] text-white flex items-center justify-center">
                    <Send className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KOMPARASI PROVIDER WHATSAPP API */}
      {activeSubTab === 'COMPARISON' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Analisis Provider WhatsApp API untuk Lingkungan Sekolah Indonesia
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan Meta Cloud API resmi vs Gateway Pihak Ketiga (Fonnte, Wablas, Qontak) ditinjau dari biaya, stabilitas, dan regulasi.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Provider / Solusi</th>
                  <th className="py-3 px-4">Model Biaya</th>
                  <th className="py-3 px-4">Batas Kuota / Rate Limit</th>
                  <th className="py-3 px-4">Kemudahan Setup</th>
                  <th className="py-3 px-4">Risiko Pemblokiran (Banned)</th>
                  <th className="py-3 px-4">Rekomendasi untuk Sekolah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Meta Cloud API (Resmi)
                    <span className="block text-[10px] text-emerald-600 font-normal">Official WhatsApp BSP</span>
                  </td>
                  <td className="py-3.5 px-4">
                    Bayar per percakapan utility (~Rp 300 - 450 per session 24 jam). 1.000 percakapan service gratis tiap bulan.
                  </td>
                  <td className="py-3.5 px-4">Tingkat Tier: 1.000 s.d 100.000 user unik per 24 jam. Sangat tinggi.</td>
                  <td className="py-3.5 px-4">Sedang (Perlu verifikasi Business Manager & Kartu Kredit/Debit).</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">0% (Resmi dari Meta). Nomor aman 100%.</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      Sangat Direkomendasikan
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Fonnte (Indonesia)
                    <span className="block text-[10px] text-slate-500 font-normal">Multi-Device Web Gateway</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-indigo-700">
                    Langganan Flat: Rp 75.000 - Rp 150.000 / bulan (Unlimited pesan).
                  </td>
                  <td className="py-3.5 px-4">Tergantung paket (~10 - 20 pesan/menit agar tidak terdeteksi spam).</td>
                  <td className="py-3.5 px-4 text-emerald-700 font-semibold">Sangat Mudah (Cukup scan QR code nomor sekolah).</td>
                  <td className="py-3.5 px-4 text-amber-600 font-medium">
                    Kecil-Sedang (Aman jika jeda antrian 3-5 detik dijaga).
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      Paling Hemat untuk Budget IT Sekolah
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Wablas (Indonesia)
                    <span className="block text-[10px] text-slate-500 font-normal">WhatsApp Unofficial Gateway</span>
                  </td>
                  <td className="py-3.5 px-4">
                    Mulai Rp 100.000 - Rp 250.000 / bulan per device sender.
                  </td>
                  <td className="py-3.5 px-4">Kapasitas tinggi dengan auto reconnect session.</td>
                  <td className="py-3.5 px-4">Mudah (Scan QR WA Web).</td>
                  <td className="py-3.5 px-4 text-amber-600 font-medium">
                    Sedang jika mengirim broadcast ribuan tanpa jeda.
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">Bagus sebagai alternatif cadangan.</td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    Qontak by Mekari
                    <span className="block text-[10px] text-slate-500 font-normal">Official Omnichannel BSP</span>
                  </td>
                  <td className="py-3.5 px-4">
                    Paket Enterprise (Rp 1.000.000+ / bulan + biaya per pesan Meta).
                  </td>
                  <td className="py-3.5 px-4">Enterprise grade throughput.</td>
                  <td className="py-3.5 px-4">Butuh implementasi tim konsultan.</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">0% (Official Green Tick WhatsApp).</td>
                  <td className="py-3.5 px-4 text-slate-600">Kurang efisien untuk yayasan sekolah standar.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
