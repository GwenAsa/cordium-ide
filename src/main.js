window.addEventListener("error", (e) => showFatal(e.message));
window.addEventListener("unhandledrejection", (e) => showFatal(String(e.reason)));
function showFatal(msg) {
  const d = document.createElement("div");
  d.className = "fatal";
  d.textContent = "Cordium error: " + msg;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
}
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { EditorView, keymap, scrollPastEnd } from "@codemirror/view";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { paintIcons } from "./icons.js";
import { pyCompletion, pyWarm, tsCompletion, tsStart, tsDiagnostics, tsUpdate, tsActive, tsLoadProject, smartHover } from "./intel.js";
import { openFontPicker } from "./fonts.js";
import { botLint } from "./lint.js";
import { modulesGallery, componentsBuilder, snippetsManager } from "./tools3.js";
import { THEMES, setTheme, openThemePicker } from "./themes.js";
import { EditorState, Compartment } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { autocompletion } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { discordCompletions } from "./completions.js";
import { PY_TEMPLATE, JS_TEMPLATE } from "./templates.js";
import { initTestChat } from "./testchat.js";
import { snippetSource } from "./snippets.js";
import { slashBuilder, embedBuilder, openPalette, promptName, promptText, confirmBox } from "./tools.js";
import logoUrl from "./logo.png";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import { inviteBuilder, envManager, shortcutsModal } from "./tools2.js";
import "./style.css";

const $ = (id) => document.getElementById(id);
let saveTimer, arTimer;
const wrapC = new Compartment();
const wrapStored = localStorage.getItem("cordium.wrap");
let wrap = wrapStored === null ? window.innerWidth <= 900 : wrapStored === "1";
let term, fitAddon, ptyGen = 0, ptyRoot = null;
let consoleTab = localStorage.getItem("cordium.ctab") || "out";
let afterSave = () => {};
const state = { root: null, tabs: [], active: null, view: null, running: false };

const theme = EditorView.theme({
  "&": { backgroundColor: "var(--bg-main)", color: "var(--text)", fontSize: "var(--code-size, 14px)" },
  ".cm-content": { fontFamily: "var(--code-font)", caretColor: "var(--brand)", padding: "10px 0", lineHeight: "1.75" },
  ".cm-line": { padding: "0 16px 0 8px" },
  ".cm-gutters": { backgroundColor: "var(--bg-main)", color: "var(--muted)", border: "none", opacity: ".75" },
  ".cm-activeLine": { backgroundColor: "var(--soft)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "color-mix(in srgb, var(--brand) 32%, transparent) !important" },
  ".cm-cursor": { borderLeftWidth: "2px", borderLeftColor: "var(--brand)" },
  ".cm-matchingBracket": { backgroundColor: "color-mix(in srgb, var(--brand) 25%, transparent)", outline: "none" },
  "&.cm-focused": { outline: "none" },
}, { dark: true });

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword], color: "var(--syn-kw)" },
  { tag: [t.string, t.special(t.string)], color: "var(--syn-str)" },
  { tag: [t.number, t.bool, t.null], color: "var(--syn-num)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--syn-fn)" },
  { tag: [t.definition(t.variableName), t.className], color: "var(--syn-def)" },
  { tag: t.propertyName, color: "var(--syn-prop)" },
  { tag: t.comment, color: "var(--syn-com)", fontStyle: "normal" },
  { tag: [t.operator, t.punctuation], color: "var(--syn-op)" },
  { tag: t.meta, color: "var(--syn-meta)" },
]);

const EXT_COLOR = { py: "#ffd43b", js: "#f7df1e", json: "#8fd4ff", env: "#57d28f", md: "#9aa3d6", txt: "#b5bac1" };
const extOf = (name) => (name.startsWith(".") ? name.slice(1) : name.split(".").pop());
const langOf = (path) => (path.endsWith(".py") ? "py" : /\.(ts|tsx|mts|cts)$/.test(path) ? "ts" : /\.(js|jsx|mjs|cjs)$/.test(path) ? "js" : "plain");
const smartOn = () => localStorage.getItem("cordium.smart") !== "0";
const ictx = () => ({ root: state.root, path: state.active, smart: smartOn() });

function log(text, cls = "") {
  const el = $("log");
  const span = document.createElement("span");
  if (cls) span.className = cls;
  linkify(span, text + "\n");
  el.appendChild(span);
  el.scrollTop = el.scrollHeight;
  if (!$("app").classList.contains("term-open") && cls !== "l-ok") {
    const b = $("term-badge");
    if (cls === "l-err") b.className = "err"; else if (b.className !== "err") b.className = "on";
  }
}

async function renderDir(path, container, depth = 0) {
  const entries = await invoke("list_dir", { path });
  for (const e of entries) {
    const row = document.createElement("div");
    row.className = "node";
    row.style.paddingLeft = 8 + depth * 14 + "px";
    const badge = document.createElement("span");
    badge.className = "badge-ext";
    badge.style.background = e.is_dir ? "#5865f2" : EXT_COLOR[extOf(e.name)] || "#80848e";
    badge.textContent = e.is_dir ? "▸" : extOf(e.name).slice(0, 2).toUpperCase();
    row.append(badge, e.name);
    row.oncontextmenu = (ev) => { ev.preventDefault(); fileMenu(ev.clientX, ev.clientY, e); };
    container.appendChild(row);
    if (e.is_dir) {
      const child = document.createElement("div");
      child.style.display = "none";
      container.appendChild(child);
      let loaded = false;
      row.onclick = async () => {
        if (!loaded) { await renderDir(e.path, child, depth + 1); loaded = true; }
        child.style.display = child.style.display === "none" ? "block" : "none";
      };
    } else {
      row.dataset.path = e.path;
      row.onclick = () => { openFile(e.path, e.name); if (mqSmall.matches) toggleSidebar(false); };
    }
  }
}

