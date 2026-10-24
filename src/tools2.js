import { h, field, modal } from "./tools.js";

const PERMS = [["Administrator", 3], ["View Channels", 10], ["Send Messages", 11], ["Send Messages in Threads", 38], ["Embed Links", 14], ["Attach Files", 15], ["Add Reactions", 6], ["Use External Emojis", 18], ["Read Message History", 16], ["Mention Everyone", 17], ["Manage Messages", 13], ["Manage Channels", 4], ["Manage Server", 5], ["Manage Roles", 28], ["Manage Nicknames", 27], ["Kick Members", 1], ["Ban Members", 2], ["Moderate Members", 40], ["Connect (voice)", 20], ["Speak (voice)", 21], ["Use Application Commands", 31]];
const DEFAULT_PERMS = ["View Channels", "Send Messages", "Embed Links", "Use Application Commands"];
const INTENTS = [["Guilds", "guilds", "Guilds", false], ["Server Members", "members", "GuildMembers", true], ["Guild Messages", "guild_messages", "GuildMessages", false], ["Message Content", "message_content", "MessageContent", true], ["Voice States", "voice_states", "GuildVoiceStates", false], ["Presences", "presences", "GuildPresences", true], ["Direct Messages", "dm_messages", "DirectMessages", false], ["Reactions", "reactions", "GuildMessageReactions", false]];

export function inviteBuilder(api) {
  const lang = api.lang();
  const cid = h("input", { placeholder: "Application (client) ID" });
  const link = h("input", { readOnly: true });
  const code = h("textarea", { readOnly: true, rows: 7 });
  const permBoxes = PERMS.map(([n, bit]) => {
    const c = h("input", { type: "checkbox", checked: DEFAULT_PERMS.includes(n) });
    c.dataset.bit = bit;
    return [n, c];
  });
  const intentBoxes = INTENTS.map((i) => {
    const c = h("input", { type: "checkbox", checked: ["Guilds"].includes(i[0]) });
    return [i, c];
  });
  const warn = h("div", { className: "sub" });
  const draw = () => {
    let p = 0n;
    permBoxes.forEach(([, c]) => { if (c.checked) p |= 1n << BigInt(c.dataset.bit); });
    link.value = cid.value.trim()
      ? `https://discord.com/oauth2/authorize?client_id=${cid.value.trim()}&permissions=${p}&scope=bot%20applications.commands`
      : "Enter your Application ID to get the invite link";
    const on = intentBoxes.filter(([, c]) => c.checked).map(([i]) => i);
    code.value = lang === "py"
      ? "intents = discord.Intents.none()\n" + on.map((i) => `intents.${i[1]} = True`).join("\n")
      : "const client = new Client({\n  intents: [" + on.map((i) => "GatewayIntentBits." + i[2]).join(", ") + "],\n});";
    const priv = on.filter((i) => i[3]).map((i) => i[0]);
    warn.textContent = priv.length ? "Privileged intents (" + priv.join(", ") + ") must also be enabled in the Discord Developer Portal." : "";
  };
  cid.addEventListener("input", draw);
  [...permBoxes, ...intentBoxes].forEach(([, c]) => c.addEventListener("change", draw));
  const grid = (list) => h("div", { className: "chk" }, list.map(([n, c]) => h("label", {}, c, " " + (Array.isArray(n) ? n[0] + (n[3] ? " \u26A0" : "") : n))));
  const copy = h("button", { textContent: "Copy link", onclick: () => navigator.clipboard.writeText(link.value) });
  const body = h("div", {}, field("Application ID", cid), h("div", { className: "sub", textContent: "Permissions" }), grid(permBoxes),
    field("Invite link", link), copy, h("div", { className: "sub", textContent: "Gateway intents" }), grid(intentBoxes), warn, code);
  draw();
  modal("Invite link & intents", body, "Insert intents code", () => { api.insert(code.value + "\n"); });
}

export async function envManager(api) {
  const path = api.root() + "/.env";
  const raw = (await api.exists(path)) ? await api.read(path) : "";
  const rows = raw.replace(/\n$/, "").split("\n").filter((l, i, a) => raw || a.length > 1).map((line) => {
    const m = line.match(/^\s*([A-Za-z_][\w]*)\s*=(.*)$/);
    return m ? { key: h("input", { value: m[1] }), val: h("input", { value: m[2] }) } : { raw: line };
  });
  const list = h("div");
  const mount = (r) => {
    if (r.raw !== undefined) return;
    const secret = () => /TOKEN|SECRET|KEY|PASSWORD/i.test(r.key.value);
    r.val.type = secret() ? "password" : "text";
    const eye = h("button", { textContent: "Show", onclick: () => { r.val.type = r.val.type === "password" ? "text" : (secret() ? "password" : "text"); eye.textContent = r.val.type === "password" ? "Show" : "Hide"; } });
    list.append(h("div", { className: "row3" }, r.key, r.val, eye));
  };
  rows.forEach(mount);
  const add = h("button", { textContent: "+ Add variable", onclick: () => { const r = { key: h("input", { placeholder: "NAME" }), val: h("input", { placeholder: "value" }) }; rows.push(r); mount(r); } });
  const body = h("div", {}, h("div", { className: "sub", textContent: "Values of TOKEN / SECRET / KEY / PASSWORD variables are hidden." }), list, add);
  modal("Environment (.env)", body, "Save", () => {
    const out = rows.map((r) => (r.raw !== undefined ? r.raw : r.key.value.trim() ? `${r.key.value.trim()}=${r.val.value}` : null)).filter((l) => l !== null);
    api.write(path, out.join("\n") + "\n").then(async () => {
      const gi = api.root() + "/.gitignore";
      const cur = (await api.exists(gi)) ? await api.read(gi) : "";
      if (!/^\.env\s*$/m.test(cur)) await api.write(gi, cur + (cur && !cur.endsWith("\n") ? "\n" : "") + ".env\n__pycache__/\nnode_modules/\n.venv/\n");
      api.log("Saved .env (and made sure .gitignore protects it)", "l-ok");
    });
  });
}

export function shortcutsModal() {
  const rows = [["Ctrl+Shift+P / Ctrl+P", "Command palette"], ["Ctrl+S", "Save"], ["F5", "Run bot"], ["Ctrl+`", "Toggle terminal"], ["Ctrl+Shift+F", "Search in project"], ["Alt+Shift+F", "Format document"], ["Ctrl + / -", "Font size"], ["Ctrl+F", "Find in file"], ["Tab", "Accept snippet / suggestion"], ["F1", "This list"]];
  modal("Keyboard shortcuts", h("div", { className: "keys" }, rows.map(([k, d]) => h("div", {}, h("kbd", { textContent: k }), h("span", { textContent: d })))), "Close", () => {});
}
