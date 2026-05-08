import { getOrCreateContext, connectSource } from './analyser';

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
