import { FFT_SIZE, getOrCreateContext, getSampleRate, readFFT } from './audio/analyser';
import { createDetector, THRESHOLD_DB } from './dtmf/detector';
import { COL_FREQS, dbAtFreq, ROW_FREQS, DIGIT_FREQS } from './dtmf/frequencies';
import { wireControls } from './ui/controls';
import { setupCanvas } from './viz/canvas';
import { createKeypadState, drawKeypad, flashDigit, getDigitAtClick, type KeypadLayout } from './viz/keypad';
import { drawSpectrum } from './viz/spectrum';
import { createTickerState, drawTicker, pushEvent } from './viz/ticker';
import { playDTMFTone } from './audio/context';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx2d = setupCanvas(canvas);

const detector = createDetector();
const keypadState = createKeypadState();
const tickerState = createTickerState();

wireControls(tickerState, detector);

// Track keypad layout for click detection
let keypadLayout: KeypadLayout | null = null;

// Handle canvas clicks
canvas.addEventListener('click', async (e) => {
  if (!keypadLayout) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const digit = getDigitAtClick(keypadLayout, clickX, clickY);
  if (!digit) return;

  const nowMs = performance.now();
  const freqs = DIGIT_FREQS[digit];

  // Flash the digit
  flashDigit(keypadState, digit, nowMs);

  // Play the tone
  await playDTMFTone(digit, 200);

  // Create and push a detection event
  if (freqs) {
    pushEvent(tickerState, {
      digit,
      timestamp: nowMs,
      lowFreq: freqs.low,
      highFreq: freqs.high,
      confidence: 0.95,
    });
  }
});

const loop = () => {
  const nodes = getOrCreateContext();
  const fftData = readFFT(nodes);
  const sampleRate = getSampleRate(nodes);
  const nowMs = performance.now();

  const W = canvas.getBoundingClientRect().width;
  const H = canvas.getBoundingClientRect().height;

  // Layout constants - keypad on the side
  const KEYPAD_W = Math.min(W * 0.32, 240);
  const SPECTRUM_W = W - KEYPAD_W - 12;
  const VIZ_H = H * 0.75;
  const TICKER_H = 52;
  const TICKER_Y = H - TICKER_H - 10;

  // Store keypad layout for click detection
  keypadLayout = {
    x: SPECTRUM_W + 6,
    y: 0,
    width: KEYPAD_W,
    height: VIZ_H,
  };

  // Determine which DTMF freqs are currently active
  const activeFreqs = new Set<number>();
  for (const f of [...ROW_FREQS, ...COL_FREQS]) {
    if (dbAtFreq(fftData, f, sampleRate, FFT_SIZE) > THRESHOLD_DB) {
      activeFreqs.add(f);
    }
  }

  // Run detector
  const event = detector.detect(fftData, sampleRate, FFT_SIZE, nowMs);
  if (event) {
    flashDigit(keypadState, event.digit, nowMs);
    pushEvent(tickerState, event);
  }

  // Clear
  ctx2d.fillStyle = '#0a0a0f';
  ctx2d.fillRect(0, 0, W, H);

  // Draw spectrum (left side)
  drawSpectrum(ctx2d, fftData, sampleRate, SPECTRUM_W, VIZ_H, activeFreqs);

  // Draw keypad (right side)
  drawKeypad(ctx2d, keypadState, SPECTRUM_W + 6, 0, KEYPAD_W, VIZ_H, nowMs);

  // Draw ticker (bottom)
  drawTicker(ctx2d, tickerState, 10, TICKER_Y, W - 20, TICKER_H);

  requestAnimationFrame(loop);
};

loop();
