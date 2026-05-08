import { getOrCreateContext, connectSource } from './analyser';

export const startMic = async (): Promise<void> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const nodes = getOrCreateContext();
  await nodes.ctx.resume();
  const source = nodes.ctx.createMediaStreamSource(stream);
  connectSource(source, nodes);
};
