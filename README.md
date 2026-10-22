<div align="center">
  <img src="https://raw.githubusercontent.com/GwenAsa/cordium-ide/main/cordium-icons/cordium-banner.png" alt="Cordium Banner" width="100%" />
</div>

<div align="center">

# Cordium

### The Purpose-Built IDE for Discord Bot Developers

[![Discord](https://img.shields.io/badge/Discord-Developer_Ecosystem-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)
[![Version](https://img.shields.io/badge/Release-v0.5.0_Beta-57F287?style=for-the-badge)](https://github.com/GwenAsa/cordium-ide/releases)
[![Built With Tauri](https://img.shields.io/badge/Engine-Tauri_%2B_CodeMirror_6-EB459E?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Supported Libraries](https://img.shields.io/badge/SDKs-discord.py_%7C_discord.js_v14-FEE75C?style=for-the-badge&logo=python&logoColor=black)](#-supported-libraries)

<p align="center">
  <b>Fast. Native. Lightweight. Built from the ground up to streamline Discord application creation.</b>
</p>

[Quick Start](#-getting-started) • [Download Releases](#-download--install) • [Feature Highlights](#-core-features) • [Documentation](#-shortcuts--cheatsheet)

---

</div>

## <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%235865F2' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='4' y='4' width='16' height='16' rx='2'/><rect x='9' y='9' width='6' height='6'/><line x1='9' y1='1' x2='9' y2='4'/><line x1='15' y1='1' x2='15' y2='4'/><line x1='9' y1='20' x2='9' y2='23'/><line x1='15' y1='20' x2='15' y2='23'/><line x1='20' y1='9' x2='23' y2='9'/><line x1='20' y1='15' x2='23' y2='15'/><line x1='1' y1='9' x2='4' y2='9'/><line x1='1' y1='15' x2='4' y2='15'/></svg>" valign="middle" /> Overview

**Cordium** is a high-performance integrated development environment specifically tuned for constructing, debugging, and deploying Discord bots.

By replacing memory-heavy web containers with a lean **Tauri native core**, Cordium delivers near-zero runtime latency, sub-3MB binary sizes, and minimal RAM overhead—giving your hardware full headroom to power your local bot instances and interactive test routines.

---

## <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%235865F2' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>" valign="middle" /> Core Features

### <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2357F287' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/><path d='m10 8-2 2 2 2'/><path d='m14 8 2 2-2 2'/></svg>" valign="middle" /> Sandbox Test Chat & Offline Harness
* **Zero-Gateway Testing:** Run application commands (`/slash`, subcommands, parameters) inside an isolated local execution harness without connecting to Discord production WebSocket gateways or leaking bot tokens.
* **Pixel-Perfect Embed Engine:** Instant native visual feedback for message embeds, components (Buttons, Selects), inline fields, and ephemeral responses matching Discord's exact client spec.

### <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2357F287' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/></svg>" valign="middle" /> Visual Developer Utilities
* **Interactive Slash Command Generator:** Form-driven parameters (`string`, `integer`, `boolean`, `required/optional`) that output clean, production-ready initialization code for both Python and JavaScript.
* **Live Embed Architect:** Drag, drop, and construct multi-field embeds with real-time preview and instant code insertion directly into your active buffer.
* **Token Guard & Environment Security:** Auto-detects unencrypted tokens, auto-masks credentials in `.env`, automatically generates `.gitignore` policies, and alerts developers before committing sensitive keys.
* **Intents & Permissions Visualizer:** Toggle Gateway Intents and OAuth2 scopes to automatically compute bitwise permission integers and construct instant bot invite URLs.

### <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2357F287' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='16 18 22 12 16 6'/><polyline points='8 6 2 12 8 18'/></svg>" valign="middle" /> Developer-Centric Code Engine
* **Tauri Native Core:** Ultra-lightweight footprint (~2.2MB installer size) powered by native OS webview backends for lightning-fast launch times and low CPU/RAM consumption.
* **Discord-Aware Autocomplete:** Contextual, intelligent completion for `discord.py` (`commands.*`, `app_commands.*`, `interaction.*`, `ctx.*`) and `discord.js` (`GatewayIntentBits.*`, `Events.*`, `SlashCommandBuilder.*`).
* **Snippets Engine:** Expand standard bot workflows (`slash`, `cog`, `listener`, `embed`, `button`) instantly with tab-stop navigation.
* **Active Traceback Jumper:** Click straight on console stack trace paths (e.g., `main.py:42`) to jump immediately to the corresponding source line in the active tab.

### <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2357F287' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='4 17 10 11 4 5'/><line x1='12' y1='19' x2='20' y2='19'/></svg>" valign="middle" /> System Control & PTY Terminal
* **Integrated Interactive PTY:** Fully functional CLI supporting `pip`, `npm`, `git`, and interactive password entry with background execution status indicators.
* **Automated Dependency Setup:** Provision isolated Python virtual environments (`.venv`) or trigger `npm install` with a single click without polluting global runtimes.
* **Auto-Reload on Save:** Seamless hot-reloading that automatically restarts your active bot process whenever source files are updated.

---

## <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%23EB459E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='13.5' cy='6.5' r='.5'/><circle cx='17.5' cy='10.5' r='.5'/><circle cx='8.5' cy='7.5' r='.5'/><circle cx='6.5' cy='12.5' r='.5'/><path d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.72 1.7-1.63 0-.43-.17-.83-.44-1.13-.27-.3-.44-.7-.44-1.13 0-.91.73-1.64 1.64-1.64H17c2.76 0 5-2.24 5-5 0-4.42-4.48-8-10-8z'/></svg>" valign="middle" /> Official Visual Themes

Cordium includes **18 tailored theme presets** configured specifically for high-contrast syntax visibility and long coding sessions:

| Theme Category | Available Presets |
| :--- | :--- |
| **Discord Ecosystem** | `Discord Dark` (Official Blurple/Dark), `Midnight`, `Discord Light` |
| **Developer Favorites** | `Dracula`, `Nord`, `Tokyo Night`, `Monokai`, `One Dark`, `Catppuccin Mocha` |
| **Vibrant & Specialized** | `Cyberpunk`, `Synthwave`, `Gruvbox`, `Rosé Pine`, `Solarized Dark/Light`, `Ocean` |

*Built-in typography includes pre-bundled `Inter` and `JetBrains Mono` with full font-ligature support enabled by default.*

---

## <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%23FEE75C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>" valign="middle" /> Download & Install

Select the native binary build corresponding to your desktop environment:

| Platform | Format | Build Version | Download Link |
| :--- | :--- | :--- | :--- |
| **Linux** | `.AppImage` / `.deb` | `v0.5.0` | [Download for Linux](https://github.com/GwenAsa/cordium-ide/releases) |
---

## <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%2357F287' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z'/><path d='m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z'/></svg>" valign="middle" /> Getting Started

1. **Download & Launch:** Run the lightweight installer for your platform.
2. **Initialize Workspace:** Click **PY** or **JS** in the left navigation sidebar to instantiate a production-ready bot template (`discord.py` Cogs or `discord.js` v14 Command Handler).
3. **Provision Runtime:** Click **Install Dependencies** in the top action panel to auto-build `.venv` or execute `npm install`.
4. **Configure Secrets:** Insert your Bot Application Token into the generated `.env` file *(Cordium Token Guard will automatically obscure it)*.
5. **Execute & Test:** Press **`F5`** to launch your bot. Open **Test Chat** to test slash commands locally!

---

## <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%235865F2' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='4' width='20' height='16' rx='2'/><path d='M6 8h.01'/><path d='M10 8h.01'/><path d='M14 8h.01'/><path d='M18 8h.01'/><path d='M8 12h.01'/><path d='M12 12h.01'/><path d='M16 12h.01'/><path d='M7 16h10'/></svg>" valign="middle" /> Shortcuts & Cheatsheet

| Keybinding | Command Function |
| :--- | :--- |
| `Ctrl + P` / `Ctrl + Shift + P` | Open Command Palette & Quick File Search |
| `F5` | Launch / Restart Active Bot Process |
| `Ctrl + B` | Toggle File Manager Workspace Sidebar |
| `Ctrl + \`` | Toggle Integrated PTY Terminal |
| `Alt + Z` | Toggle Soft Word Wrapping |
| `Ctrl + S` | Save Active Buffer |
| `Ctrl + +` / `Ctrl + -` | Adjust Workspace Zoom Level |

---

## <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='%2357F287' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='m9 12 2 2 4-4'/></svg>" valign="middle" /> License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.

<div align="center">
  <br />
  <sub>Crafted for the Discord Developer Community.</sub>
</div>
