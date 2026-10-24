// Rebuilds public/types/bundle.json: discord.js typings, @types/node and the TypeScript lib files
// used by the in-app language service.   Usage: node scripts/refresh-types-bundle.mjs
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cordium-types-"));
execSync("npm init -y", { cwd: tmp, stdio: "ignore" });
execSync("npm install --no-audit --no-fund discord.js @types/node typescript@5.9", { cwd: tmp, stdio: "inherit" });

const out = {};
const skipOldApi = /[\\/](v6|v8|v9|v10-?old|rpc|voice)[\\/]/;
function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name), r = rel + "/" + e.name;
    if (e.isDirectory()) { walk(p, r); continue; }
    const isTypes = /\.d\.(ts|mts|cts)$/.test(e.name);
    if (!isTypes && e.name !== "package.json") continue;
    if (/typescript\//.test(r) || (skipOldApi.test(r) && /discord-api-types/.test(r))) continue;
    let text = fs.readFileSync(p, "utf8");
    if (e.name === "package.json") {
      try { const j = JSON.parse(text); text = JSON.stringify({ name: j.name, version: j.version, main: j.main, types: j.types, typings: j.typings, exports: j.exports, type: j.type }); } catch { /* keep as is */ }
    }
    out[r] = text;
  }
}
walk(path.join(tmp, "node_modules"), "/node_modules");
const lib = path.join(tmp, "node_modules/typescript/lib");
for (const f of fs.readdirSync(lib)) if (/^lib\.(es|decorators).*\.d\.ts$/.test(f)) out["/lib/" + f] = fs.readFileSync(path.join(lib, f), "utf8");

const target = path.resolve("public/types/bundle.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out));
console.log(`Wrote ${Object.keys(out).length} files (${(fs.statSync(target).size / 1e6).toFixed(1)} MB) to ${target}`);