async function loadProject(root) {
  state.root = root;
  localStorage.setItem("cordium.root", root);
  pushRecent(root);
  refreshGit();
  if (tsActive()) tsLoadProject(loadTsProjectFiles);
  $("project-name").textContent = root.split("/").pop().toUpperCase();
  $("tree").innerHTML = "";
  await renderDir(root, $("tree"));
}

async function openFile(path, name) {
  let tab = state.tabs.find((x) => x.path === path);
  if (!tab) {
    tab = { path, name, doc: await invoke("read_file", { path }) };
    state.tabs.push(tab);
  }
  switchTab(path);
  checkSyntax(tab);
}

function switchTab(path) {
  saveCurrentDoc();
  state.active = path;
  const tab = state.tabs.find((x) => x.path === path);
  const lang = langOf(path);
  $("editor").innerHTML = "";
  state.view = new EditorView({
    parent: $("editor"),
    state: tab.cm || EditorState.create({
      doc: tab.doc,
      extensions: [
        basicSetup, lintGutter(), smartHover(lang === "py" ? "py" : "js", ictx), scrollPastEnd(), wrapC.of(wrap ? EditorView.lineWrapping : []), theme, syntaxHighlighting(highlight),
        lang === "py" ? python() : lang === "plain" ? [] : javascript({ typescript: lang === "ts", jsx: /\.(tsx|jsx)$/.test(path) }),
        lang === "plain" ? [] : autocompletion({ override: [lang === "py" ? pyCompletion(ictx, discordCompletions("py")) : tsCompletion(ictx, discordCompletions("js")), snippetSource(lang === "ts" ? "js" : lang)], icons: false, maxRenderedOptions: 80 }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            const t = state.tabs.find((x) => x.path === state.active);
            if (t && !t.dirty) { t.dirty = true; renderTabs(); }
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => saveCurrentDoc("quiet"), 1500);
          }
          if (!u.selectionSet && !u.docChanged) return;
          const p = u.state.selection.main.head, l = u.state.doc.lineAt(p);
          $("st-pos").textContent = `Ln ${l.number}, Col ${p - l.from + 1}`;
        }),
        keymap.of([{ key: "Mod-s", run: () => { saveCurrentDoc(true); return true; } }]),
      ],
    }),
  });
  renderTabs();
  document.querySelectorAll(".node").forEach((n) => n.classList.toggle("active", n.dataset.path === path));
  state.view.dispatch({ effects: wrapC.reconfigure(wrap ? EditorView.lineWrapping : []) });
  state.view.focus();
  if (smartOn() && (lang === "js" || lang === "ts")) startTs();
  if (smartOn() && lang === "py") warmPy();
}

function saveCurrentDoc(toDisk = false) {
  const tab = state.tabs.find((x) => x.path === state.active);
  if (!tab || !state.view) return;
  tab.doc = state.view.state.doc.toString();
  tab.cm = state.view.state;
  const wasDirty = tab.dirty;
  if (toDisk) invoke("write_file", { path: tab.path, content: tab.doc }).then(() => {
    tab.dirty = false;
    afterSave(tab, wasDirty);
    renderTabs();
    if (toDisk !== "quiet") log("Saved " + tab.name, "l-ok");
  });
}

function renderTabs() {
  const bar = $("tabs");
  bar.innerHTML = "";
  for (const tab of state.tabs) {
    const el = document.createElement("div");
    el.className = "tab" + (tab.path === state.active ? " active" : "");
    el.textContent = (tab.dirty ? "\u25CF " : "") + tab.name;
    const x = document.createElement("span");
    x.className = "x";
    x.textContent = "×";
    x.onclick = (ev) => { ev.stopPropagation(); closeTab(tab.path); };
    el.appendChild(x);
    el.onclick = () => switchTab(tab.path);
    bar.appendChild(el);
  }
}

function closeTab(path) {
  state.tabs = state.tabs.filter((x) => x.path !== path);
  if (state.active === path) {
    state.active = null;
    state.view = null;
    if (state.tabs.length) switchTab(state.tabs[state.tabs.length - 1].path);
    else renderWelcome();
  }
  renderTabs();
}

async function newProject(template) {
  const dir = await open({ directory: true, title: "Choose an empty folder for the bot" });
  if (!dir) return;
  for (const [file, content] of Object.entries(template)) {
    await invoke("write_file", { path: dir + "/" + file, content });
  }
  await loadProject(dir);
  log("Project created in " + dir, "l-ok");
}

async function runBot() {
  showConsoleTab("out");
  state.noRestartUntil = Date.now() + 2500;
  if (!state.root) return log("Open a project first.", "l-err");
  saveCurrentDoc(true);
  const entries = await invoke("list_dir", { path: state.root });
  const names = entries.map((e) => e.name);
  let program, args;
  if (names.includes("main.py")) { program = (await invoke("path_exists", { path: state.root + "/.venv/bin/python" })) ? ".venv/bin/python" : "python3"; args = ["main.py"]; }
  else if (names.includes("index.js")) { program = "node"; args = ["--env-file=.env", "index.js"]; }
  else return log("No main.py or index.js found in the project root.", "l-err");
  log("$ " + program + " " + args.join(" "), "l-sys");
  try {
    await invoke("run_bot", { cwd: state.root, program, args });
    setRunning(true);
  } catch (err) { log(String(err), "l-err"); }
}

function setRunning(on) {
  state.running = on;
  $("btn-run").disabled = on;
  $("btn-stop").disabled = !on;
  $("st-dot").classList.toggle("on", on);
  $("st-bot").textContent = on ? "Bot running" : "Bot stopped";
}

