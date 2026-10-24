import { h, modal } from "./tools.js";

const T = (name, mode, c, s) => ({
  name, mode,
  vars: {
    "--bg-rail": c[0], "--bg-side": c[1], "--bg-main": c[2], "--bg-hover": c[3], "--bg-active": c[4], "--text": c[5], "--muted": c[6], "--brand": c[7],
    "--soft": mode === "dark" ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.05)",
    "--line": mode === "dark" ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.09)",
    "--syn-kw": s[0], "--syn-str": s[1], "--syn-num": s[2], "--syn-fn": s[3], "--syn-def": s[4], "--syn-prop": s[5], "--syn-com": s[6], "--syn-op": s[7], "--syn-meta": c[7],
  },
});

export const THEMES = {
  dark: T("Discord Dark", "dark", ["#1e1f22", "#2b2d31", "#313338", "#35373c", "#404249", "#dbdee1", "#949ba4", "#5865f2"], ["#c792ea", "#7ee0a0", "#f9a86b", "#82aaff", "#ffd479", "#8fd4ff", "#6d7280", "#9aa3d6"]),
  midnight: T("Midnight", "dark", ["#000000", "#0a0a0c", "#101012", "#18181b", "#222226", "#e6e6ea", "#8b8b95", "#5865f2"], ["#c792ea", "#7ee0a0", "#f9a86b", "#82aaff", "#ffd479", "#8fd4ff", "#6d7280", "#9aa3d6"]),
  light: T("Discord Light", "light", ["#e3e5e8", "#f2f3f5", "#ffffff", "#ebedef", "#d7d9dc", "#2e3338", "#5c5e66", "#5865f2"], ["#8e44ad", "#1a7f4b", "#c2570c", "#1f5fbf", "#9a6700", "#0b6e99", "#8a8f98", "#5a6190"]),
  dracula: T("Dracula", "dark", ["#191a21", "#21222c", "#282a36", "#343746", "#44475a", "#f8f8f2", "#8e93b8", "#bd93f9"], ["#ff79c6", "#f1fa8c", "#bd93f9", "#50fa7b", "#ffb86c", "#8be9fd", "#6272a4", "#ff79c6"]),
  nord: T("Nord", "dark", ["#232831", "#292e39", "#2e3440", "#3b4252", "#434c5e", "#d8dee9", "#7b88a1", "#88c0d0"], ["#81a1c1", "#a3be8c", "#b48ead", "#88c0d0", "#ebcb8b", "#8fbcbb", "#616e88", "#81a1c1"]),
  tokyo: T("Tokyo Night", "dark", ["#101014", "#16161e", "#1a1b26", "#202233", "#292e42", "#c0caf5", "#565f89", "#7aa2f7"], ["#bb9af7", "#9ece6a", "#ff9e64", "#7aa2f7", "#e0af68", "#73daca", "#565f89", "#89ddff"]),
  monokai: T("Monokai", "dark", ["#171814", "#1e1f1c", "#272822", "#34352d", "#3e3d32", "#f8f8f2", "#8f908a", "#a6e22e"], ["#f92672", "#e6db74", "#ae81ff", "#a6e22e", "#66d9ef", "#fd971f", "#75715e", "#f92672"]),
  onedark: T("One Dark", "dark", ["#181a1f", "#21252b", "#282c34", "#2c313a", "#3a3f4b", "#abb2bf", "#7f848e", "#61afef"], ["#c678dd", "#98c379", "#d19a66", "#61afef", "#e5c07b", "#e06c75", "#5c6370", "#56b6c2"]),
  ghdark: T("GitHub Dark", "dark", ["#010409", "#0b0f15", "#0d1117", "#161b22", "#21262d", "#c9d1d9", "#8b949e", "#58a6ff"], ["#ff7b72", "#a5d6ff", "#79c0ff", "#d2a8ff", "#ffa657", "#79c0ff", "#8b949e", "#ff7b72"]),
  mocha: T("Catppuccin Mocha", "dark", ["#11111b", "#181825", "#1e1e2e", "#313244", "#45475a", "#cdd6f4", "#7f849c", "#cba6f7"], ["#cba6f7", "#a6e3a1", "#fab387", "#89b4fa", "#f9e2af", "#94e2d5", "#6c7086", "#89dceb"]),
  gruvbox: T("Gruvbox", "dark", ["#141617", "#1d2021", "#282828", "#3c3836", "#504945", "#ebdbb2", "#928374", "#fabd2f"], ["#fb4934", "#b8bb26", "#d3869b", "#8ec07c", "#fabd2f", "#83a598", "#928374", "#fe8019"]),
  rosepine: T("Ros\u00E9 Pine", "dark", ["#121019", "#1f1d2e", "#191724", "#26233a", "#2a2740", "#e0def4", "#908caa", "#ebbcba"], ["#31748f", "#f6c177", "#eb6f92", "#9ccfd8", "#c4a7e7", "#ebbcba", "#6e6a86", "#908caa"]),
  soldark: T("Solarized Dark", "dark", ["#001a22", "#00212b", "#002b36", "#073642", "#0d4552", "#93a1a1", "#657b83", "#268bd2"], ["#859900", "#2aa198", "#d33682", "#268bd2", "#b58900", "#cb4b16", "#586e75", "#859900"]),
  sollight: T("Solarized Light", "light", ["#e4ddc7", "#eee8d5", "#fdf6e3", "#e7e0cb", "#d9d2bd", "#586e75", "#93a1a1", "#268bd2"], ["#859900", "#2aa198", "#d33682", "#268bd2", "#b58900", "#cb4b16", "#93a1a1", "#657b83"]),
  ghlight: T("GitHub Light", "light", ["#eaeef2", "#f6f8fa", "#ffffff", "#eaeef2", "#d0d7de", "#24292f", "#57606a", "#0969da"], ["#cf222e", "#0a3069", "#0550ae", "#8250df", "#953800", "#0550ae", "#6e7781", "#cf222e"]),
  cyber: T("Cyberpunk", "dark", ["#06060a", "#0a0a10", "#0d0d14", "#15152a", "#1f1f3a", "#e6f1ff", "#6b7a99", "#00f0ff"], ["#ff2a6d", "#05ffa1", "#ffe600", "#00f0ff", "#b967ff", "#ff9f1c", "#4a5578", "#ff2a6d"]),
  synth: T("Synthwave", "dark", ["#1a1423", "#241b2f", "#262335", "#34294f", "#463465", "#ffffff", "#848bbd", "#ff7edb"], ["#fede5d", "#ff8b39", "#f97e72", "#36f9f6", "#fe4450", "#72f1b8", "#848bbd", "#fede5d"]),
  ocean: T("Ocean", "dark", ["#05060a", "#090b10", "#0f111a", "#1a1c25", "#292d3e", "#a6accd", "#546e7a", "#82aaff"], ["#c792ea", "#c3e88d", "#f78c6c", "#82aaff", "#ffcb6b", "#89ddff", "#546e7a", "#89ddff"]),
};

