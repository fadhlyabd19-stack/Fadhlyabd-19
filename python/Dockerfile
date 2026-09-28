# =========================================================================
# DOCKERFILE PRODUKSI SEKOLAH: 100% PURE PYTHON RUNTIME (TANPA SERVER.TS)
# =========================================================================

# --- TAHAP 1: BUILD FRONTEND REACT (Hanya berjalan sekali saat build) ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# Hasil build disimpan di /app/dist

# --- TAHAP 2: CONTAINER PRODUKSI RUNTIME (MURNI PYTHON, TANPA NODE.JS) ---
FROM python:3.10-slim AS production

# Install dependensi sistem untuk OpenCV & hardware
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Salin dan install dependensi Python
COPY python/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Salin kode aplikasi Python
COPY python/app ./app

# Salin hasil build frontend dari Tahap 1 ke folder dist di Python
COPY --from=frontend-builder /app/dist ./dist

# Port aplikasi (FastAPI melayani API dan Frontend statis sekaligus)
EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Jalankan server murni Python Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