$("btn-open").onclick = async () => {
  const dir = await open({ directory: true });
  if (dir) await loadProject(dir);
};
$("btn-new-py").onclick = () => newProject(PY_TEMPLATE);
$("btn-new-js").onclick = () => newProject(JS_TEMPLATE);
$("btn-run").onclick = runBot;
$("btn-stop").onclick = () => invoke("stop_bot");
$("btn-clear").onclick = () => ($("log").innerHTML = "");

listen("bot-log", (e) => log(e.payload.text, e.payload.is_err ? "l-err" : ""));
listen("bot-exit", () => { log("Process exited.", "l-sys"); setRunning(false); });

initTestChat({ getRoot: () => state.root, saveAll: saveCurrentDoc });

const api = {
  lang: () => (state.active && state.active.endsWith(".py") ? "py" : state.root && state.tabs.some((t) => t.path.endsWith(".py")) ? "py" : "js"),
  insert: (text) => { if (!state.view) return log("Open a file first.", "l-err"); state.view.dispatch(state.view.state.replaceSelection(text)); state.view.focus(); },
  openFile,
  async listFiles() {
    const out = [];
    const walk = async (dir, depth) => {
      for (const e of await invoke("list_dir", { path: dir })) {
        if (e.is_dir) { if (depth < 4) await walk(e.path, depth + 1); }
        else out.push({ name: e.name, path: e.path, rel: e.path.slice(state.root.length + 1) });
      }
    };
    if (state.root) await walk(state.root, 0);
    return out;
  },
};

async function isPython() {
  const names = (await invoke("list_dir", { path: state.root })).map((e) => e.name);
  return names.includes("main.py");
}

async function newModule() {
  if (!state.root) return log("Open a project first.", "l-err");
  const py = await isPython();
  promptName(py ? "New cog" : "New command", "Name", async (n) => {
    const path = py ? `${state.root}/cogs/${n}.py` : `${state.root}/commands/${n}.js`;
    const Name = n[0].toUpperCase() + n.slice(1);
    const content = py
      ? `import discord\nfrom discord import app_commands\nfrom discord.ext import commands\n\n\nclass ${Name}(commands.Cog):\n    def __init__(self, bot):\n        self.bot = bot\n\n\nasync def setup(bot):\n    await bot.add_cog(${Name}(bot))\n`
      : `const { SlashCommandBuilder } = require("discord.js");\n\nmodule.exports = {\n  data: new SlashCommandBuilder().setName("${n}").setDescription("${Name} command"),\n  async execute(interaction) {\n    await interaction.reply("Hello from ${n}!");\n  },\n};\n`;
    await invoke("write_file", { path, content });
    await loadProject(state.root);
    await openFile(path, path.split("/").pop());
  });
}

async function installDeps() {
  if (!state.root) return log("Open a project first.", "l-err");
  const run = async (program, args) => {
    log("$ " + program + " " + args.join(" "), "l-sys");
    const r = await invoke("run_once", { cwd: state.root, program, args });
    if (r.stdout.trim()) log(r.stdout.trim());
    if (r.stderr.trim()) log(r.stderr.trim(), r.code ? "l-err" : "");
    return r.code === 0;
  };
  if (await isPython()) {
    if (!(await invoke("path_exists", { path: state.root + "/.venv/bin/python" })) && !(await run("python3", ["-m", "venv", ".venv"]))) return;
    if (await run(".venv/bin/python", ["-m", "pip", "install", "-r", "requirements.txt"])) log("Dependencies installed in .venv", "l-ok");
  } else if (await run("npm", ["install"])) log("Dependencies installed", "l-ok");
}

async function restartBot() {
  if (state.running) {
    await invoke("stop_bot");
    await new Promise((r) => setTimeout(r, 600));
  }
  runBot();
}

const actions = [
  { label: "Run bot", run: runBot },
  { label: "Restart bot", run: restartBot },
  { label: "Stop bot", run: () => invoke("stop_bot") },
  { label: "Install dependencies", run: installDeps },
  { label: "New cog / command", run: newModule },
  { label: "Slash command builder", run: () => slashBuilder(api) },
  { label: "Embed builder", run: () => embedBuilder(api) },
  { label: "Toggle test chat", run: () => $("btn-test").click() },
  { label: "Open folder", run: () => $("btn-open").click() },
  { label: "Save file", run: () => saveCurrentDoc(true) },
];
$("btn-palette").onclick = () => openPalette(api, actions);
$("btn-slash").onclick = () => slashBuilder(api);
$("btn-embed").onclick = () => embedBuilder(api);
window.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); openPalette(api, actions); }
  else if (mod && e.key.toLowerCase() === "p") { e.preventDefault(); openPalette(api, actions); }
  else if (e.key === "F5") { e.preventDefault(); runBot(); }
});
renderWelcome();
const last = localStorage.getItem("cordium.root");
invoke("startup_path").then((p) => { const target = p || last; if (target) loadProject(target).catch(() => localStorage.removeItem("cordium.root")); });

async function refreshTree() { if (state.root) await loadProject(state.root); }
function closeUnder(p) { state.tabs.filter((t) => t.path === p || t.path.startsWith(p + "/")).forEach((t) => closeTab(t.path)); }

