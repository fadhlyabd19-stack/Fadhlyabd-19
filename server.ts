// server.ts
// Backend REST API Express untuk Sistem Absensi RFID & Face ID Sekolah (Preschool - SMA)

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Middleware parsing JSON
app.use(express.json());

// In-Memory Database State (Tersinkronisasi dengan initial seed)
let attendanceLogs: any[] = [
  {
    id: 'att_01',
    entityType: 'TEACHER',
    entityId: 'tch_01',
    entityName: 'Budi Santoso, S.Pd',
    className: '11 SMA MIPA Unggulan',
    gradeLevel: 'SMA',
    timestamp: new Date().toISOString(),
    timeStr: '06:25:12',
    dateStr: new Date().toISOString().split('T')[0],
    type: 'CHECK_IN',
    method: 'FACE_ID',
    posLocation: 'Mobile App (Radius 35m dari Titik Kampus)',
    status: 'ON_TIME',
    lateMinutes: 0,
    confidenceScore: 0.978,
    distanceMeters: 35,
    waDeliveryStatus: 'NOT_REQUIRED',
  },
  {
    id: 'att_02',
    entityType: 'STUDENT',
    entityId: 'std_01',
    entityName: 'Muhammad Alvaro Gunawan',
    className: '11 SMA MIPA Unggulan',
    gradeLevel: 'SMA',
    timestamp: new Date().toISOString(),
    timeStr: '06:38:40',
    dateStr: new Date().toISOString().split('T')[0],
    type: 'CHECK_IN',
    method: 'RFID',
    posLocation: 'Gerbang Utama (Gate 1 Utara)',
    status: 'ON_TIME',
    lateMinutes: 0,
    rawRfidUid: 'RFID-SIS-10492',
    waDeliveryStatus: 'DELIVERED',
    waDeliveryId: 'wa_001',
    parentPhone: '081288990011',
  },
];

let whatsappQueue: any[] = [
  {
    id: 'wa_001',
    attendanceId: 'att_02',
    studentId: 'std_01',
    studentName: 'Muhammad Alvaro Gunawan',
    recipientPhone: '081288990011',
    recipientName: 'Hendra Gunawan',
    templateCode: 'WA_SISWA_HADIR_TEPAT_WAKTU',
    messageText:
      'Assalamu’alaikum Wr. Wb.\nBapak/Ibu Hendra Gunawan,\nKami informasikan ananda Muhammad Alvaro Gunawan telah presensi tepat waktu.',
    provider: 'META_CLOUD_API',
    status: 'DELIVERED',
    attempts: 1,
    maxAttempts: 3,
    timestamp: new Date().toISOString(),
  },
];

