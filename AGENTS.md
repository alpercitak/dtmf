# DTMF

Single Vite + vanilla TypeScript page. Real-time DTMF decoder: audio (file, mic, bundled sample, or synthesized keypresses) goes through a Web Audio `AnalyserNode`, FFT frames are scanned for row/column tone pairs, and everything is drawn on one `<canvas>`.

- Use Bun for dependencies and package scripts.
- No framework, no path alias: relative imports, direct DOM + Canvas 2D API.
- For review, diagnosis, or planning, inspect only. For implementation, preserve unrelated user changes.

## Layout

- `src/main.ts`: entry. Builds layout, wires input, runs the `requestAnimationFrame` loop (read FFT → detect → draw).
- `src/audio/`: `analyser.ts` owns the single `AudioContext` + `AnalyserNode` (`FFT_SIZE`) and the current source; `context.ts` loads file/sample and synthesizes DTMF tones; `mic.ts` starts mic input.
- `src/dtmf/`: pure logic, no DOM. `frequencies.ts` (row/col freqs, digit table, bin math), `detector.ts` (threshold, min tone length, cooldown state machine), `types.ts`.
- `src/viz/`: canvas drawing — `spectrum.ts`, `keypad.ts` (also hit-testing clicks), `ticker.ts` (decoded digit history), `canvas.ts` (DPR setup).
- `src/ui/`: DOM wiring — `controls.ts` (buttons, file input, status), `keyboard.ts` (key → digit).
- `index.html` + `style.css` at the root; `public/` holds `sample.wav` and the favicon.

Modules expose plain functions over small state objects (`createX()` + functions taking the state). Keep that style; no classes.

## Implementation

Treat additional code as a cost.
Smallest change that solves the actual task.
Follow existing patterns.
No hypothetical future requirements, no unrelated refactors, no wrapper/factory/dependency for a single use unless it removes concrete complexity today.
Small duplication beats premature abstraction.
Default, not absolute — if the task genuinely needs structure, build it and say why in one line.
Scope is the task, nothing more.
Worth doing but out of scope → mention it, don't implement it.
If the issue is ambiguous, follow existing convention.

## Defensive Programming

Trust internal TypeScript invariants. No assertions/guards/validation/fallbacks for states this codebase already controls, unless you can name the concrete failure prevented. Validate only at real trust boundaries: user input, uploaded files, network responses, platform APIs (`getUserMedia`, `decodeAudioData`). Handle errors only with a real recovery path — otherwise let them propagate. Don't invent recovery, don't swallow, don't build infra for it.

## TypeScript / Web Audio / Canvas

Precise types over runtime checks — no `any`, no unnecessary assertions, no non-null assertions where the type can be modeled correctly. `noUncheckedIndexedAccess` is on; model the data so indexing is safe rather than sprinkling fallbacks.
The render loop is a hot path: no per-frame allocations that can be hoisted, reuse the FFT buffer, keep per-frame work proportional to visible bins.
One `AudioContext` for the app. Disconnect and stop sources you replace; stop media stream tracks you no longer use. The analyser is a tap, not an output: sources that should be heard connect to `ctx.destination` themselves; the mic never does.
Keep `src/dtmf/` free of DOM and Web Audio so it stays testable with plain `Float32Array` frames.

## Stopping

Implement, verify with checks, stop. Don't keep hardening or generalizing once it's done — note anything extra you noticed, don't build it.

## Before Finishing

Verify with `bun run build` (typecheck + Vite) and `bun run check` (Biome).
Commit in small, feature-based Conventional Commits (`fix(detector): …`, `refactor: …`); no attribution trailers.
Cut from your own diff: unneeded abstractions, redundant guards, one-use helpers, speculative config, unrelated changes, obvious-code comments. Equal correctness → ship the smaller one.