function fileMenu(x, y, entry) {
  if (!state.root) return;
  document.querySelectorAll(".ctx").forEach((m) => m.remove());
  const parent = entry ? entry.path.slice(0, entry.path.lastIndexOf("/")) : state.root;
  const dir = entry && entry.is_dir ? entry.path : parent;
  const items = [
    ["New file", () => promptText("New file", "File name", "", async (n) => { const p = dir + "/" + n; await invoke("write_file", { path: p, content: "" }); await refreshTree(); openFile(p, n); })],
    ["New folder", () => promptText("New folder", "Folder name", "", async (n) => { await invoke("create_dir", { path: dir + "/" + n }); await refreshTree(); })],
  ];
  if (entry) {
    items.push(["Rename", () => promptText("Rename", "New name", entry.name, async (n) => { closeUnder(entry.path); await invoke("rename_path", { from: entry.path, to: parent + "/" + n }); await refreshTree(); })]);
    items.push(["Delete", () => confirmBox('Delete "' + entry.name + '"? This cannot be undone.', async () => { closeUnder(entry.path); await invoke("delete_path", { path: entry.path }); await refreshTree(); })]);
  }
  const menu = document.createElement("div");
  menu.className = "ctx";
  menu.style.left = Math.min(x, window.innerWidth - 180) + "px";
  menu.style.top = Math.min(y, window.innerHeight - 140) + "px";
  for (const [label, fn] of items) {
    const it = document.createElement("div");
    it.textContent = label;
    it.onclick = () => { menu.remove(); fn(); };
    menu.appendChild(it);
  }
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }));
}
$("tree").oncontextmenu = (ev) => { if (ev.target === $("tree")) { ev.preventDefault(); fileMenu(ev.clientX, ev.clientY, null); } };

let fontSize = Number(localStorage.getItem("cordium.fs")) || 14;
const applyFont = () => { document.documentElement.style.setProperty("--code-size", fontSize + "px"); localStorage.setItem("cordium.fs", fontSize); };
applyFont();
window.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  if (e.key === "=" || e.key === "+") fontSize = Math.min(fontSize + 1, 28);
  else if (e.key === "-") fontSize = Math.max(fontSize - 1, 10);
  else if (e.key === "0") fontSize = 14;
  else return;
  e.preventDefault(); applyFont();
});

function toggleTerminal(force) {
  const app = $("app");
  const open = force === undefined ? !app.classList.contains("term-open") : force;
  app.classList.toggle("term-open", open);
  localStorage.setItem("cordium.term", open ? "1" : "0");
  if (open) { $("term-badge").className = ""; $("log").scrollTop = $("log").scrollHeight; if (consoleTab === "term") ensurePty(); }
  else if (state.view) state.view.focus();
}
$("btn-term").onclick = () => toggleTerminal();
actions.push({ label: "Toggle terminal", run: () => toggleTerminal() });
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "`") { e.preventDefault(); toggleTerminal(); }
  else if (e.key === "Escape" && document.activeElement === $("term-input")) toggleTerminal(false);
});
if (localStorage.getItem("cordium.term") === "1") toggleTerminal(true);

// ================= v0.4 features =================
const LINK_RE = /File "([^"]+)", line (\d+)|((?:\.{0,2}\/)?[\w.\-\/]+\.(?:py|js|json)):(\d+)(?::\d+)?/g;
function linkify(span, text) {
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    span.append(text.slice(last, m.index));
    const a = document.createElement("a");
    a.className = "link";
    a.textContent = m[0];
    const p = m[1] || m[3], ln = Number(m[2] || m[4]);
    a.onclick = () => openAt(p, ln);
    span.append(a);
    last = m.index + m[0].length;
  }
  span.append(text.slice(last));
}

async function openAt(p, line) {
  const full = p.startsWith("/") ? p : (state.root || "") + "/" + p.replace(/^\.\//, "");
  if (!(await invoke("path_exists", { path: full }))) return log("File not found: " + full, "l-err");
  await openFile(full, full.split("/").pop());
  const doc = state.view.state.doc;
  const pos = doc.line(Math.min(Math.max(line, 1), doc.lines)).from;
  state.view.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: "center" }) });
  state.view.focus();
}

// ----- welcome screen -----
function pushRecent(root) {
  const list = JSON.parse(localStorage.getItem("cordium.recent") || "[]").filter((r) => r !== root);
  list.unshift(root);
  localStorage.setItem("cordium.recent", JSON.stringify(list.slice(0, 6)));
}
function renderWelcome() {
  const box = document.createElement("div");
  box.className = "welcome";
  const img = document.createElement("img"); img.src = logoUrl;
  const h1 = document.createElement("h1"); h1.textContent = "Cordium";
  const p = document.createElement("p"); p.textContent = "The IDE for Discord bots";
  const row = document.createElement("div"); row.className = "wrow";
  for (const [label, id] of [["Open folder", "btn-open"], ["New discord.py bot", "btn-new-py"], ["New discord.js bot", "btn-new-js"]]) {
    const b = document.createElement("button"); b.textContent = label; b.onclick = () => $(id).click(); row.append(b);
  }
  box.append(img, h1, p, row);
  const recents = JSON.parse(localStorage.getItem("cordium.recent") || "[]");
  if (recents.length) {
    const t = document.createElement("div"); t.className = "wtitle"; t.textContent = "Recent projects"; box.append(t);
    for (const r of recents) {
      const a = document.createElement("div"); a.className = "wrecent"; a.textContent = r.split("/").pop() + "  \u2014  " + r;
      a.onclick = () => loadProject(r).catch((e) => log(String(e), "l-err")); box.append(a);
    }
  }
  const hint = document.createElement("div"); hint.className = "whint"; hint.textContent = "Ctrl+Shift+P command palette  \u00B7  F1 shortcuts";
  box.append(hint);
  $("editor").innerHTML = "";
  $("editor").append(box);
}

