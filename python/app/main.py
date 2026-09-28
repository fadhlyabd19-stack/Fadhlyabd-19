"""
main.py
Server Utama Backend Sistem Presensi Pintar Sekolah Berbasis FastAPI (Python).

Fitur Utama:
1. Endpoint RFID Gerbang: Pencocokan UID kartu siswa/guru, cek jadwal toleransi keterlambatan,
   pencatatan otomatis ke database, dan pemicu notifikasi WhatsApp real-time ke orang tua.
2. Endpoint Face ID Guru: Verifikasi GPS Geofencing sekolah dan perbandingan biometrik wajah.
3. API Super Admin: CRUD Siswa, Guru, Kelas, dan Manajemen Kartu RFID.
4. Dokumentasi Otomatis Swagger UI di http://localhost:8000/docs.
"""

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import datetime, time
import os
import uvicorn
from typing import List, Optional

# Import Schemas & Helper
from schemas import (
    RFIDTapRequest,
    RFIDTapResponse,
    FaceAttendanceRequest,
    FaceAttendanceResponse,
    StudentCreateSchema,
    StudentResponseSchema,
)
from face_engine import is_within_school_geofence, compare_face_embeddings
from whatsapp_sender import wa_dispatcher

app = FastAPI(
    title="Sistem Presensi Sekolah Pintar (Python FastAPI)",
    description="Backend API resmi untuk Presensi Pos Gerbang RFID, Face ID Mobile Guru, dan WhatsApp Gateway Orang Tua.",
    version="1.0.0"
)

# Izinkan CORS untuk Frontend Web React dan Aplikasi Mobile Guru
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock in-memory database untuk demo & interoperabilitas instan
MOCK_STUDENTS = [
    {
        "id": "std_101",
        "nisn": "0089123401",
        "full_name": "Muhammad Al-Fatih",
        "grade_level": "SMA",
        "class_name": "12 MIPA 1",
        "rfid_card_uid": "A1-B2-C3-D4",
        "parent_name": "Ir. H. Syamsudin",
        "parent_phone": "+6281234567890",
        "has_face_id": True,
    },
    {
        "id": "std_102",
        "nisn": "0089123402",
        "full_name": "Aisyah Nur Ramadhani",
        "grade_level": "SMP",
        "class_name": "8 Tahfidz",
        "rfid_card_uid": "E5-F6-07-08",
        "parent_name": "Dra. Siti Aminah",
        "parent_phone": "+6281398765432",
        "has_face_id": True,
    },
    {
        "id": "std_103",
        "nisn": "0089123403",
        "full_name": "Kenzo Rafael Daniswara",
        "grade_level": "SD",
        "class_name": "Kelas 4 Bilal",
        "rfid_card_uid": "99-AA-BB-CC",
        "parent_name": "Dr. Budi Santoso, Sp.A",
        "parent_phone": "+6281122334455",
        "has_face_id": False,
    },
]

MOCK_TEACHERS = [
    {
        "id": "TCH001",
        "nip": "198805122014031001",
        "full_name": "Ust. Ahmad Fauzan, S.Pd.I",
        "subject": "Pendidikan Agama Islam & Tahsin",
        "phone": "+6281288990011",
        "rfid_card_uid": "TC-88-99-00",
        "face_embedding": [0.05] * 128,  # Dummy 128-d vector
    },
    {
        "id": "TCH002",
        "nip": "199103242018012002",
        "full_name": "Siti Rahmawati, M.Sc",
        "subject": "Fisika & Robotika",
        "phone": "+6281277665544",
        "rfid_card_uid": "TC-11-22-33",
        "face_embedding": [0.08] * 128,
    }
]

ATTENDANCE_LOGS = []


# ====================================================================
# 1. ENDPOINT KESEHATAN & STATUS SISTEM
# ====================================================================
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "FastAPI Attendance Engine",
        "timestamp": datetime.now().isoformat(),
        "registered_students": len(MOCK_STUDENTS),
        "registered_teachers": len(MOCK_TEACHERS),
        "total_attendances_today": len(ATTENDANCE_LOGS)
    }


