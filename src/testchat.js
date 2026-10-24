import { invoke } from "@tauri-apps/api/core";
import { PY_HARNESS, JS_HARNESS } from "./harness.js";

const $ = (id) => document.getElementById(id);
let ctx;
let commands = [];
let kind = "py";
let lastWarns = [];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function renderEmbed(d) {
  const box = el("div", "embed");
  box.style.borderLeftColor = d.color ? "#" + d.color.toString(16).padStart(6, "0") : "#1e1f22";
  if (d.author) box.appendChild(el("div", "e-author", d.author.name));
  if (d.title) box.appendChild(el("div", "e-title", d.title));
  if (d.description) box.appendChild(el("div", "e-desc", d.description));
  if (d.fields) {
    const grid = el("div", "e-fields");
    for (const f of d.fields) {
      const cell = el("div", f.inline ? "e-field inline" : "e-field");
      cell.append(el("div", "e-fname", f.name), el("div", "e-fval", f.value));
      grid.appendChild(cell);
    }
    box.appendChild(grid);
  }
  if (d.footer) box.appendChild(el("div", "e-footer", d.footer.text));
  return box;
}

function addMessage(who, content, embeds = [], ephemeral = false) {
  const msg = el("div", "msg");
  const avatar = el("div", who === "bot" ? "avatar bot" : "avatar", who === "bot" ? "B" : "T");
  const body = el("div", "msg-body");
  const head = el("div", "msg-head");
  head.append(el("span", "msg-name", who === "bot" ? "Your Bot" : "TestUser"));
  if (who === "bot") head.append(el("span", "tag", "APP"));
  if (ephemeral) head.append(el("span", "eph", "Only you can see this"));
  body.appendChild(head);
  if (content) body.appendChild(el("div", "msg-text", content));
  embeds.forEach((d) => body.appendChild(renderEmbed(d)));
  msg.append(avatar, body);
  $("chat").appendChild(msg);
  $("chat").scrollTop = $("chat").scrollHeight;
}

async function runHarness(args) {
  const root = ctx.getRoot();
  const py = kind === "py";
  await invoke("write_file", { path: root + (py ? "/.cordium/harness.py" : "/.cordium/harness.js"), content: py ? PY_HARNESS : JS_HARNESS });
  const res = await invoke("run_once", { cwd: root, program: py ? "python3" : "node", args: [py ? ".cordium/harness.py" : ".cordium/harness.js", ...args] });
  const line = res.stdout.split("\n").find((l) => l.startsWith("@@RESULT@@"));
  const warns = res.stdout.split("\n").filter((l) => l.startsWith("@@WARN@@")).map((l) => l.slice(8));
  if (warns.length) lastWarns = warns;
  if (!line) throw new Error(res.stderr.trim().split("\n").pop() || "No output from harness");
  return JSON.parse(line.slice(10));
}

async function refresh() {
  const root = ctx.getRoot();
  if (!root) return addMessage("bot", "Open a project first.");
  const names = (await invoke("list_dir", { path: root })).map((e) => e.name);
  if (names.includes("main.py")) kind = "py";
  else if (names.includes("index.js")) kind = "js";
  else return addMessage("bot", "Test Chat needs a main.py (discord.py) or index.js (discord.js) project.");
  ctx.saveAll(true);
  try {
    lastWarns = [];
    const res = await runHarness(["list"]);
    if (res.error) throw new Error(res.error);
    commands = res;
  } catch (e) { commands = []; return addMessage("bot", "Could not load commands: " + e.message + (/Cannot find module/.test(e.message) ? " (run Install dependencies first)" : "")); }
  const bar = $("cmd-list");
  bar.innerHTML = "";
  for (const c of commands) {
    const chip = el("button", "chip", "/" + c.name);
    chip.title = c.description;
    chip.onclick = () => { $("chat-input").value = "/" + c.name + " "; $("chat-input").focus(); };
    bar.appendChild(chip);
  }
  if (lastWarns.length) addMessage("bot", "\u26A0 Skipped files with errors:\n" + lastWarns.join("\n"));
  if (!commands.length) addMessage("bot", "No slash commands found.");
}

function parseInput(text) {
  const tokens = text.trim().match(/"[^"]*"|\S+/g) || [];
  const name = (tokens.shift() || "").replace(/^\//, "");
  const cmd = commands.find((c) => c.name === name);
  if (!cmd) return null;
  const args = {};
  const free = cmd.params.map((p) => p.name);
  for (const tok of tokens) {
    const m = tok.match(/^(\w+)=(.*)$/);
    const strip = (v) => v.replace(/^"|"$/g, "");
    if (m) { args[m[1]] = strip(m[2]); free.splice(free.indexOf(m[1]), 1); }
    else if (free.length) args[free.shift()] = strip(tok);
  }
  return { cmd, args };
}

async function send() {
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMessage("user", text);
  const parsed = parseInput(text);
  if (!parsed) return addMessage("bot", "Unknown command. Click a command chip above.");
  try {
    const res = await runHarness(["call", parsed.cmd.name, JSON.stringify(parsed.args)]);
    if (res.error) return addMessage("bot", "Error: " + res.error);
    if (!res.messages.length) addMessage("bot", "(the command sent no response)");
    res.messages.forEach((m) => addMessage("bot", m.content, m.embeds, m.ephemeral));
  } catch (e) { addMessage("bot", "Error: " + e.message); }
}

export function initTestChat(context) {
  ctx = context;
  $("btn-test").onclick = () => {
    const open = $("app").classList.toggle("test-open");
    if (open && !commands.length) refresh();
  };
  $("btn-test-refresh").onclick = refresh;
  $("chat-input").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
}
