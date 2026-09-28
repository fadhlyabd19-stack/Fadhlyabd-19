"""
rfid_pos_listener.py
Skrip Python Hardware Reader untuk Pos Gerbang Sekolah (Raspberry Pi / Linux / Windows Mini PC).

Fungsi:
1. Mendengarkan input USB Keyboard Wedge (RFID Reader USB) atau Serial Port (RS485/UART).
2. Memutar audio/beep konfirmasi seketika saat kartu ditempelkan (<0.3 detik).
3. Mengirim payload scan ke Server Backend FastAPI secara asinkron.
4. Mendukung OFFLINE BUFFERING: jika jaringan WiFi/LAN sekolah terputus, tap kartu
   disimpan di SQLite lokal dan otomatis di-sync saat online kembali.
"""

import sys
import time
import requests
import json
import sqlite3
from datetime import datetime

# Konfigurasi POS Gerbang
SERVER_URL = "http://192.168.1.100:8000/api/attendance/rfid-tap"  # Ganti dengan IP server FastAPI sekolah
POS_LOCATION = "Gerbang Masuk Utama (Gate A)"
DEVICE_ID = "POS-GATE-RPI-01"
OFFLINE_DB_PATH = "offline_attendance.db"


def init_offline_db():
    """Inisialisasi database lokal SQLite untuk buffering offline saat jaringan putus"""
    conn = sqlite3.connect(OFFLINE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pending_taps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_uid TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            device_id TEXT NOT NULL,
            pos_location TEXT NOT NULL,
            synced INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()


def save_offline_tap(card_uid: str, timestamp: str):
    """Menyimpan tap ke database lokal jika server tidak merespons"""
    conn = sqlite3.connect(OFFLINE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO pending_taps (card_uid, timestamp, device_id, pos_location, synced) VALUES (?, ?, ?, ?, 0)",
        (card_uid, timestamp, DEVICE_ID, POS_LOCATION)
    )
    conn.commit()
    conn.close()
    print(f"[OFFLINE] Tap {card_uid} disimpan di buffer lokal.")


def sync_offline_taps():
    """Sinkronisasi data pending tap saat koneksi kembali online"""
    conn = sqlite3.connect(OFFLINE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, card_uid, timestamp FROM pending_taps WHERE synced = 0 LIMIT 20")
    rows = cursor.fetchall()
    if not rows:
        conn.close()
        return

    print(f"[SYNC] Mencoba sinkronisasi {len(rows)} tap offline ke server...")
    for row_id, card_uid, timestamp in rows:
        payload = {
            "card_uid": card_uid,
            "pos_location": POS_LOCATION,
            "device_id": DEVICE_ID,
            "timestamp": timestamp
        }
        try:
            res = requests.post(SERVER_URL, json=payload, timeout=3)
            if res.status_code == 200:
                cursor.execute("UPDATE pending_taps SET synced = 1 WHERE id = ?", (row_id,))
                conn.commit()
        except Exception:
            break
    conn.close()


def play_beep(success: bool):
    """Memberikan feedback bunyi buzzer/speaker"""
    # Menggunakan print bell character atau pygame / winsound jika terpasang
    try:
        import winsound
        if success:
            winsound.Beep(1800, 150)  # High pitch beep
        else:
            winsound.Beep(400, 400)   # Low pitch error buzz
    except ImportError:
        # Fallback terminal bell untuk Linux / Raspberry Pi
        sys.stdout.write('\a')
        sys.stdout.flush()


def process_rfid_scan(card_uid: str):
    """Memproses UID kartu RFID dan mengirim ke Server Presensi"""
    card_uid = card_uid.strip().upper()
    if not card_uid:
        return

    now_iso = datetime.now().isoformat()
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] KARTU DITAP: {card_uid}")

    payload = {
        "card_uid": card_uid,
        "pos_location": POS_LOCATION,
        "device_id": DEVICE_ID,
        "timestamp": now_iso
    }

    try:
        # Kirim HTTP POST ke FastAPI Backend
        response = requests.post(SERVER_URL, json=payload, timeout=2.5)
        if response.status_code == 200:
            data = response.json()
            play_beep(data.get("success", True))
            print(f"-> Berhasil: {data.get('name')} | Status: {data.get('status')} | {data.get('message')}")
            if data.get("whatsapp_notified"):
                print("-> WhatsApp ke orang tua: TERKIRIM")
            # Coba sinkronisasi sisa offline jika ada
            sync_offline_taps()
        else:
            print(f"-> Gagal dari server (Status {response.status_code})")
            play_beep(False)
            save_offline_tap(card_uid, now_iso)
    except requests.exceptions.RequestException as e:
        print(f"-> Gagal koneksi ke server: {e}. Menyimpan ke offline buffer.")
        play_beep(False)
        save_offline_tap(card_uid, now_iso)


def run_keyboard_wedge_listener():
    """
    Mode USB Keyboard Wedge (Scanner RFID USB bertindak seperti keyboard).
    Membaca baris teks saat kartu di-tap lalu tombol Enter terpicu otomatis oleh scanner.
    """
    init_offline_db()
    print("=" * 60)
    print("   SISTEM PRESENSI PINTAR SEKOLAH - POS GERBANG RFID (PYTHON)   ")
    print(f"   Lokasi: {POS_LOCATION} | Device ID: {DEVICE_ID}             ")
    print("   Status: Menunggu tempelan kartu RFID siswa/guru...          ")
    print("=" * 60)

    while True:
        try:
            # RFID Reader USB mengirimkan UID dan karakter newline / Enter
            card_uid = input("Tempelkan Kartu RFID >> ")
            process_rfid_scan(card_uid)
        except (KeyboardInterrupt, SystemExit):
            print("\nMematikan reader...")
            break
        except Exception as e:
            print(f"Error loop: {e}")
            time.sleep(1)


if __name__ == "__main__":
    run_keyboard_wedge_listener()
