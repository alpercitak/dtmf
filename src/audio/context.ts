import { DIGIT_FREQS } from '../dtmf/frequencies';
import type { DTMFDigit } from '../dtmf/types';
import { connectSource, getOrCreateContext } from './analyser';

export const loadAudioFile = async (file: File): Promise<void> => {
  const nodes = getOrCreateContext();
  await nodes.ctx.resume();

  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await nodes.ctx.decodeAudioData(arrayBuffer);

  const source = nodes.ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(nodes.ctx.destination);
  connectSource(source, nodes);
  source.start();
};

export const loadSampleFile = async (): Promise<void> => {
  const res = await fetch('/sample.wav');
  if (!res.ok) throw new Error(`sample.wav: HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const nodes = getOrCreateContext();
  await nodes.ctx.resume();

  const audioBuffer = await nodes.ctx.decodeAudioData(arrayBuffer);
  const source = nodes.ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(nodes.ctx.destination);
  connectSource(source, nodes);
  source.start();
};

export const playDTMFTone = async (digit: DTMFDigit, durationMs: number = 100): Promise<void> => {
  const nodes = getOrCreateContext();
  await nodes.ctx.resume();

  const freqs = DIGIT_FREQS[digit];
  if (!freqs) return;

  const now = nodes.ctx.currentTime;
  const duration = durationMs / 1000;

  // Create oscillators for low and high frequencies
  const lowOsc = nodes.ctx.createOscillator();
  lowOsc.frequency.value = freqs.low;
  lowOsc.type = 'sine';

  const highOsc = nodes.ctx.createOscillator();
  highOsc.frequency.value = freqs.high;
  highOsc.type = 'sine';

  // Create gain node for amplitude control
  const gain = nodes.ctx.createGain();
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connect oscillators to gain, gain to synth (which routes through analyser)
  lowOsc.connect(gain);
  highOsc.connect(gain);
  gain.connect(nodes.synthGain);

  // Start and stop oscillators
  lowOsc.start(now);
  highOsc.start(now);
  lowOsc.stop(now + duration);
  highOsc.stop(now + duration);
};