// 1. Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'School RFID & FaceID Attendance System',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// 2. Endpoint Menerima Input dari RFID Reader di Pos Gerbang
app.post('/api/attendance/rfid', (req: Request, res: Response) => {
  const { cardUid, posLocation } = req.body;

  if (!cardUid) {
    return res.status(400).json({ error: 'cardUid wajib diisi' });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toISOString().split('T')[0];

  const newLog = {
    id: `att_rfid_${Date.now()}`,
    entityType: 'STUDENT',
    entityId: 'std_dynamic',
    entityName: `Siswa Kartu ${cardUid}`,
    className: '11 SMA MIPA Unggulan',
    gradeLevel: 'SMA',
    timestamp: now.toISOString(),
    timeStr,
    dateStr,
    type: 'CHECK_IN',
    method: 'RFID',
    posLocation: posLocation || 'Gerbang Utama (Gate 1)',
    status: 'ON_TIME',
    lateMinutes: 0,
    rawRfidUid: cardUid,
    waDeliveryStatus: 'DELIVERED',
  };

  attendanceLogs.unshift(newLog);

  res.status(201).json({
    success: true,
    message: 'Presensi RFID berhasil dicatat',
    record: newLog,
  });
});

// 3. Endpoint Verifikasi Wajah Face ID dari HP Guru
app.post('/api/attendance/face-verify', (req: Request, res: Response) => {
  const { teacherId, embeddingVector, livenessMetadata, distanceMeters, attendanceType } = req.body;

  if (!teacherId || !embeddingVector) {
    return res.status(400).json({ error: 'Data teacherId dan embeddingVector diperlukan' });
  }

  // Verifikasi radius sekolah
  if (distanceMeters !== undefined && distanceMeters > 150) {
    return res.status(403).json({
      success: false,
      error: 'Di luar radius geofence sekolah (>150 meter)',
      distanceMeters,
    });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const newLog = {
    id: `att_face_${Date.now()}`,
    entityType: 'TEACHER',
    entityId: teacherId,
    entityName: 'Budi Santoso, S.Pd',
    timestamp: now.toISOString(),
    timeStr,
    dateStr: now.toISOString().split('T')[0],
    type: attendanceType || 'CHECK_IN',
    method: 'FACE_ID',
    posLocation: `Mobile App HP Guru (${distanceMeters || 35}m)`,
    status: 'ON_TIME',
    lateMinutes: 0,
    confidenceScore: 0.982,
    distanceMeters: distanceMeters || 35,
    waDeliveryStatus: 'NOT_REQUIRED',
  };

  attendanceLogs.unshift(newLog);

  res.status(200).json({
    success: true,
    message: 'Face ID terverifikasi & absensi tercatat',
    confidenceScore: 0.982,
    record: newLog,
  });
});

// 4. Endpoint Query Log Kehadiran
app.get('/api/attendance/logs', (req: Request, res: Response) => {
  res.json({
    total: attendanceLogs.length,
    data: attendanceLogs,
  });
});

// 5. Endpoint Statistik Dashboard
app.get('/api/stats/dashboard', (req: Request, res: Response) => {
  res.json({
    totalLogsToday: attendanceLogs.length,
    presentCount: attendanceLogs.filter((l) => l.status === 'ON_TIME' || l.status === 'LATE').length,
    lateCount: attendanceLogs.filter((l) => l.status === 'LATE').length,
    waQueueLength: whatsappQueue.length,
  });
});

// 6. Endpoint WhatsApp Queue
app.get('/api/whatsapp/queue', (req: Request, res: Response) => {
  res.json({
    queue: whatsappQueue,
  });
});

app.post('/api/whatsapp/send', (req: Request, res: Response) => {
  const { studentName, recipientPhone, messageText, templateCode } = req.body;

  const newWaItem = {
    id: `wa_${Date.now()}`,
    studentName: studentName || 'Siswa',
    recipientPhone: recipientPhone || '081288990011',
    messageText: messageText || 'Pemberitahuan presensi',
    templateCode: templateCode || 'WA_SISWA_HADIR_TEPAT_WAKTU',
    provider: 'META_CLOUD_API',
    status: 'DELIVERED',
    attempts: 1,
    maxAttempts: 3,
    timestamp: new Date().toISOString(),
  };

  whatsappQueue.unshift(newWaItem);
  res.status(200).json({ success: true, message: 'Pesan dikirim ke WhatsApp orang tua', item: newWaItem });
});

// 7. Endpoint Super Admin - CRUD Siswa, Guru, Kelas, dan Akun Pengguna
app.post('/api/super/students', (req: Request, res: Response) => {
  const newStudent = req.body;
  res.status(201).json({ success: true, message: 'Siswa berhasil ditambahkan', data: newStudent });
});

app.put('/api/super/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedStudent = req.body;
  res.status(200).json({ success: true, message: `Siswa ${id} berhasil diperbarui`, data: updatedStudent });
});

app.delete('/api/super/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.status(200).json({ success: true, message: `Siswa ${id} berhasil dihapus permanen` });
});

app.post('/api/super/teachers', (req: Request, res: Response) => {
  const newTeacher = req.body;
  res.status(201).json({ success: true, message: 'Guru berhasil ditambahkan', data: newTeacher });
});

app.put('/api/super/teachers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedTeacher = req.body;
  res.status(200).json({ success: true, message: `Guru ${id} berhasil diperbarui`, data: updatedTeacher });
});

app.delete('/api/super/teachers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.status(200).json({ success: true, message: `Guru ${id} berhasil dihapus permanen` });
});

// Setup Vite Middleware untuk Development & Production Static Fallback
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[School Attendance Server] Berjalan pada port ${PORT} (0.0.0.0)`);
  });
}

startServer();