let current = "dark";
export function setTheme(key) {
  const t = THEMES[key] || THEMES.dark;
  current = THEMES[key] ? key : "dark";
  const root = document.documentElement;
  Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.dataset.mode = t.mode;
  localStorage.setItem("cordium.theme", current);
  window.dispatchEvent(new Event("cordium-theme"));
}
setTheme(localStorage.getItem("cordium.theme") || "dark");

export function openThemePicker() {
  const grid = h("div", { className: "themes" });
  const cards = {};
  const bar = (w, c) => h("i", { style: `display:block;height:4px;border-radius:2px;width:${w}%;background:${c};margin:4px 0` });
  for (const [k, t] of Object.entries(THEMES)) {
    const v = t.vars;
    const prev = h("div", { className: "tprev", style: `background:${v["--bg-main"]}` },
      h("div", { style: `width:12px;background:${v["--bg-rail"]}` }),
      h("div", { style: `width:28px;background:${v["--bg-side"]}` }),
      h("div", { style: "flex:1;padding:6px 8px" }, bar(70, v["--syn-kw"]), bar(50, v["--syn-str"]), bar(80, v["--syn-fn"]), bar(35, v["--brand"])));
    const card = h("div", { className: "tcard" + (k === current ? " on" : ""), onclick: () => { setTheme(k); Object.values(cards).forEach((c) => c.classList.remove("on")); card.classList.add("on"); } },
      prev, h("div", { className: "tname", textContent: t.name + (t.mode === "light" ? " \u2600" : "") }));
    cards[k] = card;
    grid.append(card);
  }
  modal("Themes", grid, "Done", () => {});
}
