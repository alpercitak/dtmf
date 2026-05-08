export const FFT_SIZE = 4096;

export interface AudioNodes {
  ctx: AudioContext;
  analyser: AnalyserNode;
  fftData: Float32Array<ArrayBuffer>;
}

let nodes: AudioNodes | null = null;
let currentSource: AudioNode | null = null;

export const getOrCreateContext = (): AudioNodes => {
  if (nodes) {
    return nodes;
  }

  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.6;
  analyser.connect(ctx.destination);

  nodes = {
    ctx,
    analyser,
    fftData: new Float32Array(analyser.frequencyBinCount),
  };

  return nodes;
};

export const disconnectCurrentSource = () => {
  if (currentSource) {
    try {
      currentSource.disconnect();
    } catch {}
    currentSource = null;
  }
};

export const connectSource = (source: AudioNode, nodes: AudioNodes) => {
  disconnectCurrentSource();
  source.connect(nodes.analyser);
  currentSource = source;
};

export const readFFT = (nodes: AudioNodes): Float32Array => {
  nodes.analyser.getFloatFrequencyData(nodes.fftData);
  return nodes.fftData;
};

export const getSampleRate = (nodes: AudioNodes): number => nodes.ctx.sampleRate;
