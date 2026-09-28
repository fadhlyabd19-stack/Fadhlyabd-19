"""
models.py
Database Models untuk Sistem Presensi Sekolah Pintar menggunakan SQLAlchemy ORM.
Mendukung SQLite (untuk pengujian lokal/Raspberry Pi) dan PostgreSQL (untuk server produksi sekolah).
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class UserRoleEnum(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN_IT = "ADMIN_IT"
    KEPALA_SEKOLAH = "KEPALA_SEKOLAH"
    WAKA = "WAKA"
    GURU = "GURU"
    ORANG_TUA = "ORANG_TUA"


class AttendanceStatusEnum(str, Enum):
    ON_TIME = "ON_TIME"
    LATE = "LATE"
    PERMIT = "PERMIT"
    SICK = "SICK"
    ABSENT = "ABSENT"


class AttendanceMethodEnum(str, Enum):
    RFID = "RFID"
    FACE_ID = "FACE_ID"
    MANUAL = "MANUAL"


class StudentModel(Base):
    __tablename__ = "students"

    id = Column(String(50), primary_key=True, index=True)
    nisn = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    grade_level = Column(String(30), nullable=False)  # Preschool, SD, SMP, SMA
    class_name = Column(String(50), nullable=False, index=True)
    rfid_card_uid = Column(String(50), unique=True, index=True, nullable=True)
    parent_name = Column(String(100), nullable=False)
    parent_phone = Column(String(25), nullable=False)  # Format +628...
    has_face_id = Column(Boolean, default=False)
    face_embedding = Column(Text, nullable=True)  # JSON 128-dim vector
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi riwayat presensi
    attendances = relationship("AttendanceModel", back_populates="student")


class TeacherModel(Base):
    __tablename__ = "teachers"

    id = Column(String(50), primary_key=True, index=True)
    nip = Column(String(30), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    subject = Column(String(100), nullable=False)
    phone = Column(String(25), nullable=False)
    rfid_card_uid = Column(String(50), unique=True, index=True, nullable=True)
    face_embedding = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AttendanceModel(Base):
    __tablename__ = "attendances"

    id = Column(String(50), primary_key=True, index=True)
    entity_type = Column(String(20), nullable=False)  # STUDENT atau TEACHER
    entity_id = Column(String(50), ForeignKey("students.id"), nullable=True)
    entity_name = Column(String(100), nullable=False)
    method = Column(String(20), default="RFID")  # RFID atau FACE_ID
    pos_location = Column(String(100), nullable=False)  # Gerbang Utama, Kelas, dll
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(20), default="ON_TIME")  # ON_TIME, LATE, dll
    late_minutes = Column(Integer, default=0)
    device_id = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    photo_url = Column(String(255), nullable=True)

    student = relationship("StudentModel", back_populates="attendances")


class WhatsAppLogModel(Base):
    __tablename__ = "whatsapp_logs"

    id = Column(String(50), primary_key=True, index=True)
    attendance_id = Column(String(50), index=True, nullable=True)
    student_name = Column(String(100), nullable=False)
    recipient_phone = Column(String(25), nullable=False)
    recipient_name = Column(String(100), nullable=False)
    message_text = Column(Text, nullable=False)
    provider = Column(String(50), default="META_CLOUD_API")
    status = Column(String(20), default="QUEUED")  # QUEUED, DELIVERED, FAILED
    attempts = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow)
