/// <reference types="bun" />

import { createDetector } from './detector';
import { freqToBin } from './frequencies';
import { expect, test } from 'bun:test';

const SAMPLE_RATE = 48000;
const FFT_SIZE = 4096;
const FRAME_MS = 16;

const frame = (...freqs: number[]) => {
  const data = new Float32Array(FFT_SIZE / 2).fill(-100);
  for (const f of freqs) data[freqToBin(f, SAMPLE_RATE, FFT_SIZE)] = -20;
  return data;
};

const run = (frames: Float32Array[]) => {
  const detector = createDetector();
  return frames.flatMap((f, i) => detector.detect(f, SAMPLE_RATE, FFT_SIZE, i * FRAME_MS)?.digit ?? []);
};

const tone = (ms: number, ...freqs: number[]) =>
  Array.from({ length: Math.ceil(ms / FRAME_MS) }, () => frame(...freqs));

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
