<div align="center">

<img src="https://raw.githubusercontent.com/YOUR_USERNAME/cordium/main/assets/logo.svg" alt="Cordium Logo" width="120" height="120" />

# Cordium

### The Purpose-Built IDE for Discord Bot Developers

[![Discord](https://img.shields.io/badge/Discord-Developer_Ecosystem-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)
[![Version](https://img.shields.io/badge/Release-v0.5.0_Beta-57F287?style=for-the-badge)](https://github.com/YOUR_USERNAME/cordium/releases)
[![Built With Tauri](https://img.shields.io/badge/Engine-Tauri_%2B_CodeMirror_6-EB459E?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Supported Libraries](https://img.shields.io/badge/SDKs-discord.py_%7C_discord.js_v14-FEE75C?style=for-the-badge&logo=python&logoColor=black)](#-supported-libraries)

<p align="center">
  <b>Fast. Native. Lightweight. Built from the ground up to streamline Discord application creation.</b>
</p>

[Quick Start](#-getting-started) • [Download Releases](#-download--install) • [Feature Highlights](#-core-features) • [Documentation](#-shortcuts--cheatsheet)

---

</div>

## <img src="https://api.iconify.design/lucide:cpu.svg?color=%235865f2" width="22" height="22" valign="middle" /> Overview

**Cordium** is a high-performance integrated development environment specifically tuned for constructing, debugging, and deploying Discord bots.

By replacing memory-heavy web containers with a lean **Tauri native core**, Cordium delivers near-zero runtime latency, sub-3MB binary sizes, and minimal RAM overhead—giving your hardware full headroom to power your local bot instances and interactive test routines.
---

## <img src="https://api.iconify.design/lucide:zap.svg?color=%235865f2" width="22" height="22" valign="middle" /> Core Features

### <img src="https://api.iconify.design/lucide:message-square-code.svg?color=%2357f287" width="18" height="18" valign="middle" /> Sandbox Test Chat & Offline Harness
* **Zero-Gateway Testing:** Run application commands (`/slash`, subcommands, parameters) inside an isolated local execution harness without connecting to Discord production WebSocket gateways or leaking bot tokens.
* **Pixel-Perfect Embed Engine:** Instant native visual feedback for message embeds, components (Buttons, Selects), inline fields, and ephemeral responses matching Discord's exact client spec.

### <img src="https://api.iconify.design/lucide:wrench.svg?color=%2357f287" width="18" height="18" valign="middle" /> Visual Developer Utilities
* **Interactive Slash Command Generator:** Form-driven parameters (`string`, `integer`, `boolean`, `required/optional`) that output clean, production-ready initialization code for both Python and JavaScript.
* **Live Embed Architect:** Drag, drop, and construct multi-field embeds with real-time preview and instant code insertion directly into your active buffer.
* **Token Guard & Environment Security:** Auto-detects unencrypted tokens, auto-masks credentials in `.env`, automatically generates `.gitignore` policies, and alerts developers before committing sensitive keys.
* **Intents & Permissions Visualizer:** Toggle Gateway Intents and OAuth2 scopes to automatically compute bitwise permission integers and construct instant bot invite URLs.

### <img src="https://api.iconify.design/lucide:code-2.svg?color=%2357f287" width="18" height="18" valign="middle" /> Developer-Centric Code Engine
* **Tauri Native Core:** Ultra-lightweight footprint (~2.2MB installer size) powered by native OS webview backends for lightning-fast launch times and low CPU/RAM consumption.
* **Discord-Aware Autocomplete:** Contextual, intelligent completion for `discord.py` (`commands.*`, `app_commands.*`, `interaction.*`, `ctx.*`) and `discord.js` (`GatewayIntentBits.*`, `Events.*`, `SlashCommandBuilder.*`).
* **Snippets Engine:** Expand standard bot workflows (`slash`, `cog`, `listener`, `embed`, `button`) instantly with tab-stop navigation.
* **Active Traceback Jumper:** Click straight on console stack trace paths (e.g., `main.py:42`) to jump immediately to the corresponding source line in the active tab.

### <img src="https://api.iconify.design/lucide:terminal.svg?color=%2357f287" width="18" height="18" valign="middle" /> System Control & PTY Terminal
* **Integrated Interactive PTY:** Fully functional CLI supporting `pip`, `npm`, `git`, and interactive password entry with background execution status indicators.
* **Automated Dependency Setup:** Provision isolated Python virtual environments (`.venv`) or trigger `npm install` with a single click without polluting global runtimes.
* **Auto-Reload on Save:** Seamless hot-reloading that automatically restarts your active bot process whenever source files are updated.

---

## <img src="https://api.iconify.design/lucide:palette.svg?color=%23eb459e" width="22" height="22" valign="middle" /> Official Visual Themes

Cordium includes **18 tailored theme presets** configured specifically for high-contrast syntax visibility and long coding sessions:

| Theme Category | Available Presets |
| :--- | :--- |
| **Discord Ecosystem** | `Discord Dark` (Official Blurple/Dark), `Midnight`, `Discord Light` |
| **Developer Favorites** | `Dracula`, `Nord`, `Tokyo Night`, `Monokai`, `One Dark`, `Catppuccin Mocha` |
| **Vibrant & Specialized** | `Cyberpunk`, `Synthwave`, `Gruvbox`, `Rosé Pine`, `Solarized Dark/Light`, `Ocean` |

*Built-in typography includes pre-bundled `Inter` and `JetBrains Mono` with full font-ligature support enabled by default.*

---

## <img src="https://api.iconify.design/lucide:download.svg?color=%23fee75c" width="22" height="22" valign="middle" /> Download & Install

Select the native binary build corresponding to your desktop environment:

| Platform | Format | Build Version | Download Link |
| :--- | :--- | :--- | :--- |
| **Windows** | `.msi` / `.exe` | `v0.5.0` | [<img src="https://api.iconify.design/simple-icons:windows.svg?color=%230078D4" width="14" height="14" valign="middle" /> Download for Windows](https://github.com/YOUR_USERNAME/cordium/releases/download/v0.5.0/Cordium_0.5.0_x64_en-US.msi) |
| **Linux** | `.AppImage` / `.deb` | `v0.5.0` | [<img src="https://api.iconify.design/simple-icons:linux.svg?color=%23FCC624" width="14" height="14" valign="middle" /> Download for Linux](https://github.com/YOUR_USERNAME/cordium/releases/download/v0.5.0/cordium_0.5.0_amd64.AppImage) |
| **macOS** | `.dmg` | `v0.5.0` | [<img src="https://api.iconify.design/simple-icons:apple.svg?color=%23ffffff" width="14" height="14" valign="middle" /> Download for macOS](https://github.com/YOUR_USERNAME/cordium/releases/download/v0.5.0/Cordium_0.5.0_x64.dmg) |

---

## <img src="https://api.iconify.design/lucide:rocket.svg?color=%2357f287" width="22" height="22" valign="middle" /> Getting Started

1. **Download & Launch:** Run the lightweight installer for your platform.
2. **Initialize Workspace:** Click **PY** or **JS** in the left navigation sidebar to instantiate a production-ready bot template (`discord.py` Cogs or `discord.js` v14 Command Handler).
3. **Provision Runtime:** Click **Install Dependencies** in the top action panel to auto-build `.venv` or execute `npm install`.
4. **Configure Secrets:** Insert your Bot Application Token into the generated `.env` file *(Cordium Token Guard will automatically obscure it)*.
5. **Execute & Test:** Press **`F5`** to launch your bot. Open **Test Chat** to test slash commands locally!

---

## <img src="https://api.iconify.design/lucide:keyboard.svg?color=%235865f2" width="22" height="22" valign="middle" /> Shortcuts & Cheatsheet

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

## <img src="https://api.iconify.design/lucide:shield-check.svg?color=%2357f287" width="22" height="22" valign="middle" /> License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.

<div align="center">
  <br />
  <sub>Crafted for the Discord Developer Community.</sub>
</div>
