import { FFT_SIZE, getContext, getSampleRate, readFFT } from './audio/analyser';
import { playDTMFTone } from './audio/context';
import { createDetector, THRESHOLD_DB } from './dtmf/detector';
import { COL_FREQS, DIGIT_FREQS, dbAtFreq, ROW_FREQS } from './dtmf/frequencies';
import type { DetectionEvent, DTMFDigit } from './dtmf/types';
import { wireControls } from './ui/controls';
import { wireKeyboard } from './ui/keyboard';
import { setupCanvas } from './viz/canvas';
import { createKeypadState, drawKeypad, flashDigit, getDigitAtClick, type KeypadLayout } from './viz/keypad';
import { drawSpectrum } from './viz/spectrum';
import { createTickerState, drawTicker, pushEvent } from './viz/ticker';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx2d = setupCanvas(canvas);

const detector = createDetector();
const keypadState = createKeypadState();
const tickerState = createTickerState();

interface Layout {
  canvasW: number;
  canvasH: number;
  spectrumW: number;
  keypadW: number;
  vizH: number;
  tickerH: number;
  tickerY: number;
  keypad: KeypadLayout;
}

const computeLayout = (): Layout => {
  const { width: canvasW, height: canvasH } = canvas.getBoundingClientRect();
  const keypadW = Math.min(canvasW * 0.32, 240);
  const spectrumW = canvasW - keypadW - 12;
  const vizH = canvasH * 0.75;
  const tickerH = 52;
  return {
    canvasW,
    canvasH,
    spectrumW,
    keypadW,
    vizH,
    tickerH,
    tickerY: canvasH - tickerH - 10,
    keypad: { x: spectrumW + 6, y: 0, width: keypadW, height: vizH },
  };
};

let layout: Layout = computeLayout();

window.addEventListener('resize', () => {
  layout = computeLayout();
});

const handleDigitInput = async (digit: DTMFDigit): Promise<void> => {
  const nowMs = performance.now();
  const freqs = DIGIT_FREQS[digit];
  if (!freqs) {
    return;
  }

  flashDigit(keypadState, digit, nowMs);
  await playDTMFTone(digit, 200);

  const event: DetectionEvent = {
    digit,
    timestamp: nowMs,
    lowFreq: freqs.low,
    highFreq: freqs.high,
    confidence: 0.95,
  };
  pushEvent(tickerState, event);
};

wireControls(tickerState, detector);
wireKeyboard(handleDigitInput);

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const digit = getDigitAtClick(layout.keypad, e.clientX - rect.left, e.clientY - rect.top);
  if (digit) {
    handleDigitInput(digit);
  }
});

const loop = () => {
  const { canvasW, canvasH, spectrumW, keypadW, vizH, tickerH, tickerY, keypad } = layout;
  const nodes = getContext();
  const nowMs = performance.now();

  ctx2d.fillStyle = '#0a0a0f';
  ctx2d.fillRect(0, 0, canvasW, canvasH);

  if (nodes) {
    const fftData = readFFT(nodes);
    const sampleRate = getSampleRate(nodes);

    // Determine active DTMF frequencies
    const activeFreqs = new Set<number>();
    for (const f of ROW_FREQS) {
      if (dbAtFreq(fftData, f, sampleRate, FFT_SIZE) > THRESHOLD_DB) activeFreqs.add(f);
    }
    for (const f of COL_FREQS) {
      if (dbAtFreq(fftData, f, sampleRate, FFT_SIZE) > THRESHOLD_DB) activeFreqs.add(f);
    }

    // Run detector — audio pipeline drives flash + ticker for real signals
    const event = detector.detect(fftData, sampleRate, FFT_SIZE, nowMs);
    if (event) {
      flashDigit(keypadState, event.digit, nowMs);
      pushEvent(tickerState, event);
    }

    drawSpectrum(ctx2d, fftData, sampleRate, spectrumW, vizH, activeFreqs);
  }

  drawKeypad(ctx2d, keypadState, keypad.x, keypad.y, keypadW, vizH, nowMs);
  drawTicker(ctx2d, tickerState, 10, tickerY, canvasW - 20, tickerH);

  requestAnimationFrame(loop);
};

loop();
