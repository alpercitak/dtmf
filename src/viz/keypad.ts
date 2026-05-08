import type { DTMFDigit } from '../dtmf/types';
import { DTMF_TABLE } from '../dtmf/frequencies';

const COLS = 4;
const ROWS = 4;

export interface KeypadState {
  activeDigit: DTMFDigit | null;
  activeUntilMs: number;
}

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
