/// <reference types="bun" />

import { createDetector } from './detector';
import { freqToBin } from './frequencies';
import { expect, test } from 'bun:test';

const SAMPLE_RATE = 48000;
const FFT_SIZE = 4096;
const FRAME_MS = 16;

// A tone is a frequency at -20 dB, or [frequency, dB].
type Tone = number | [freq: number, db: number];

const frame = (...tones: Tone[]) => {
  const data = new Float32Array(FFT_SIZE / 2).fill(-100);
  for (const t of tones) {
    const [f, db] = typeof t === 'number' ? [t, -20] : t;
    data[freqToBin(f, SAMPLE_RATE, FFT_SIZE)] = db;
  }
  return data;
};

const run = (frames: Float32Array[]) => {
  const detector = createDetector();
  return frames.flatMap((f, i) => detector.detect(f, SAMPLE_RATE, FFT_SIZE, i * FRAME_MS)?.digit ?? []);
};

const tone = (ms: number, ...tones: Tone[]) => Array.from({ length: Math.ceil(ms / FRAME_MS) }, () => frame(...tones));

test('emits a digit once the tone is stable', () => {
  expect(run(tone(100, 697, 1209))).toEqual(['1']);
});

test('ignores tones shorter than the minimum length', () => {
  expect(run(tone(30, 697, 1209))).toEqual([]);
});

test('a held tone emits only once', () => {
  expect(run(tone(1000, 941, 1336))).toEqual(['0']);
});

test('the same digit fires again after a gap', () => {
  expect(run([...tone(100, 697, 1209), ...tone(200), ...tone(100, 697, 1209)])).toEqual(['1', '1']);
});

test('back-to-back different digits each fire', () => {
  expect(run([...tone(100, 697, 1209), ...tone(100, 852, 1477)])).toEqual(['1', '9']);
});

test('picks the strongest row, not the first one over the threshold', () => {
  expect(run(tone(100, [697, -35], 770, 1209))).toEqual(['4']);
});

test('rejects frames where two rows are about equally loud', () => {
  expect(run(tone(100, 697, 770, 1209))).toEqual([]);
});

test('rejects frames where two columns are about equally loud', () => {
  expect(run(tone(100, 697, 1209, 1336))).toEqual([]);
});

test('rejects a pair whose levels differ too much (twist)', () => {
  expect(run(tone(100, [697, -20], [1209, -35]))).toEqual([]);
});

test('accepts a pair within the twist limit', () => {
  expect(run(tone(100, [697, -20], [1209, -26]))).toEqual(['1']);
});

test('detects tones off by the 1.5% DTMF allows', () => {
  expect(run(tone(100, 941 * 1.015, 1633 * 1.015))).toEqual(['D']);
  expect(run(tone(100, 697 * 0.985, 1209 * 0.985))).toEqual(['1']);
});
