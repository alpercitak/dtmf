import { disconnectCurrentSource } from '../audio/analyser';
import { loadAudioFile, loadSampleFile } from '../audio/context';
import { startMic } from '../audio/mic';
import type { Detector } from '../dtmf/detector';
import type { TickerState } from '../viz/ticker';
import { clearTicker } from '../viz/ticker';

export const wireControls = (tickerState: TickerState, detector: Detector) => {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const micBtn = document.getElementById('btn-mic') as HTMLButtonElement;
  const sampleBtn = document.getElementById('btn-sample') as HTMLButtonElement;
  const clearBtn = document.getElementById('btn-clear') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLElement;

  const setStatus = (msg: string) => {
    statusEl.textContent = msg;
  };

  // Stop the old source right away, not once the new one has loaded, so it can't add digits after the clear.
  const restart = () => {
    disconnectCurrentSource();
    clearTicker(tickerState);
    detector.reset();
  };

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    restart();
    setStatus(`playing: ${file.name}`);
    try {
      await loadAudioFile(file);
    } catch (e) {
      setStatus('error loading file');
      console.error(e);
    }
  });

  micBtn.addEventListener('click', async () => {
    restart();
    setStatus('mic active — listening...');
    try {
      await startMic();
    } catch (e) {
      setStatus('mic access denied');
      console.error(e);
    }
  });

  sampleBtn.addEventListener('click', async () => {
    restart();
    setStatus('playing: sample');
    try {
      await loadSampleFile();
    } catch (e) {
      setStatus('error loading sample');
      console.error(e);
    }
  });

  clearBtn.addEventListener('click', () => {
    clearTicker(tickerState);
    detector.reset();
    setStatus('cleared');
  });
};
