import { DTMF_TABLE } from '../dtmf/frequencies';
import type { DTMFDigit } from '../dtmf/types';

export interface KeypadState {
  activeDigit: DTMFDigit | null;
  activeUntilMs: number;
}

export interface KeypadLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const COLS = 4 as const;
const ROWS = 4 as const;

export const createKeypadState = (): KeypadState => ({ activeDigit: null, activeUntilMs: 0 });

export const flashDigit = (state: KeypadState, digit: DTMFDigit, nowMs: number) => {
  state.activeDigit = digit;
  state.activeUntilMs = nowMs + 300;
};

export const drawKeypad = (
  ctx: CanvasRenderingContext2D,
  state: KeypadState,
  x: number,
  y: number,
  width: number,
  height: number,
  nowMs: number,
) => {
  const active = nowMs < state.activeUntilMs ? state.activeDigit : null;
  const cellW = width / COLS;
  const cellH = height / ROWS;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const digit = DTMF_TABLE[r]?.[c];
      if (!digit) continue;

      const cx = x + c * cellW;
      const cy = y + r * cellH;
      const isActive = digit === active;

      // Cell background
      ctx.fillStyle = isActive ? '#ff00ff' : '#0f1923';
      roundRect(ctx, cx + 3, cy + 3, cellW - 6, cellH - 6, 4);
      ctx.fill();

      // Cell border
      ctx.strokeStyle = isActive ? '#ff00ff' : '#00d9ff';
      ctx.lineWidth = isActive ? 2 : 1;
      roundRect(ctx, cx + 3, cy + 3, cellW - 6, cellH - 6, 4);
      ctx.stroke();

      // Digit label
      ctx.fillStyle = isActive ? '#000000' : '#00d9ff';
      ctx.font = `${isActive ? 'bold ' : ''}${cellH * 0.38}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(digit, cx + cellW / 2, cy + cellH / 2);
    }
  }
};

export const getDigitAtClick = (layout: KeypadLayout, clickX: number, clickY: number): DTMFDigit | null => {
  const relX = clickX - layout.x;
  const relY = clickY - layout.y;

  if (relX < 0 || relY < 0 || relX > layout.width || relY > layout.height) {
    return null;
  }

  const cellW = layout.width / COLS;
  const cellH = layout.height / ROWS;
  const col = Math.floor(relX / cellW);
  const row = Math.floor(relY / cellH);

  if (row >= ROWS || col >= COLS) {
    return null;
  }

  return DTMF_TABLE[row]?.[col] ?? null;
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};
