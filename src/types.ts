// src/types.ts
// Definisi tipe data sistem absensi sekolah RFID & Face ID

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_IT' | 'GURU' | 'KEPALA_SEKOLAH' | 'WAKA' | 'ORANG_TUA';

export type GradeLevel = 'PRESCHOOL' | 'SD' | 'SMP' | 'SMA';

export type AttendanceMethod = 'RFID' | 'FACE_ID' | 'MANUAL';

export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'EARLY_DEPARTURE' | 'ABSENT';

export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  phone: string;
  avatarUrl?: string;
}

export interface Teacher {
  id: string;
  userId: string;
  nip: string;
  fullName: string;
  subject: string;
  phone: string;
  rfidCardUid?: string;
  faceEnrolled: boolean;
  faceEmbeddingVector?: number[];
  avatarUrl?: string;
  isActive: boolean;
}

export interface ClassRoom {
  id: string;
  gradeLevel: GradeLevel;
  className: string;
  academicYear: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  totalStudents: number;
}

export interface ParentContact {
  id: string;
  studentId: string;
  parentName: string;
  relationType: 'AYAH' | 'IBU' | 'WALI';
  whatsappNumber: string;
  isPrimary: boolean;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  fullName: string;
  gradeLevel: GradeLevel;
  classId: string;
  className: string;
  gender: 'L' | 'P';
  parentName: string;
  parentPhone: string;
  parentRelation: 'AYAH' | 'IBU' | 'WALI';
  rfidCardUid?: string;
  faceEnrolled: boolean;
  avatarUrl?: string;
  isActive: boolean;
}

export interface Schedule {
  id: string;
  gradeLevel: GradeLevel;
  dayOfWeek: number; // 1 = Senin, 5 = Jumat
  dayName: string;
  checkInStart: string; // '06:30'
  checkInEnd: string; // '07:15'
  lateThreshold: string; // '07:15'
  checkOutStart: string; // '14:30'
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  entityType: 'STUDENT' | 'TEACHER';
  entityId: string;
  entityName: string;
  gradeLevel?: GradeLevel;
  className?: string;
  timestamp: string; // ISO string
  timeStr: string; // '07:05:22'
  dateStr: string; // '2026-09-17'
  type: AttendanceType;
  method: AttendanceMethod;
  posLocation: string; // misal 'Gerbang Utama (Gate 1)', 'Lobi SD', 'Mobile App'
  status: AttendanceStatus;
  lateMinutes: number;
  confidenceScore?: number; // untuk Face ID (e.g. 0.96)
  distanceMeters?: number; // dari radius GPS sekolah
  rawRfidUid?: string;
  waDeliveryStatus: 'NOT_REQUIRED' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  waDeliveryId?: string;
  parentPhone?: string;
}

export interface WhatsAppMessageTemplate {
  id: string;
  templateCode: string;
  title: string;
  contentTemplate: string;
  description: string;
  samplePreview: string;
  isActive: boolean;
}

export interface WhatsAppDeliveryLog {
  id: string;
  attendanceId: string;
  studentId: string;
  studentName: string;
  recipientPhone: string;
  recipientName: string;
  templateCode: string;
  messageText: string;
  provider: 'META_CLOUD_API' | 'FONNTE' | 'WABLAS' | 'QONTAK';
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  timestamp: string;
  errorReason?: string;
}

export interface SystemNotification {
  id: string;
  targetRole: UserRole | 'ALL';
  title: string;
  message: string;
  type: 'LATE_ALERT' | 'ABSENT_ALERT' | 'DEVICE_OFFLINE' | 'SYSTEM_INFO';
  isRead: boolean;
  createdAt: string;
}

export interface SchoolGeofence {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}
