import type { DTMFDigit } from '../dtmf/types';

const KEY_MAP: Record<string, DTMFDigit> = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '*': '*',
  '#': '#',
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
} as const;

export function wireKeyboard(onDigit: (digit: DTMFDigit) => void) {
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey) {
      return;
    }
    const digit = KEY_MAP[e.key.toLowerCase()];
    if (digit) {
      onDigit(digit);
    }
  });
}
