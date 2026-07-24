# Fefe

A cross-platform desktop UI for **ffmpeg** — inspect, convert, and trim media without touching the command line. Built with Electron, React, and TypeScript.

## Stack

- **Electron** + **electron-vite** (fast HMR for main, preload, and renderer)
- **React 18** + **TypeScript** (strict, zero JS files)
- **Ant Design** components behind a swappable `@ui` abstraction layer
- **SCSS Modules** for styling
- **Bundled ffmpeg/ffprobe** via `ffmpeg-static` / `ffprobe-static`, spawned from the main process

## Architecture

```
src/
├── shared/          # Types + IPC contracts shared across all processes
│   ├── types.ts     # MediaInfo, JobSpec, Job, events
│   └── ipc.ts       # Channel names + the typed window.api surface
├── main/            # Node/Electron main process
│   ├── index.ts     # Window + app lifecycle
│   ├── ipc.ts       # IPC handlers + dialogs
│   └── ffmpeg/      # binaries, probe, buildArgs, runner, jobManager
├── preload/         # contextBridge — the only place the renderer meets Electron
└── renderer/        # React app
    └── src/
        ├── ui/        # ★ Swappable component library (antd today)
        ├── lib/       # api client + formatting
        ├── store/     # zustand: media + jobs
        ├── features/  # inspector, convert, trim, jobs, library
        └── components/# shared building blocks
```

### The `@ui` layer

Feature code imports UI primitives from `@ui`, **never** from `antd` directly.
Every component (`Button`, `Select`, `Panel`, …) exposes a library-agnostic prop
contract defined in `ui/types.ts`. To swap Ant Design for another library,
reimplement the components inside `src/renderer/src/ui/` against the same
contracts — nothing else in the app changes.

### ffmpeg jobs

The renderer sends a high-level `JobSpec` over IPC. The main process
(`ffmpeg/buildArgs.ts`) turns it into an argument vector, spawns ffmpeg with
`-progress pipe:1`, and streams progress + logs back to the renderer as typed
events. Progress percentages are computed against the source/output duration
from ffprobe.

## Develop

```bash
npm install
npm run dev        # launches the app with HMR
```

## Quality

```bash
npm run typecheck  # tsc for both node + web projects
npm run lint
```

## Package

```bash
npm run dist       # current platform
npm run dist:mac   # or :win / :linux
```

The ffmpeg/ffprobe binaries are kept out of the asar (`asarUnpack`) so they
remain executable in packaged builds.
