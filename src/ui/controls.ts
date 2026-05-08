import { loadAudioFile, loadSampleFile } from '../audio/context';
import { startMic } from '../audio/mic';
import type { TickerState } from '../viz/ticker';
import { clearTicker } from '../viz/ticker';
import type { Detector } from '../dtmf/detector';

export const wireControls = (tickerState: TickerState, detector: Detector) => {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const micBtn = document.getElementById('btn-mic') as HTMLButtonElement;
  const sampleBtn = document.getElementById('btn-sample') as HTMLButtonElement;
  const clearBtn = document.getElementById('btn-clear') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLElement;

  const setStatus = (msg: string) => {
    statusEl.textContent = msg;
  };

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    clearTicker(tickerState);
    detector.reset();
    setStatus(`playing: ${file.name}`);
    try {
      await loadAudioFile(file);
    } catch (e) {
      setStatus('error loading file');
      console.error(e);
    }
  });

  micBtn.addEventListener('click', async () => {
    clearTicker(tickerState);
    detector.reset();
    setStatus('mic active — listening...');
    try {
      await startMic();
    } catch (e) {
      setStatus('mic access denied');
      console.error(e);
    }
  });

  sampleBtn.addEventListener('click', async () => {
    clearTicker(tickerState);
    detector.reset();
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