// ----- search & replace -----
function showPanel(which) {
  $("tree").style.display = which === "tree" ? "block" : "none";
  $("search-panel").style.display = which === "search" ? "flex" : "none";
  $("tab-explorer").classList.toggle("on", which === "tree");
  $("tab-search").classList.toggle("on", which === "search");
  $("outline-panel").style.display = which === "outline" ? "flex" : "none";
  $("tab-outline").classList.toggle("on", which === "outline");
  if (which === "outline") buildOutline();
  if (which === "search") { $("s-find").focus(); $("s-find").select(); }
}
let lastHits = [];
async function doSearch() {
  const q = $("s-find").value;
  const out = $("s-results");
  if (!q || !state.root) return;
  lastHits = await invoke("search_files", { root: state.root, query: q, caseSensitive: $("s-case").checked });
  out.innerHTML = "";
  const files = {};
  lastHits.forEach((h) => (files[h.rel] ||= []).push(h));
  const head = document.createElement("div"); head.className = "sres-head";
  head.textContent = lastHits.length + " results in " + Object.keys(files).length + " files" + (lastHits.length >= 500 ? " (showing first 500)" : "");
  out.append(head);
  for (const [rel, hits] of Object.entries(files)) {
    const f = document.createElement("div"); f.className = "sres-file"; f.textContent = rel + " (" + hits.length + ")"; out.append(f);
    for (const h of hits) {
      const l = document.createElement("div"); l.className = "sres-line"; l.textContent = h.line + "  " + h.text;
      l.onclick = () => openAt(h.path, h.line); out.append(l);
    }
  }
}
async function replaceAll() {
  const q = $("s-find").value, rep = $("s-replace").value;
  if (!q || !lastHits.length) return;
  const paths = [...new Set(lastHits.map((h) => h.path))];
  confirmBox(`Replace ${lastHits.length} matches in ${paths.length} files?`, async () => {
    saveCurrentDoc("quiet");
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $("s-case").checked ? "g" : "gi");
    for (const p of paths) {
      const next = (await invoke("read_file", { path: p })).replace(re, () => rep);
      await invoke("write_file", { path: p, content: next });
      const tab = state.tabs.find((t) => t.path === p);
      if (!tab) continue;
      tab.doc = next; tab.cm = null; tab.dirty = false;
      if (state.active === p) state.view.dispatch({ changes: { from: 0, to: state.view.state.doc.length, insert: next } });
    }
    renderTabs();
    log(`Replaced in ${paths.length} files`, "l-ok");
    doSearch();
  });
}
$("tab-explorer").onclick = () => showPanel("tree");
$("tab-search").onclick = () => showPanel("search");
$("s-go").onclick = doSearch;
$("s-all").onclick = replaceAll;
$("s-find").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
showPanel("tree");

// ----- syntax check, token guard, auto-restart, format -----
const TOKEN_RE = /[MNO][A-Za-z\d_-]{23,25}\.[\w-]{6}\.[\w-]{27,}/;
async function checkSyntax(tab) {
  if (!state.view || state.active !== tab.path) return;
  let diags = [];
  const py = tab.path.endsWith(".py");
  if (smartOn() && /\.(ts|tsx|mts|cts)$/.test(tab.path)) {
    try {
      const len = state.view.state.doc.length;
      diags = (await tsDiagnostics(tab.path, state.view.state.doc.toString())).map((x) => ({ from: Math.min(x.from, len), to: Math.min(Math.max(x.to, x.from + 1), len), severity: x.severity, message: x.message }));
    } catch { /* worker not ready */ }
  }
  if (py || tab.path.endsWith(".js")) {
    try {
      const r = await invoke("run_once", { cwd: state.root, program: py ? "python3" : "node", args: py ? ["-m", "py_compile", tab.path] : ["--check", tab.path] });
      if (r.code !== 0) {
        const err = r.stderr;
        const m = py ? err.match(/line (\d+)/) : err.match(/:(\d+)\n/);
        const msg = (err.trim().split("\n").filter((l) => /Error/.test(l)).pop() || "Syntax error").trim();
        const doc = state.view.state.doc;
        const ln = doc.line(Math.min(Math.max(m ? Number(m[1]) : 1, 1), doc.lines));
        diags = [{ from: ln.from, to: ln.to, severity: "error", message: msg }];
      }
    } catch { /* interpreter missing: skip */ }
  }
  if (!state.view || state.active !== tab.path) return;
  if (!diags.length && (py || tab.path.endsWith(".js"))) diags.push(...botLint(py ? "py" : "js", state.view.state.doc.toString()));
  state.view.dispatch(setDiagnostics(state.view.state, diags));
  const errs = diags.filter((d) => d.severity === "error").length, warns = diags.length - errs;
  $("st-problems").textContent = errs ? "\u2716 " + errs + " error" : warns ? "\u26A0 " + warns + " warning" + (warns > 1 ? "s" : "") : "\u2714 No problems";
  $("st-problems").className = errs ? "bad" : warns ? "warn" : "";
}

let autoRestart = localStorage.getItem("cordium.ar") === "1";
const paintAr = () => { $("btn-ar").textContent = "\u21BB Auto-restart: " + (autoRestart ? "on" : "off"); $("btn-ar").classList.toggle("on", autoRestart); };
paintAr();
$("btn-ar").onclick = () => { autoRestart = !autoRestart; localStorage.setItem("cordium.ar", autoRestart ? "1" : "0"); paintAr(); };

afterSave = (tab, wasDirty) => {
  if (tsActive() && /\.(js|mjs|cjs|jsx|ts|tsx)$/.test(tab.path)) tsUpdate(tab.path, tab.doc);
  if ($("outline-panel").style.display === "flex") buildOutline();
  if (!tab.path.endsWith(".env") && TOKEN_RE.test(tab.doc)) log("Warning: " + tab.name + " seems to contain a Discord token. Move it to .env (key button on the left).", "l-err");
  checkSyntax(tab);
  if (autoRestart && wasDirty && state.running && /\.(py|js)$/.test(tab.path) && Date.now() > (state.noRestartUntil || 0)) {
    clearTimeout(arTimer);
    arTimer = setTimeout(() => { log("Auto-restart: " + tab.name + " changed", "l-sys"); restartBot(); }, 700);
  }
};

