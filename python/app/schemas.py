"""
schemas.py
Pydantic Schemas untuk validasi request dan response API FastAPI.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


# ============================================
# RFID Scan Request Schema
# ============================================
class RFIDTapRequest(BaseModel):
    card_uid: str = Field(..., example="A1-B2-C3-D4", description="UID unik dari kartu RFID 13.56MHz atau 125KHz")
    pos_location: str = Field(default="Gerbang Utama (Gate A)", example="Gerbang Utama (Gate A)")
    device_id: str = Field(default="RFID-GATE-01", example="RFID-GATE-01")
    timestamp: Optional[datetime] = None


class RFIDTapResponse(BaseModel):
    success: bool
    status: str  # ON_TIME, LATE, UNREGISTERED
    entity_type: str  # STUDENT, TEACHER, UNKNOWN
    name: str
    identifier: str  # NISN atau NIP
    class_or_subject: str
    tap_time: str
    late_minutes: int = 0
    message: str
    whatsapp_notified: bool = False


# ============================================
# Face ID Attendance Request Schema
# ============================================
class FaceAttendanceRequest(BaseModel):
    teacher_or_student_id: str = Field(..., example="TCH001")
    image_base64: str = Field(..., description="Foto wajah hasil capture kamera untuk verifikasi liveness & embedding")
    latitude: float = Field(..., example=-6.2088)
    longitude: float = Field(..., example=106.8456)
    device_info: Optional[str] = Field(default="Android App v2.1")


class FaceAttendanceResponse(BaseModel):
    success: bool
    status: str
    similarity_score: float
    name: str
    distance_to_school_meters: float
    is_inside_geofence: bool
    message: str


# ============================================
# CRUD Student Schema
# ============================================
class StudentCreateSchema(BaseModel):
    id: Optional[str] = None
    nisn: str
    full_name: str
    grade_level: str  # Preschool, SD, SMP, SMA
    class_name: str
    rfid_card_uid: Optional[str] = None
    parent_name: str
    parent_phone: str
    has_face_id: bool = False


class StudentResponseSchema(StudentCreateSchema):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# WhatsApp Dispatch Schema
# ============================================
class WhatsAppSendRequest(BaseModel):
    student_id: str
    template_code: str = "TPL_IN_ONTIME"
    custom_message: Optional[str] = None
