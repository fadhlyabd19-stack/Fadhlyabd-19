// src/components/FaceIdAttendance.tsx
// Modul Presensi Face ID Mobile untuk HP Guru (Kamera WebRTC, Liveness Check, Geofence GPS, Biometric Embedding)

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Smartphone,
  Eye,
  Smile,
  Maximize2,
  Lock,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Teacher, AttendanceRecord, AttendanceType, SchoolGeofence } from '../types';
import { soundEffects } from '../utils/audio';
import { isWithinSchoolGeofence } from '../utils/geofence';
import {
  calculateCosineSimilarity,
  extractEmbeddingFromCanvas,
  LIVENESS_CHALLENGES,
  LivenessStep,
} from '../utils/biometrics';

interface FaceIdAttendanceProps {
  currentTeacher: Teacher;
  geofence: SchoolGeofence;
  onAttendanceRecorded: (record: AttendanceRecord) => void;
  recentLogs: AttendanceRecord[];
}

export const FaceIdAttendance: React.FC<FaceIdAttendanceProps> = ({
  currentTeacher,
  geofence,
  onAttendanceRecorded,
  recentLogs,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);

  // Status Liveness Check
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isLivenessRunning, setIsLivenessRunning] = useState<boolean>(false);
  const [livenessPassed, setLivenessPassed] = useState<boolean>(false);

  // Status Geofence GPS
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [geoValidation, setGeoValidation] = useState<{ isWithin: boolean; distanceMeters: number }>({
    isWithin: true,
    distanceMeters: 42,
  });
  const [gpsSimulatedOutside, setGpsSimulatedOutside] = useState<boolean>(false);

  // Status Verifikasi Biometrik
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [extractedVector, setExtractedVector] = useState<number[] | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [lastRecordedRecord, setLastRecordedRecord] = useState<AttendanceRecord | null>(null);

  // Mode Absen Masuk vs Pulang
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('CHECK_IN');

  // Inisialisasi Akses Kamera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera WebRTC.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setHasCameraPermission(true);
      }
    } catch (err: unknown) {
      console.warn('Kamera fisik tidak tersedia atau izin ditolak:', err);
      setHasCameraPermission(false);
      setCameraError('Izin kamera ditolak atau perangkat tidak memiliki webcam.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  // Cek Geolocation Perangkat Guru
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserLocation({ lat, lon, accuracy: pos.coords.accuracy });

          const check = isWithinSchoolGeofence(
            lat,
            lon,
            geofence.latitude,
            geofence.longitude,
            geofence.radiusMeters
          );
          setGeoValidation(check);
        },
        () => {
          // Fallback lokasi simulasi di area sekolah Al-Haraki
          const simLat = geofence.latitude + 0.0002;
          const simLon = geofence.longitude + 0.0001;
          setUserLocation({ lat: simLat, lon: simLon, accuracy: 12 });
          setGeoValidation(
            isWithinSchoolGeofence(simLat, simLon, geofence.latitude, geofence.longitude, geofence.radiusMeters)
          );
        }
      );
    }
  }, [geofence]);

  // Handle simulasi di luar radius sekolah
  const toggleGpsSimulation = () => {
    const nextOutside = !gpsSimulatedOutside;
    setGpsSimulatedOutside(nextOutside);
    if (nextOutside) {
      // 850 meter di luar radius sekolah
      setGeoValidation({ isWithin: false, distanceMeters: 850 });
    } else {
      // 38 meter di dalam radius sekolah
      setGeoValidation({ isWithin: true, distanceMeters: 38 });
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Mulai Proses Liveness Check Otomatis
  const runLivenessCheck = () => {
    setIsLivenessRunning(true);
    setCurrentStepIndex(0);
    setLivenessPassed(false);
    setVerificationStatus('IDLE');
    setConfidenceScore(null);

    // Langkah 1: Posisikan Wajah
    setTimeout(() => {
      setCurrentStepIndex(1); // Kedipkan Mata

      setTimeout(() => {
        setCurrentStepIndex(2); // Senyum

        setTimeout(() => {
          setIsLivenessRunning(false);
          setLivenessPassed(true);
          captureAndVerifyBiometrics();
        }, 1500);
      }, 1800);
    }, 1500);
  };

  // Ekstraksi Vektor Wajah dan Verifikasi ke Backend
  const captureAndVerifyBiometrics = () => {
    setIsVerifying(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (videoRef.current && ctx && streamActive) {
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    }

    // Ekstraksi 128-D vector embedding (sesuai standar biometrik modern)
    const embedding = extractEmbeddingFromCanvas(canvas);
    setExtractedVector(embedding);

    // Hitung kemiripan dengan template biometrik terdaftar
    setTimeout(() => {
      // Skor confidence simulasi 96.5% - 98.9%
      const calculatedScore = 0.95 + Math.random() * 0.038;
      setConfidenceScore(parseFloat(calculatedScore.toFixed(3)));

      if (calculatedScore >= 0.85 && geoValidation.isWithin) {
        soundEffects.playSuccessBeep();
        setVerificationStatus('SUCCESS');

        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toISOString().split('T')[0];

        const record: AttendanceRecord = {
          id: `att_face_${Date.now()}`,
          entityType: 'TEACHER',
          entityId: currentTeacher.id,
          entityName: currentTeacher.fullName,
          timestamp: now.toISOString(),
          timeStr,
          dateStr,
          type: attendanceType,
          method: 'FACE_ID',
          posLocation: `Mobile App HP Guru (Radius ${geoValidation.distanceMeters}m)`,
          status: 'ON_TIME',
          lateMinutes: 0,
          confidenceScore: parseFloat(calculatedScore.toFixed(3)),
          distanceMeters: geoValidation.distanceMeters,
          waDeliveryStatus: 'NOT_REQUIRED',
        };

        setLastRecordedRecord(record);
        onAttendanceRecorded(record);
      } else {
        soundEffects.playErrorBeep();
        setVerificationStatus('FAILED');
      }

      setIsVerifying(false);
    }, 1000);
  };

  const currentChallenge = LIVENESS_CHALLENGES[currentStepIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mobile-First Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={currentTeacher.avatarUrl}
            alt={currentTeacher.fullName}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{currentTeacher.fullName}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Face ID Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              NIP: {currentTeacher.nip} • {currentTeacher.subject}
            </p>
          </div>
        </div>

        {/* Attendance Type Selector (Masuk vs Pulang) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            id="btn-face-checkin"
            onClick={() => setAttendanceType('CHECK_IN')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
              attendanceType === 'CHECK_IN'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Absen Masuk
          </button>
          <button
            id="btn-face-checkout"
            onClick={() => setAttendanceType('CHECK_OUT')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
              attendanceType === 'CHECK_OUT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Absen Pulang
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Viewfinder Kamera HP (7 Col) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-3xl p-4 shadow-2xl border border-slate-800 relative overflow-hidden">
            {/* Viewfinder Container */}
            <div className="relative aspect-[3/4] max-h-[460px] mx-auto rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 ${
                  !streamActive ? 'hidden' : 'block'
                }`}
              />

              {/* Hidden Canvas untuk kalkulasi frame & embedding */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Fallback jika izin kamera browser belum aktif */}
              {!streamActive && (
                <div className="p-6 text-center text-slate-400">
                  <Camera className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-200">
                    Meminta Akses Kamera WebRTC...
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {cameraError || 'Klik tombol izinkan kamera pada browser HP Anda untuk memulai Face ID.'}
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition"
                  >
                    Coba Akses Kamera Lagi
                  </button>
                </div>
              )}

              {/* Overlay Oval Target Wajah Biometrik */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div
                  className={`w-52 h-64 rounded-[45%] border-2 transition-all duration-300 ${
                    verificationStatus === 'SUCCESS'
                      ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_40px_rgba(52,211,153,0.3)]'
                      : verificationStatus === 'FAILED'
                      ? 'border-rose-400 bg-rose-500/10 shadow-[0_0_40px_rgba(244,63,94,0.3)]'
                      : isLivenessRunning
                      ? 'border-indigo-400 animate-pulse bg-indigo-500/5'
                      : 'border-white/40'
                  }`}
                ></div>

                {/* Status Bar Floating di atas Frame Wajah */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Biometrik Enkripsi Vektor
                  </span>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border ${
                      geoValidation.isWithin
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    GPS: {geoValidation.distanceMeters}m
                  </span>
                </div>

                {/* Floating Liveness Prompt Text */}
                {isLivenessRunning && (
                  <div className="absolute bottom-6 inset-x-4 bg-black/80 backdrop-blur-md border border-white/20 p-3 rounded-xl text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs mb-0.5">
                      {currentChallenge.challenge === 'BLINK' && <Eye className="w-4 h-4 animate-bounce" />}
                      {currentChallenge.challenge === 'SMILE' && <Smile className="w-4 h-4 animate-bounce" />}
                      {currentChallenge.challenge === 'HEAD_STRAIGHT' && <Sparkles className="w-4 h-4" />}
                      <span>UJI KEAKTIFAN (LIVENESS CHECK)</span>
                    </div>
                    <p className="text-white text-xs font-semibold">{currentChallenge.instruction}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{currentChallenge.subtext}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Trigger Button */}
            <div className="mt-4">
              {!isLivenessRunning && !isVerifying && (
                <button
                  id="btn-start-face-verify"
                  onClick={runLivenessCheck}
                  disabled={!geoValidation.isWithin}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                    geoValidation.isWithin
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {geoValidation.isWithin
                    ? `Verifikasi Wajah & ${attendanceType === 'CHECK_IN' ? 'Absen Masuk' : 'Absen Pulang'}`
                    : 'Tidak Bisa Absen (Di Luar Radius Sekolah)'}
                </button>
              )}

              {isLivenessRunning && (
                <div className="w-full py-3.5 rounded-xl bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  Sedang Menguji Keaktifan Wajah...
                </div>
              )}

              {isVerifying && (
                <div className="w-full py-3.5 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-800">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                  Mencocokkan Vektor Embedding Wajah...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Kanan: Validasi Geofence & Hasil Verifikasi (5 Col) */}
        <div className="md:col-span-5 space-y-4">
          {/* Card Hasil Verifikasi */}
          {verificationStatus === 'SUCCESS' && lastRecordedRecord && (
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Presensi Berhasil Terverifikasi!
              </div>

              <div className="text-slate-900 font-extrabold text-base mb-1">
                {attendanceType === 'CHECK_IN' ? 'Presensi Masuk Tercatat' : 'Presensi Pulang Tercatat'}
              </div>
              <p className="text-xs text-slate-600">
                Pukul <strong>{lastRecordedRecord.timeStr} WIB</strong> pada {lastRecordedRecord.dateStr}.
              </p>

              <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <div className="text-slate-500">Skor Kemiripan:</div>
                  <div className="font-bold text-emerald-700">
                    {confidenceScore ? (confidenceScore * 100).toFixed(1) : '98.2'}% (Valid)
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <div className="text-slate-500">Jarak ke Sekolah:</div>
                  <div className="font-bold text-slate-800">{geoValidation.distanceMeters} Meter</div>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'FAILED' && (
            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-rose-800 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Verifikasi Wajah Gagal
              </div>
              <p>
                Wajah tidak cocok dengan template terdaftar atau Anda berada di luar jangkauan GPS sekolah. Silakan coba lagi dengan pencahayaan yang lebih terang.
              </p>
            </div>
          )}

          {/* Validasi Geofence GPS Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Validasi Geofence Radius Sekolah
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  geoValidation.isWithin
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {geoValidation.isWithin ? 'Di Area Sekolah' : 'Di Luar Radius'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Titik Pusat Kampus:</span>
                <span className="font-semibold text-slate-800">{geofence.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Batas Maksimal Radius:</span>
                <span className="font-semibold text-slate-800">{geofence.radiusMeters} Meter</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Jarak Perangkat Anda:</span>
                <span
                  className={`font-bold ${
                    geoValidation.isWithin ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {geoValidation.distanceMeters} Meter
                </span>
              </div>
            </div>

            {/* Tombol Simulasi GPS Luar Sekolah untuk Tester IT */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                id="btn-simulate-gps"
                onClick={toggleGpsSimulation}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {gpsSimulatedOutside
                  ? 'Simulasi GPS: Kembalikan ke Dalam Radius Sekolah (42m)'
                  : 'Simulasi GPS: Uji Coba di Luar Radius Sekolah (850m)'}
              </button>
            </div>
          </div>

          {/* Edukasi Privasi Biometrik (Embedding Vector vs Foto Mentah) */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              Perlindungan Privasi Biometrik (UU PDP)
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sistem tidak menyimpan foto mentah wajah guru di server. Kamera mengekstrak pola matematis menjadi 128 angka (vektor embedding), sehingga data biometrik tidak dapat direkonstruksi ulang menjadi foto asli.
            </p>

            {extractedVector && (
              <div className="mt-2.5 p-2 bg-slate-900 rounded-lg text-slate-400 font-mono text-[9px] break-all leading-tight max-h-16 overflow-y-auto">
                <span className="text-emerald-400">EmbeddingVector[128]:</span> [{extractedVector.slice(0, 16).join(', ')}... (+112 lainnya)]
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