async function formatDoc() {
  const tab = state.tabs.find((x) => x.path === state.active);
  if (!tab || !state.view) return;
  tab.doc = state.view.state.doc.toString();
  await invoke("write_file", { path: tab.path, content: tab.doc });
  let r;
  if (tab.path.endsWith(".py")) r = await invoke("run_once", { cwd: state.root, program: "python3", args: ["-m", "black", "-q", tab.path] });
  else if (/\.(js|json|css|html)$/.test(tab.path)) r = await invoke("run_once", { cwd: state.root, program: "npx", args: ["--no-install", "prettier", "--write", tab.path] });
  else return log("No formatter for this file type.", "l-err");
  if (r.code !== 0) return log(/No module named|not found|could not determine|command not found/i.test(r.stderr) ? "Formatter not installed. Run in the terminal:  pip install black   (or for JS:  npm i -D prettier)" : (r.stderr.trim() || "Format failed"), "l-err");
  const fresh = await invoke("read_file", { path: tab.path });
  state.view.dispatch({ changes: { from: 0, to: state.view.state.doc.length, insert: fresh } });
  tab.dirty = false; renderTabs();
  log("Formatted " + tab.name, "l-ok");
}

// ----- git -----
async function refreshGit() {
  if (!state.root) return;
  try {
    const r = await invoke("run_once", { cwd: state.root, program: "git", args: ["rev-parse", "--abbrev-ref", "HEAD"] });
    $("st-git").textContent = r.code === 0 ? "\u2387 " + r.stdout.trim() : "";
  } catch { $("st-git").textContent = ""; }
}
async function gitDo(args) {
  if (!state.root) return log("Open a project first.", "l-err");
  log("$ git " + args.join(" "), "l-sys");
  const r = await invoke("run_once", { cwd: state.root, program: "git", args });
  if (r.stdout.trim()) log(r.stdout.trim());
  if (r.stderr.trim()) log(r.stderr.trim(), r.code ? "l-err" : "");
  refreshGit();
  return r.code === 0;
}
function gitCommit() {
  promptText("Git commit", "Commit message", "", async (msg) => { if (await gitDo(["add", "-A"])) gitDo(["commit", "-m", msg]); }, true);
}

// ----- wire up -----
Object.assign(api, {
  root: () => state.root,
  read: (path) => invoke("read_file", { path }),
  write: (path, content) => invoke("write_file", { path, content }),
  exists: (path) => invoke("path_exists", { path }),
  log,
});
$("btn-invite").onclick = () => inviteBuilder(api);
$("btn-env").onclick = () => (state.root ? envManager(api) : log("Open a project first.", "l-err"));
actions.push(
  { label: "Search in project", run: () => showPanel("search") },
  { label: "Format document", run: formatDoc },
  { label: "Invite link & intents calculator", run: () => inviteBuilder(api) },
  { label: "Environment (.env) manager", run: () => (state.root ? envManager(api) : log("Open a project first.", "l-err")) },
  { label: "Toggle auto-restart on save", run: () => $("btn-ar").click() },
  { label: "Keyboard shortcuts", run: shortcutsModal },
  { label: "Git: commit all", run: gitCommit },
  { label: "Git: push", run: () => gitDo(["push"]) },
  { label: "Git: pull", run: () => gitDo(["pull"]) },
  { label: "Git: init repository", run: () => gitDo(["init"]) },
  ...Object.entries(THEMES).map(([k, t]) => ({ label: "Theme: " + t.name, run: () => setTheme(k) })),
  { label: "Choose theme...", run: openThemePicker },
  { label: "Toggle explorer sidebar", run: () => toggleSidebar() },
  { label: "Toggle word wrap", run: () => toggleWrap() },
);
window.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); showPanel("search"); }
  else if (e.altKey && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); formatDoc(); }
  else if (e.key === "F1") { e.preventDefault(); shortcutsModal(); }
});

window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "s" && !e.defaultPrevented) { e.preventDefault(); saveCurrentDoc(true); }
});

// ================= v0.5: layout, sidebar toggle, terminal =================
const mqSmall = window.matchMedia("(max-width: 760px)");
let sidePref = localStorage.getItem("cordium.side") !== "0";
function toggleSidebar(force) {
  const app = $("app");
  const open = force === undefined ? app.classList.contains("side-closed") : force;
  app.classList.toggle("side-closed", !open);
  if (!mqSmall.matches) { sidePref = open; localStorage.setItem("cordium.side", open ? "1" : "0"); }
}
function applySideForWidth() { $("app").classList.toggle("side-closed", mqSmall.matches ? true : !sidePref); }
mqSmall.addEventListener("change", applySideForWidth);
applySideForWidth();

function syncUi() {
  const app = $("app");
  const side = !app.classList.contains("side-closed"), test = app.classList.contains("test-open"), term = app.classList.contains("term-open");
  $("btn-explorer").classList.toggle("on", side);
  $("btn-test").classList.toggle("on", test);
  $("btn-term").classList.toggle("on", term);
  const overlay = (mqSmall.matches && side) || (window.innerWidth <= 860 && test);
  $("scrim").style.display = overlay ? "block" : "none";
}
new MutationObserver(syncUi).observe($("app"), { attributes: true, attributeFilter: ["class"] });
window.addEventListener("resize", () => { syncUi(); if (term && consoleTab === "term" && $("app").classList.contains("term-open")) fitAddon.fit(); });
$("scrim").onclick = () => {
  if (mqSmall.matches) toggleSidebar(false);
  if (window.innerWidth <= 860 && $("app").classList.contains("test-open")) $("btn-test").click();
};
$("btn-explorer").onclick = () => toggleSidebar();
$("btn-collapse").onclick = () => toggleSidebar(false);
$("btn-search-rail").onclick = () => { toggleSidebar(true); showPanel("search"); };
$("btn-theme").onclick = openThemePicker;
$("btn-close-term").onclick = () => toggleTerminal(false);

