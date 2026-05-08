import { ALL_DTMF_FREQS, freqToBin } from '../dtmf/frequencies';
import { FFT_SIZE } from '../audio/analyser';

const BG = '#0a0a0f';
const BAR_COLOR = '#1e3a5f';
const DTMF_COLOR = '#00d9ff';
const DTMF_ACTIVE_COLOR = '#ff00ff';
const LABEL_COLOR = '#00d9ff';

export const drawSpectrum = (
  ctx: CanvasRenderingContext2D,
  fftData: Float32Array,
  sampleRate: number,
  width: number,
  height: number,
  activeFreqs: Set<number>,
) => {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  const binCount = fftData.length;
  // Only render 0–4kHz range (all DTMF freqs fit here)
  const maxFreq = 4000;
  const maxBin = freqToBin(maxFreq, sampleRate, FFT_SIZE);
  const visibleBins = Math.min(binCount, maxBin);
  const barWidth = width / visibleBins;

  const dtmfBins = new Set(ALL_DTMF_FREQS.map((f) => freqToBin(f, sampleRate, FFT_SIZE)));

  for (let i = 0; i < visibleBins; i++) {
    const db = fftData[i] ?? -100;
    // Normalize: typical range -100 to 0 dB
    const norm = Math.max(0, Math.min(1, (db + 100) / 100));
    const barH = norm * height;

    const isDtmf = dtmfBins.has(i);
    const freq = Math.round((i * sampleRate) / FFT_SIZE);
    const isActive = activeFreqs.has(freq);

    if (isDtmf) {
      ctx.fillStyle = isActive ? DTMF_ACTIVE_COLOR : DTMF_COLOR;
    } else {
      ctx.fillStyle = BAR_COLOR;
    }

    ctx.fillRect(i * barWidth, height - barH, Math.max(1, barWidth - 0.5), barH);
  }

  // Draw DTMF freq labels
  ctx.fillStyle = LABEL_COLOR;
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const labelPositions: Array<{ freq: number; x: number }> = [];
  const drawnLabels: Array<{ x: number; width: number }> = [];

  // Collect label positions
  for (const freq of ALL_DTMF_FREQS) {
    const bin = freqToBin(freq, sampleRate, FFT_SIZE);
    const x = (bin / visibleBins) * width;
    labelPositions.push({ freq, x });
  }

  // Draw labels with collision avoidance
  const labelHeight = 10;
  const minSpacing = 35; // Minimum pixel spacing between labels

  for (const { freq, x } of labelPositions) {
    const metrics = ctx.measureText(`${freq}`);
    const labelWidth = metrics.width;
    const labelLeft = x - labelWidth / 2;
    const labelRight = x + labelWidth / 2;

    // Check if this label would collide with already drawn labels
    const hasCollision = drawnLabels.some(
      (drawn) => !(labelRight + 2 < drawn.x || labelLeft - 2 > drawn.x + drawn.width),
    );

    if (!hasCollision) {
      ctx.fillText(`${freq}`, x, height - labelHeight);
      drawnLabels.push({ x: labelLeft, width: labelWidth });
    }
  }
};