# ====================================================================
# 2. ENDPOINT POS RFID GERBANG SEKOLAH (HARDWARE READER)
# ====================================================================
@app.post("/api/attendance/rfid-tap", response_model=RFIDTapResponse)
def handle_rfid_tap(payload: RFIDTapRequest):
    """
    Dipanggil otomatis oleh skrip Python di Raspberry Pi saat kartu RFID ditempelkan di gerbang.
    """
    card_uid = payload.card_uid.strip().upper()
    now = datetime.now()
    time_str = now.strftime("%H:%M")

    # 1. Cari apakah kartu milik Siswa
    matched_student = next((s for s in MOCK_STUDENTS if s.get("rfid_card_uid", "").upper() == card_uid), None)

    if matched_student:
        # Cek batas waktu masuk (misal jam masuk 07:00, toleransi s/d 07:15)
        cutoff_hour = 7
        cutoff_minute = 15
        current_time = now.time()

        is_late = current_time > time(cutoff_hour, cutoff_minute)
        late_minutes = 0
        if is_late:
            late_minutes = (current_time.hour - cutoff_hour) * 60 + (current_time.minute - cutoff_minute)

        status_str = "LATE" if is_late else "ON_TIME"
        msg_detail = f"Hadir Terlambat ({late_minutes} menit)" if is_late else "Hadir Tepat Waktu"

        # Simpan riwayat presensi
        record = {
            "id": f"att_{int(now.timestamp())}",
            "entity_type": "STUDENT",
            "entity_id": matched_student["id"],
            "entity_name": matched_student["full_name"],
            "method": "RFID",
            "pos_location": payload.pos_location,
            "timestamp": now.isoformat(),
            "status": status_str,
            "late_minutes": late_minutes,
            "device_id": payload.device_id
        }
        ATTENDANCE_LOGS.append(record)

        # Trigger Dispatch WhatsApp Otomatis ke Nomor Orang Tua
        wa_result = wa_dispatcher.dispatch(
            parent_phone=matched_student["parent_phone"],
            parent_name=matched_student["parent_name"],
            student_name=matched_student["full_name"],
            class_name=matched_student["class_name"],
            time_str=time_str,
            status=status_str,
            late_minutes=late_minutes
        )

        return RFIDTapResponse(
            success=True,
            status=status_str,
            entity_type="STUDENT",
            name=matched_student["full_name"],
            identifier=matched_student["nisn"],
            class_or_subject=matched_student["class_name"],
            tap_time=time_str,
            late_minutes=late_minutes,
            message=f"Selamat datang ananda {matched_student['full_name']}. {msg_detail}.",
            whatsapp_notified=wa_result.get("success", True)
        )

    # 2. Cari apakah kartu milik Guru
    matched_teacher = next((t for t in MOCK_TEACHERS if t.get("rfid_card_uid", "").upper() == card_uid), None)
    if matched_teacher:
        record = {
            "id": f"att_tch_{int(now.timestamp())}",
            "entity_type": "TEACHER",
            "entity_id": matched_teacher["id"],
            "entity_name": matched_teacher["full_name"],
            "method": "RFID",
            "pos_location": payload.pos_location,
            "timestamp": now.isoformat(),
            "status": "ON_TIME",
            "late_minutes": 0,
            "device_id": payload.device_id
        }
        ATTENDANCE_LOGS.append(record)

        return RFIDTapResponse(
            success=True,
            status="ON_TIME",
            entity_type="TEACHER",
            name=matched_teacher["full_name"],
            identifier=matched_teacher["nip"],
            class_or_subject=matched_teacher["subject"],
            tap_time=time_str,
            late_minutes=0,
            message=f"Selamat bertugas Bapak/Ibu {matched_teacher['full_name']}.",
            whatsapp_notified=False
        )

    # 3. Kartu Belum Terdaftar
    return RFIDTapResponse(
        success=False,
        status="UNREGISTERED",
        entity_type="UNKNOWN",
        name="Kartu Belum Terdaftar",
        identifier=card_uid,
        class_or_subject="-",
        tap_time=time_str,
        late_minutes=0,
        message=f"Kartu UID '{card_uid}' belum dipetakan ke siswa atau guru manapun.",
        whatsapp_notified=False
    )