function drag(el, onMove) {
  el.addEventListener("mousedown", (e) => {
    e.preventDefault();
    document.body.classList.add("dragging");
    const up = () => { document.body.classList.remove("dragging"); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", up); if (term && consoleTab === "term") fitAddon.fit(); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", up);
  });
}
const root = document.documentElement;
const savedSide = Number(localStorage.getItem("cordium.sidew")), savedTerm = Number(localStorage.getItem("cordium.termh"));
if (savedSide) root.style.setProperty("--side-w", savedSide + "px");
if (savedTerm) root.style.setProperty("--term-h", savedTerm + "px");
drag($("side-grip"), (ev) => {
  const w = Math.round(Math.min(Math.max(ev.clientX - 64, 180), 520));
  root.style.setProperty("--side-w", w + "px"); localStorage.setItem("cordium.sidew", w);
});
drag($("term-grip"), (ev) => {
  const h = Math.round(Math.min(Math.max(window.innerHeight - ev.clientY - 34, 110), window.innerHeight * 0.58));
  root.style.setProperty("--term-h", h + "px"); localStorage.setItem("cordium.termh", h);
  document.body.style.cursor = "row-resize";
});
window.addEventListener("mouseup", () => { document.body.style.cursor = ""; });

// ----- word wrap -----
function paintWrap() { $("btn-wrap").textContent = "Wrap: " + (wrap ? "on" : "off"); }
function toggleWrap() {
  wrap = !wrap;
  localStorage.setItem("cordium.wrap", wrap ? "1" : "0");
  if (state.view) state.view.dispatch({ effects: wrapC.reconfigure(wrap ? EditorView.lineWrapping : []) });
  paintWrap();
}
$("btn-wrap").onclick = toggleWrap;
paintWrap();

// ----- real terminal (PTY) -----
function termTheme() {
  const cs = getComputedStyle(document.documentElement), g = (n) => cs.getPropertyValue(n).trim();
  return { background: g("--bg-rail"), foreground: g("--text"), cursor: g("--brand"), selectionBackground: "rgba(130,140,255,.35)" };
}
async function ensurePty() {
  if (!term) {
    term = new Terminal({ fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--code-font"), fontSize: 13, cursorBlink: true, theme: termTheme(), scrollback: 5000 });
    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open($("xterm"));
    term.onData((d) => invoke("pty_write", { data: d }));
    term.onResize(({ cols, rows }) => invoke("pty_resize", { cols, rows }));
    listen("pty-data", (e) => term.write(e.payload));
    listen("pty-exit", (e) => { if (e.payload.gen === ptyGen) { ptyGen = 0; term.write("\r\n[shell exited - click the Terminal tab to start a new one]\r\n"); } });
    new ResizeObserver(() => { if (consoleTab === "term" && $("app").classList.contains("term-open")) fitAddon.fit(); }).observe($("xterm"));
    window.addEventListener("cordium-theme", () => { term.options.theme = termTheme(); });
  }
  fitAddon.fit();
  if (!ptyGen || ptyRoot !== (state.root || "")) {
    term.reset();
    ptyRoot = state.root || "";
    ptyGen = await invoke("pty_open", { cwd: ptyRoot, cols: term.cols || 80, rows: term.rows || 24 });
  }
  term.focus();
}
function showConsoleTab(which) {
  consoleTab = which;
  localStorage.setItem("cordium.ctab", which);
  $("console").classList.toggle("show-term", which === "term");
  $("ctab-out").classList.toggle("on", which === "out");
  $("ctab-term").classList.toggle("on", which === "term");
  if (which === "term" && $("app").classList.contains("term-open")) requestAnimationFrame(() => ensurePty().catch((e) => log(String(e), "l-err")));
}
$("ctab-out").onclick = () => showConsoleTab("out");
$("ctab-term").onclick = () => showConsoleTab("term");
showConsoleTab(consoleTab);
if (consoleTab === "term" && $("app").classList.contains("term-open")) ensurePty().catch(() => {});

// ----- keys + init -----
window.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && !e.shiftKey && e.key.toLowerCase() === "b") { e.preventDefault(); toggleSidebar(); }
  else if (e.altKey && !e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); toggleWrap(); }
});
paintIcons();
syncUi();

// ================= v0.6 features =================
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; document.body.append(t);
  setTimeout(() => t.classList.add("out"), 1800); setTimeout(() => t.remove(), 2300);
}
async function addFiles(files) {
  if (!state.root) return log("Open a project first.", "l-err");
  let first = null;
  for (const [rel, content] of Object.entries(files)) {
    const p = state.root + "/" + rel;
    if (await invoke("path_exists", { path: p })) { log("Skipped (already exists): " + rel, "l-err"); continue; }
    await invoke("write_file", { path: p, content });
    first = first || p;
    log("Added " + rel, "l-ok");
  }
  await refreshTree();
  if (first) openFile(first, first.split("/").pop());
}
Object.assign(api, { isPython, addFiles, toast });

