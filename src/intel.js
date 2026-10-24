// Code intelligence for Python (Jedi, via Rust) and JavaScript/TypeScript (TypeScript language service in a worker).
import { invoke } from "@tauri-apps/api/core";
import { hoverTooltip } from "@codemirror/view";
import { staticDoc } from "./docs.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dom = (sig, doc) => {
  const d = document.createElement("div");
  d.className = "hoverdoc";
  const c = document.createElement("code"); c.textContent = sig; d.append(c);
  if (doc) { const p = document.createElement("div"); p.textContent = doc.length > 700 ? doc.slice(0, 700) + "..." : doc; d.append(p); }
  return d;
};

// ---------------- Python (Jedi) ----------------
let seq = 0;
async function py(o) {
  const raw = await invoke("py_ls", { request: JSON.stringify({ id: ++seq, ...o }) });
  const r = JSON.parse(raw);
  if (!r.ok) throw new Error(r.error);
  return r.result;
}
export const pyWarm = (root) => py({ op: "complete", code: "import discord\ndiscord.", line: 2, col: 8, root, path: root + "/.cordium_warm.py" }).catch(() => {});
const PYTYPE = { module: "namespace", class: "class", instance: "variable", function: "function", param: "variable", path: "text", keyword: "keyword", property: "property", statement: "variable" };

export function pyCompletion(ctx, fallback) {
  return async (context) => {
    if (ctx().smart === false) return fallback ? fallback(context) : null;
    const w = context.matchBefore(/\w*/);
    const prev = context.state.sliceDoc(Math.max(0, context.pos - 1), context.pos);
    if (!context.explicit && w.from === w.to && prev !== ".") return null;
    await sleep(40);
    if (context.aborted) return null;
    const { root, path } = ctx();
    const line = context.state.doc.lineAt(context.pos);
    try {
      const items = await py({ op: "complete", code: context.state.doc.toString(), line: line.number, col: context.pos - line.from, root: root || "/tmp", path });
      if (context.aborted) return null;
      return { from: w.from, validFor: /^\w*$/, options: items.map((c) => ({ label: c.name, type: PYTYPE[c.type] || "text", detail: c.type })) };
    } catch { return fallback ? fallback(context) : null; }
  };
}

// ---------------- JS / TS (language service worker) ----------------
let worker = null, ready = null, wseq = 0;
const waiting = new Map(), sent = new Map();
function call(op, args) {
  return new Promise((resolve, reject) => {
    const id = ++wseq;
    waiting.set(id, { resolve, reject });
    worker.postMessage({ id, op, args });
  });
}
export function tsStart(loadProjectFiles) {
  if (ready) return ready;
  worker = new Worker(new URL("./ts-worker.js", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    const w = waiting.get(e.data.id);
    if (!w) return;
    waiting.delete(e.data.id);
    e.data.error ? w.reject(new Error(e.data.error)) : w.resolve(e.data.result);
  };
  worker.onerror = (e) => console.error("ts worker", e.message);
  ready = call("init", { bundleUrl: location.origin + "/types/bundle.json" }).then(async () => { if (loadProjectFiles) await call("setFiles", { list: await loadProjectFiles() }); return true; });
  return ready;
}
export const tsReset = () => { sent.clear(); };
async function sync(path, text) {
  await ready;
  if (sent.get(path) !== text) { sent.set(path, text); await call("setFile", { path, text }); }
}
export async function tsDiagnostics(path, text) { await tsStart(); await sync(path, text); return call("diagnostics", { path }); }

export function tsCompletion(ctx, fallback) {
  return async (context) => {
    if (ctx().smart === false) return fallback ? fallback(context) : null;
    const w = context.matchBefore(/[\w$]*/);
    const prev = context.state.sliceDoc(Math.max(0, context.pos - 1), context.pos);
    if (!context.explicit && w.from === w.to && prev !== ".") return null;
    await sleep(40);
    if (context.aborted) return null;
    const { path } = ctx();
    try {
      await tsStart();
      await sync(path, context.state.doc.toString());
      if (context.aborted) return null;
      const items = await call("complete", { path, pos: context.pos });
      if (context.aborted) return null;
      return {
        from: w.from, validFor: /^[\w$]*$/,
        options: items.map((e) => ({
          label: e.name, type: e.kind, boost: -Number.parseInt(e.sort, 36) / 1e9 || 0,
          info: async () => { try { const d = await call("details", { path, pos: context.pos, name: e.name }); return d ? dom(d.sig, d.doc) : null; } catch { return null; } },
        })),
      };
    } catch { return fallback ? fallback(context) : null; }
  };
}

// ---------------- hover (smart first, static docs as fallback) ----------------
export function smartHover(lang, ctx) {
  return hoverTooltip(async (view, pos) => {
    const line = view.state.doc.lineAt(pos), col = pos - line.from;
    const re = /[A-Za-z_$][\w$]*/g;
    let m, hit = null;
    while ((m = re.exec(line.text))) { if (m.index <= col && col <= m.index + m[0].length) { hit = m; break; } }
    if (!hit) return null;
    const from = line.from + hit.index, to = from + hit[0].length;
    const { root, path, smart } = ctx();
    try {
      if (smart === false) throw new Error("light mode");
      if (lang === "py") {
        const r = await py({ op: "hover", code: view.state.doc.toString(), line: line.number, col: hit.index + 1, root: root || "/tmp", path });
        if (r && r.head) return { pos: from, end: to, above: true, create: () => ({ dom: dom(r.head, r.doc) }) };
      } else if (ready) {
        await sync(path, view.state.doc.toString());
        const r = await call("hover", { path, pos });
        if (r && r.sig) return { pos: from, end: to, above: true, create: () => ({ dom: dom(r.sig, r.doc) }) };
      }
    } catch { /* fall through to static docs */ }
    const d = staticDoc(hit[0]);
    return d ? { pos: from, end: to, above: true, create: () => ({ dom: dom(d[0], d[1]) }) } : null;
  }, { hoverTime: 350 });
}

export const tsActive = () => !!ready;
export async function tsUpdate(path, text) { if (ready) { try { await sync(path, text); } catch { /* ignore */ } } }
export async function tsLoadProject(fn) { if (!ready) return; await ready; await call("setFiles", { list: await fn() }); }
