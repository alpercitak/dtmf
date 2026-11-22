export const FFT_SIZE = 4096;

export interface AudioNodes {
  ctx: AudioContext;
  analyser: AnalyserNode;
  synthGain: GainNode;
  fftData: Float32Array<ArrayBuffer>;
}

let nodes: AudioNodes | null = null;
let currentSource: AudioNode | null = null;

/** The context if a user action has created it; browsers block audio contexts created before one. */
export const getContext = (): AudioNodes | null => nodes;

export const getOrCreateContext = (): AudioNodes => {
  if (nodes) {
    return nodes;
  }

  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.6;

  // The analyser is a tap, not an output: audible sources also connect to ctx.destination themselves.
  const synthGain = ctx.createGain();
  synthGain.gain.value = 1;
  synthGain.connect(analyser);
  synthGain.connect(ctx.destination);

  nodes = {
    ctx,
    analyser,
    synthGain,
    fftData: new Float32Array(analyser.frequencyBinCount),
  };

  return nodes;
};

export const disconnectCurrentSource = () => {
  if (currentSource instanceof AudioBufferSourceNode) {
    currentSource.stop();
  }
  if (currentSource instanceof MediaStreamAudioSourceNode) {
    for (const track of currentSource.mediaStream.getTracks()) track.stop();
  }
  currentSource?.disconnect();
  currentSource = null;
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