// ----- bot outline -----
async function buildOutline() {
  const box = $("outline-list");
  if (!state.root) { box.textContent = "Open a project first."; return; }
  const files = (await api.listFiles()).filter((f) => /\.(py|js)$/.test(f.name)).slice(0, 80);
  const groups = { Commands: [], Events: [], Cogs: [] };
  for (const f of files) {
    let text;
    try { text = await invoke("read_file", { path: f.path }); } catch { continue; }
    let pending = null;
    text.split("\n").forEach((ln, i) => {
      const at = { f, line: i + 1 };
      let m;
      if (f.name.endsWith(".py")) {
        if ((m = ln.match(/@app_commands\.command\(([^)]*)\)/))) {
          const n = m[1].match(/name\s*=\s*["']([^"']+)/);
          if (n) groups.Commands.push({ label: "/" + n[1], ...at }); else pending = "slash";
        } else if (/@(?:bot|commands)\.(?:hybrid_)?command\(/.test(ln)) pending = "prefix";
        else if (/@commands\.Cog\.listener\(|@(?:bot|client)\.event/.test(ln)) pending = "event";
        else if ((m = ln.match(/^\s*(?:async\s+)?def\s+(\w+)/)) && pending) {
          groups[pending === "event" ? "Events" : "Commands"].push({ label: (pending === "slash" ? "/" : pending === "prefix" ? "!" : "") + m[1], ...at });
          pending = null;
        } else if ((m = ln.match(/^class\s+(\w+)\(.*Cog/))) groups.Cogs.push({ label: m[1], ...at });
      } else {
        if ((m = ln.match(/setName\(\s*["']([^"']+)["']/))) groups.Commands.push({ label: "/" + m[1], ...at });
        if ((m = ln.match(/client\.(?:on|once)\(\s*(?:Events\.(\w+)|["'](\w+)["'])/))) groups.Events.push({ label: m[1] || m[2], ...at });
      }
    });
  }
  box.innerHTML = "";
  let any = false;
  for (const [title, list] of Object.entries(groups)) {
    if (!list.length) continue;
    any = true;
    const hd = document.createElement("div"); hd.className = "ohead"; hd.textContent = title + " (" + list.length + ")"; box.append(hd);
    for (const it of list) {
      const row = document.createElement("div"); row.className = "oline";
      const a = document.createElement("span"); a.textContent = it.label;
      const b = document.createElement("small"); b.textContent = it.f.name + ":" + it.line;
      row.append(a, b); row.onclick = () => openAt(it.f.path, it.line); box.append(row);
    }
  }
  if (!any) box.textContent = "No commands or events found yet.";
}
$("tab-outline").onclick = () => showPanel("outline");

// ----- check all files, zen mode, snippets -----
async function checkAll() {
  if (!state.root) return log("Open a project first.", "l-err");
  toggleTerminal(true); showConsoleTab("out");
  const files = (await api.listFiles()).filter((f) => /\.(py|js)$/.test(f.name));
  let bad = 0;
  for (const f of files) {
    const py = f.name.endsWith(".py");
    const r = await invoke("run_once", { cwd: state.root, program: py ? "python3" : "node", args: py ? ["-m", "py_compile", f.path] : ["--check", f.path] });
    if (r.code === 0) continue;
    bad++;
    const m = py ? r.stderr.match(/line (\d+)/) : r.stderr.match(/:(\d+)\n/);
    log(f.rel + ": " + (r.stderr.trim().split("\n").filter((l) => /Error/.test(l)).pop() || "syntax error"), "l-err");
    if (m) log("  " + f.path + ":" + m[1], "l-sys");
  }
  log(bad ? bad + " file(s) with errors" : "Checked " + files.length + " files: no syntax errors", bad ? "l-err" : "l-ok");
}
function toggleZen() {
  const on = $("app").classList.toggle("zen");
  if (on) toast("Zen mode \u2014 press Ctrl+Alt+Z to exit");
}
function saveSelectionSnippet() {
  const sel = state.view ? state.view.state.sliceDoc(state.view.state.selection.main.from, state.view.state.selection.main.to) : "";
  snippetsManager(api, sel);
}
$("btn-modules").onclick = () => (state.root ? modulesGallery(api) : log("Open a project first.", "l-err"));
actions.push(
  { label: "Add ready-made module...", run: () => (state.root ? modulesGallery(api) : log("Open a project first.", "l-err")) },
  { label: "Components builder (button / select / modal)", run: () => componentsBuilder(api) },
  { label: "My snippets...", run: () => snippetsManager(api) },
  { label: "Save selection as snippet", run: saveSelectionSnippet },
  { label: "Show bot outline", run: () => { toggleSidebar(true); showPanel("outline"); } },
  { label: "Check all files for syntax errors", run: checkAll },
  { label: "Zen mode", run: toggleZen },
);
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === "z") { e.preventDefault(); toggleZen(); }
});
paintIcons();

// ================= v0.7: code intelligence + fonts =================
async function loadTsProjectFiles() {
  const out = {};
  if (!state.root) return out;
  const list = (await api.listFiles()).filter((f) => /\.(js|mjs|cjs|jsx|ts|tsx)$/.test(f.name)).slice(0, 300);
  for (const f of list) { try { out[f.path] = await invoke("read_file", { path: f.path }); } catch { /* skip */ } }
  return out;
}
function startTs() { return tsStart(loadTsProjectFiles).catch((e) => log("JS/TS intelligence failed to start: " + e.message, "l-err")); }
let warmedRoot = null;
function warmPy() { if (state.root && warmedRoot !== state.root) { warmedRoot = state.root; pyWarm(state.root); } }
$("btn-font").onclick = openFontPicker;
actions.push({ label: "Choose font...", run: openFontPicker });
window.addEventListener("cordium-font", () => {
  if (term) { term.options.fontFamily = getComputedStyle(document.documentElement).getPropertyValue("--code-font"); fitAddon.fit(); }
});

actions.push({ label: "Toggle smart code intelligence (more RAM) / light mode", run: () => {
  const on = !smartOn();
  localStorage.setItem("cordium.smart", on ? "1" : "0");
  toast(on ? "Smart intelligence ON \u2014 reopen your files to apply" : "Light mode ON \u2014 restart Cordium to free the RAM");
} });