# ====================================================================
# 3. ENDPOINT FACE ID MOBILE GURU (GPS GEOFENCE & BIOMETRIK)
# ====================================================================
@app.post("/api/attendance/face-id", response_model=FaceAttendanceResponse)
def handle_face_attendance(payload: FaceAttendanceRequest):
    """
    Dipanggil dari aplikasi smartphone guru: memvalidasi radius GPS sekolah dan biometrik wajah.
    """
    is_in_radius, distance = is_within_school_geofence(payload.latitude, payload.longitude)

    if not is_in_radius:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Presensi ditolak! Posisi Anda berada {distance} meter dari sekolah (Maksimal radius yang diizinkan 80 meter)."
        )

    teacher = next((t for t in MOCK_TEACHERS if t["id"] == payload.teacher_or_student_id), None)
    if not teacher:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    # Simulasi verifikasi biometrik dengan DeepFace / Cosine Similarity
    similarity_score = 0.965

    return FaceAttendanceResponse(
        success=True,
        status="ON_TIME",
        similarity_score=similarity_score,
        name=teacher["full_name"],
        distance_to_school_meters=distance,
        is_inside_geofence=True,
        message=f"Verifikasi Wajah Berhasil (Akurasi: {round(similarity_score * 100, 1)}%). Presensi tercatat."
    )


# ====================================================================
# 4. CRUD SISWA & GURU (SUPER ADMIN)
# ====================================================================
@app.get("/api/students", response_model=List[StudentResponseSchema])
def get_students(search: Optional[str] = None):
    if search:
        s = search.lower()
        return [item for item in MOCK_STUDENTS if s in item["full_name"].lower() or s in item["nisn"]]
    return MOCK_STUDENTS


@app.post("/api/students", response_model=StudentResponseSchema, status_code=status.HTTP_201_CREATED)
def create_student(student: StudentCreateSchema):
    new_student = student.dict()
    new_student["id"] = new_student.get("id") or f"std_{int(datetime.now().timestamp())}"
    MOCK_STUDENTS.append(new_student)
    return new_student


@app.delete("/api/students/{student_id}")
def delete_student(student_id: str):
    global MOCK_STUDENTS
    MOCK_STUDENTS = [s for s in MOCK_STUDENTS if s["id"] != student_id]
    return {"success": True, "message": f"Siswa {student_id} berhasil dihapus"}


# ====================================================================
# 5. MODE PURE PYTHON (TANPA SERVER.TS / NODE.JS SAAT RUNTIME)
# ====================================================================
# Mencari folder "dist" hasil build (npm run build).
# Jika folder "dist" ada, FastAPI melayani langsung seluruh UI Web React,
# aset JavaScript/CSS, serta SPA Client-Side Routing!
current_dir = os.path.dirname(os.path.abspath(__file__))
# Cek lokasi dist (baik di root proyek maupun di folder python)
possible_dist_paths = [
    os.path.join(current_dir, "..", "..", "dist"),
    os.path.join(current_dir, "..", "dist"),
    os.path.join(current_dir, "dist"),
]

dist_path = None
for p in possible_dist_paths:
    if os.path.exists(p) and os.path.isdir(p):
        dist_path = os.path.abspath(p)
        break

if dist_path:
    assets_dir = os.path.join(dist_path, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Abaikan route API
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Endpoint API tidak ditemukan")
        requested_file = os.path.join(dist_path, full_path)
        if os.path.exists(requested_file) and os.path.isfile(requested_file):
            return FileResponse(requested_file)
        return FileResponse(os.path.join(dist_path, "index.html"))


if __name__ == "__main__":
    print("Menjalankan Server Presensi Sekolah Pure Python (FastAPI) pada port 8000...")
    print("Dokumentasi API Swagger: http://localhost:8000/docs")
    if dist_path:
        print(f"Menyajikan Frontend UI Statis dari: {dist_path}")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
