# Third-party software bundled with Cordium

Cordium ships with the following open-source components. Each keeps its own license.
Cordium is an independent project and is **not affiliated with or endorsed by Discord Inc.**

| Component | Version | License | Used for |
| :--- | :--- | :--- | :--- |
| [Jedi](https://github.com/davidhalter/jedi) (+ bundled typeshed stubs) | 0.20.1 | MIT (typeshed: Apache-2.0 / MIT) | Python autocomplete and hover |
| [Parso](https://github.com/davidhalter/parso) | 0.8.x | MIT | Python parsing for Jedi |
| [discord.py](https://github.com/Rapptz/discord.py) (source only, for analysis) | 2.7.1 | MIT | Complete discord.py autocomplete when it is not installed in the project |
| [TypeScript](https://github.com/microsoft/TypeScript) | 5.9.3 | Apache-2.0 | JavaScript / TypeScript language service (runs in a Web Worker) |
| [discord.js](https://github.com/discordjs/discord.js) and `@discordjs/*` (type declarations only) | 14.27.0 | Apache-2.0 | Complete discord.js autocomplete and types |
| [discord-api-types](https://github.com/discordjs/discord-api-types) (type declarations only) | bundled with discord.js | MIT | discord.js types |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped) | 26.x | MIT | Node.js types |
| [CodeMirror 6](https://codemirror.net) | 6.x | MIT | Editor |
| [xterm.js](https://xtermjs.org) | 5.x / 6.x | MIT | Terminal front-end |
| [Tauri 2](https://tauri.app), [portable-pty](https://github.com/wez/wezterm/tree/main/pty) | 2.x / 0.9 | MIT / Apache-2.0 | Native shell, PTY |
| Fonts via [Fontsource](https://fontsource.org): Source Code Pro, IBM Plex Mono, Fira Code, JetBrains Mono, Noto Sans, Nunito Sans, Inter, Vazirmatn | latest | SIL Open Font License 1.1 | UI and code fonts |
| Roboto Mono (Fontsource) | latest | Apache-2.0 | Code font |

The vendored copies live in `src-tauri/resources/pyls/` and `public/types/bundle.json`.
Use `scripts/refresh-python-intel.sh` and `scripts/refresh-types-bundle.mjs` to regenerate them.
