import type { DetectionEvent } from '../dtmf/types';

export interface TickerState {
  events: Array<DetectionEvent>;
}

const MAX_HISTORY = 32 as const;

export const createTickerState = (): TickerState => ({ events: [] });

export const pushEvent = (state: TickerState, event: DetectionEvent) => {
  state.events.push(event);
  if (state.events.length > MAX_HISTORY) {
    state.events.shift();
  }
};

export const clearTicker = (state: TickerState) => {
  state.events.length = 0;
};

export const drawTicker = (
  ctx: CanvasRenderingContext2D,
  state: TickerState,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = '#00d9ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  if (state.events.length === 0) {
    ctx.fillStyle = '#1e3a5f';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('awaiting signal...', x + width / 2, y + height / 2);
    return;
  }

  const sequence = state.events.map((e) => e.digit).join('');
  ctx.fillStyle = '#00d9ff';
  ctx.font = `bold ${Math.min(32, height * 0.55)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Scroll from right if overflows
  const metrics = ctx.measureText(sequence);
  const textX = metrics.width > width - 24 ? x + width - 12 - metrics.width : x + 12;

  ctx.fillText(sequence, textX, y + height / 2);
};
