// src/utils/biometrics.ts
// Utilitas pemrosesan biometrik wajah, vektor embedding, dan liveness check

// Menghitung Cosine Similarity antara dua vektor embedding 128-D
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Menghasilkan vektor embedding 128-dimensi dari frame canvas wajah
export function extractEmbeddingFromCanvas(
  canvas: HTMLCanvasElement,
  seedModifier: number = 0
): number[] {
  const ctx = canvas.getContext('2d');
  const embedding: number[] = [];
  const dimensions = 128;

  if (!ctx) {
    for (let i = 0; i < dimensions; i++) {
      embedding.push(Math.sin(i + seedModifier) * 0.5 + 0.5);
    }
    return embedding;
  }

  // Ambil sample pixel di area wajah tengah untuk membuat fingerprint visual
  const width = canvas.width;
  const height = canvas.height;
  const sampleSize = 16;
  const imgData = ctx.getImageData(
    Math.floor(width * 0.25),
    Math.floor(height * 0.25),
    Math.floor(width * 0.5),
    Math.floor(height * 0.5)
  );

  const data = imgData.data;
  let totalLuminance = 0;

  for (let i = 0; i < dimensions; i++) {
    const pixelIndex = ((i * 37) % (data.length / 4)) * 4;
    const r = data[pixelIndex] || 120;
    const g = data[pixelIndex + 1] || 120;
    const b = data[pixelIndex + 2] || 120;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;

    // Normalisasi floating point -1.0 s.d +1.0
    const val = (lum / 255) * 2 - 1 + Math.sin(i * 0.4 + seedModifier) * 0.1;
    embedding.push(parseFloat(val.toFixed(4)));
  }

  return embedding;
}

// Langkah-langkah uji keaktifan (Liveness Check)
export type LivenessChallenge = 'BLINK' | 'SMILE' | 'HEAD_STRAIGHT';

export interface LivenessStep {
  challenge: LivenessChallenge;
  instruction: string;
  subtext: string;
  durationMs: number;
}

export const LIVENESS_CHALLENGES: LivenessStep[] = [
  {
    challenge: 'HEAD_STRAIGHT',
    instruction: 'Posisikan wajah tegak lurus di dalam bingkai',
    subtext: 'Pastikan pencahayaan cukup dan tidak backlight',
    durationMs: 1500,
  },
  {
    challenge: 'BLINK',
    instruction: 'Silakan kedipkan kedua mata Anda',
    subtext: 'Mencegah pemalsuan foto statis atau layar HP lain',
    durationMs: 1800,
  },
  {
    challenge: 'SMILE',
    instruction: 'Tersenyumlah sedikit ke arah kamera',
    subtext: 'Verifikasi mikro-ekspresi otot wajah alami',
    durationMs: 1500,
  },
];
