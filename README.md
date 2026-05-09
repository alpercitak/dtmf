# DTMF

![Web Audio](https://img.shields.io/badge/Web_Audio-000000?style=flat-square&logo=googlechrome&logoColor=white)
![FFT](https://img.shields.io/badge/FFT-000000?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMCAyMGgtNHYtNWgyVjloLTR2NWgydjZoLTZ2LTJoMnYtOGgtMnYtMmgydi0yaDJ2MmgydjhoLTJ2Nmg0di0yaDJ2LTJoMnYyLTJoMnYyaDJ2LTRoLTJ2LTJoLTJ2MmgtMnY0aDJ2LTJoMnYyaC00djJoLTR2LTJoLTJ6Ii8+PC9zdmc+) 
![DSP](https://img.shields.io/badge/DSP-000000?style=flat-square&logo=signal&logoColor=white)
![Build](https://img.shields.io/github/actions/workflow/status/alpercitak/dtmf/build.yaml?style=flat-square&label=&color=2ea44f)
![License](https://img.shields.io/badge/MIT-2ea44f?style=flat-square)

Real-time DTMF decoder and visualizer. Feed it an audio file or live mic input. It decodes dual-tone multi-frequency signals via FFT and visualizes each keypress as it happens.

---

## What it does

Every telephone keypress is encoded as two simultaneous sine waves, one from a row frequency (697–941 Hz) and one from a column frequency (1209–1633 Hz). This tool:

1. Captures audio from a file upload, mic, or bundled sample
2. Runs a real-time FFT at 4096 points (~10 Hz/bin resolution)
3. Detects which row + column frequency pair is active above threshold
4. Flashes the matching key on a visual phone keypad
5. Streams decoded digits to a rolling ticker

---

## Stack

- **Vanilla TypeScript** — no framework, direct DOM + Canvas API
- **Web Audio API** — `AnalyserNode` with `getFloatFrequencyData`
- **Vite** — dev server and build
- **Bun** — runtime, package manager, test runner
- **Cloudflare Pages** — deploy target

---

## Getting started

```bash
bun install
bun run dev
```

```bash
bun run build    # outputs to dist/
```

## How the detection works

```
FFT frame (4096 points)
  → scan 4 row freqs (697, 770, 852, 941 Hz)
  → scan 4 col freqs (1209, 1336, 1477, 1633 Hz)
  → if one row + one col both exceed -40 dB threshold
  → stable for ≥ 40ms → emit DetectionEvent
  → cooldown 120ms to prevent repeat firing
```

FFT size of 4096 at 44100 Hz gives ~10.8 Hz per bin — sufficient to distinguish 1336 Hz from 1477 Hz (141 Hz apart) with no ambiguity.

---

## License

MIT
