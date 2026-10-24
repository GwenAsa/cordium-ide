import ts from "typescript";

const files = new Map();     // absolute virtual path -> { text, version }
const projectPaths = new Set();
const dirs = new Set(["/"]);
const NODE_TYPES = "/node_modules/@types/node/index.d.ts";

const OPTIONS = {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10,
  allowJs: true, checkJs: false, esModuleInterop: true, allowSyntheticDefaultImports: true, skipLibCheck: true,
  noEmit: true, strict: false, lib: ["es2022"], types: [], resolveJsonModule: true,
};

function addDirs(p) {
  let d = p.slice(0, p.lastIndexOf("/"));
  while (d && !dirs.has(d)) { dirs.add(d); d = d.slice(0, d.lastIndexOf("/")); }
}
function put(path, text) {
  const prev = files.get(path);
  files.set(path, { text, version: prev ? prev.version + 1 : 1 });
  addDirs(path);
}

const host = {
  getCompilationSettings: () => OPTIONS,
  getScriptFileNames: () => [...projectPaths, NODE_TYPES],
  getScriptVersion: (f) => String(files.has(f) ? files.get(f).version : 0),
  getScriptSnapshot: (f) => (files.has(f) ? ts.ScriptSnapshot.fromString(files.get(f).text) : undefined),
  getCurrentDirectory: () => "/",
  getDefaultLibFileName: () => "/lib/lib.es2022.d.ts",
  fileExists: (f) => files.has(f),
  readFile: (f) => (files.has(f) ? files.get(f).text : undefined),
  directoryExists: (d) => dirs.has(d),
  getDirectories: (d) => [...dirs].filter((x) => x !== d && x.startsWith(d === "/" ? "/" : d + "/") && !x.slice(d.length + 1).includes("/")).map((x) => x.slice(x.lastIndexOf("/") + 1)),
  realpath: (p) => p,
  useCaseSensitiveFileNames: () => true,
};
const ls = ts.createLanguageService(host, ts.createDocumentRegistry());

const KIND = { method: "method", function: "function", "local function": "function", class: "class", interface: "interface", property: "property", getter: "property", setter: "property", var: "variable", let: "variable", const: "variable", "local var": "variable", parameter: "variable", keyword: "keyword", enum: "enum", "enum member": "constant", module: "namespace", type: "type", alias: "variable", "type parameter": "type" };
const plain = (parts) => (parts || []).map((p) => p.text).join("");

const ops = {
  async init({ bundleUrl }) {
    const bundle = await (await fetch(bundleUrl)).json();
    for (const [p, t] of Object.entries(bundle)) put(p, t);
    return true;
  },
  setFiles({ list }) {
    for (const [p, t] of Object.entries(list)) { put(p, t); projectPaths.add(p); }
    return true;
  },
  setFile({ path, text }) {
    const cur = files.get(path);
    if (!cur || cur.text !== text) put(path, text);
    projectPaths.add(path);
    return true;
  },
  complete({ path, pos }) {
    const r = ls.getCompletionsAtPosition(path, pos, { includeCompletionsWithInsertText: true, includeCompletionsForModuleExports: false });
    if (!r) return [];
    return r.entries.slice(0, 400).map((e) => ({ name: e.name, kind: KIND[e.kind] || "text", rawKind: e.kind, sort: e.sortText }));
  },
  details({ path, pos, name }) {
    const d = ls.getCompletionEntryDetails(path, pos, name, {}, undefined, {}, undefined);
    if (!d) return null;
    return { sig: plain(d.displayParts), doc: plain(d.documentation) };
  },
  hover({ path, pos }) {
    const q = ls.getQuickInfoAtPosition(path, pos);
    if (!q) return null;
    return { sig: plain(q.displayParts), doc: plain(q.documentation), from: q.textSpan.start, to: q.textSpan.start + q.textSpan.length };
  },
  diagnostics({ path }) {
    const all = [...ls.getSyntacticDiagnostics(path), ...ls.getSemanticDiagnostics(path)];
    return all.filter((d) => d.start !== undefined && d.category < 2).map((d) => ({
      from: d.start, to: d.start + (d.length || 1), severity: d.category === 1 ? "error" : "warning", message: ts.flattenDiagnosticMessageText(d.messageText, "\n"),
    }));
  },
};

self.onmessage = async (e) => {
  const { id, op, args } = e.data;
  try { self.postMessage({ id, result: await ops[op](args || {}) }); }
  catch (err) { self.postMessage({ id, error: String((err && err.message) || err) }); }
};
