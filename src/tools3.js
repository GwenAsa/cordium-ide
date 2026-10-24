import { h, field, modal } from "./tools.js";
import { loadCustom, saveCustom } from "./snippets.js";
import PY_MOD from "./modules/py/moderation.py?raw";
import PY_INFO from "./modules/py/info.py?raw";
import PY_WELCOME from "./modules/py/welcome.py?raw";
import JS_KICK from "./modules/js/kick.js?raw";
import JS_BAN from "./modules/js/ban.js?raw";
import JS_PURGE from "./modules/js/purge.js?raw";
import JS_USERINFO from "./modules/js/userinfo.js?raw";
import JS_SERVERINFO from "./modules/js/serverinfo.js?raw";

const q = (s) => JSON.stringify(s);
const ident = (s, fb) => s.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").replace(/^(\d)/, "_$1") || fb;
const pascal = (s) => s.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("") || "Thing";

// ---------- ready-made modules ----------
const MODULES = [
  { title: "Moderation", desc: "/kick, /ban, /timeout and /purge with permission checks.", py: { "cogs/moderation.py": PY_MOD }, js: { "commands/kick.js": JS_KICK, "commands/ban.js": JS_BAN, "commands/purge.js": JS_PURGE } },
  { title: "Server & user info", desc: "Embeds for /userinfo and /serverinfo (plus /avatar in Python).", py: { "cogs/info.py": PY_INFO }, js: { "commands/userinfo.js": JS_USERINFO, "commands/serverinfo.js": JS_SERVERINFO } },
  { title: "Welcome messages", desc: "Greets new members with an embed (needs the Server Members intent).", py: { "cogs/welcome.py": PY_WELCOME }, js: null },
];

export async function modulesGallery(api) {
  const py = await api.isPython();
  const grid = h("div", { className: "mods" });
  for (const m of MODULES) {
    const files = py ? m.py : m.js;
    const add = h("button", { className: "primary", textContent: files ? "Add to project" : "discord.py only", disabled: !files, onclick: () => { api.addFiles(files); add.textContent = "Added"; add.disabled = true; } });
    grid.append(h("div", { className: "mod" }, h("b", { textContent: m.title }), h("div", { className: "sub", textContent: m.desc }), h("div", { className: "mfiles", textContent: files ? Object.keys(files).join("\n") : "" }), add));
  }
  modal("Ready-made modules (" + (py ? "discord.py" : "discord.js") + ")", grid, "Close", () => {});
}

// ---------- components builder ----------
export function componentsBuilder(api) {
  const lang = api.lang();
  const type = h("select");
  ["Button", "Select menu", "Modal"].forEach((t) => type.append(h("option", { value: t, textContent: t })));
  const name = h("input", { value: "confirm" });
  const label = h("input", { value: "Confirm" });
  const style = h("select");
  ["primary", "secondary", "success", "danger"].forEach((t) => style.append(h("option", { value: t, textContent: t })));
  const reply = h("input", { value: "You clicked the button!" });
  const rows = h("div");
  const items = [];
  const addRow = (a = "", b = "") => {
    const x = h("input", { value: a, placeholder: "label" }), y = h("input", { value: b, placeholder: "value" });
    items.push({ x, y }); rows.append(h("div", { className: "row" }, x, y, h("span")));
    [x, y].forEach((i) => i.addEventListener("input", draw));
  };
  const out = h("textarea", { readOnly: true, rows: 14 });
  const gLabel = field("Button label / placeholder / modal title", label), gStyle = field("Style", style), gReply = field("Reply text", reply), gItems = h("div", {}, h("div", { className: "sub", id: "items-title" }), rows, h("button", { textContent: "+ Add row", onclick: () => { addRow("Option", "value"); draw(); } }));
  const draw = () => {
    const t = type.value, id = ident(name.value, "thing"), P = pascal(name.value);
    gStyle.style.display = t === "Button" ? "" : "none";
    gReply.style.display = t === "Button" ? "" : "none";
    gItems.style.display = t === "Button" ? "none" : "";
    gItems.querySelector("#items-title").textContent = t === "Modal" ? "Fields (label, short or paragraph)" : "Options (label, value)";
    const it = items.filter((i) => i.x.value);
    let c = "";
    if (lang === "py") {
      if (t === "Button") c = `class ${P}View(discord.ui.View):\n    @discord.ui.button(label=${q(label.value)}, style=discord.ButtonStyle.${style.value}, custom_id=${q(id)})\n    async def ${id}(self, interaction: discord.Interaction, button: discord.ui.Button):\n        await interaction.response.send_message(${q(reply.value)}, ephemeral=True)\n\n\n# Usage inside a command:\n# await interaction.response.send_message("Choose:", view=${P}View())\n`;
      else if (t === "Select menu") c = `class ${P}View(discord.ui.View):\n    @discord.ui.select(\n        placeholder=${q(label.value)},\n        options=[\n${it.map((i) => `            discord.SelectOption(label=${q(i.x.value)}, value=${q(i.y.value || i.x.value)}),`).join("\n")}\n        ],\n    )\n    async def ${id}(self, interaction: discord.Interaction, select: discord.ui.Select):\n        await interaction.response.send_message(f"You picked: {select.values[0]}", ephemeral=True)\n\n\n# Usage inside a command:\n# await interaction.response.send_message("Pick one:", view=${P}View())\n`;
      else c = `class ${P}Modal(discord.ui.Modal, title=${q(label.value)}):\n${it.map((i, n) => `    ${ident(i.x.value, "field" + n)} = discord.ui.TextInput(label=${q(i.x.value)}, style=discord.TextStyle.${/para/i.test(i.y.value) ? "paragraph" : "short"})`).join("\n")}\n\n    async def on_submit(self, interaction: discord.Interaction):\n        await interaction.response.send_message("Thanks, your answers were received!", ephemeral=True)\n\n\n# Usage inside a command:\n# await interaction.response.send_modal(${P}Modal())\n`;
    } else {
      const S = style.value[0].toUpperCase() + style.value.slice(1);
      if (t === "Button") c = `const row = new ActionRowBuilder().addComponents(\n  new ButtonBuilder().setCustomId(${q(id)}).setLabel(${q(label.value)}).setStyle(ButtonStyle.${S}),\n);\n\n// Send it:    await interaction.reply({ content: "Choose:", components: [row] });\n// Handle it in your InteractionCreate listener:\n// if (interaction.isButton() && interaction.customId === ${q(id)}) {\n//   await interaction.reply({ content: ${q(reply.value)}, ephemeral: true });\n// }\n`;
      else if (t === "Select menu") c = `const menu = new StringSelectMenuBuilder()\n  .setCustomId(${q(id)})\n  .setPlaceholder(${q(label.value)})\n  .addOptions(\n${it.map((i) => `    new StringSelectMenuOptionBuilder().setLabel(${q(i.x.value)}).setValue(${q(i.y.value || i.x.value)}),`).join("\n")}\n  );\nconst row = new ActionRowBuilder().addComponents(menu);\n\n// Send it:    await interaction.reply({ content: "Pick one:", components: [row] });\n// Handle it:  if (interaction.isStringSelectMenu() && interaction.customId === ${q(id)}) {\n//   await interaction.reply({ content: 'You picked: ' + interaction.values[0], ephemeral: true });\n// }\n`;
      else c = `const modal = new ModalBuilder().setCustomId(${q(id)}).setTitle(${q(label.value)});\nmodal.addComponents(\n${it.map((i, n) => `  new ActionRowBuilder().addComponents(\n    new TextInputBuilder().setCustomId(${q(ident(i.x.value, "field" + n))}).setLabel(${q(i.x.value)}).setStyle(TextInputStyle.${/para/i.test(i.y.value) ? "Paragraph" : "Short"}),\n  ),`).join("\n")}\n);\n\n// Show it:    await interaction.showModal(modal);\n// Handle it:  if (interaction.isModalSubmit() && interaction.customId === ${q(id)}) {\n//   await interaction.reply({ content: "Thanks, your answers were received!", ephemeral: true });\n// }\n`;
    }
    out.value = c;
  };
  addRow("Option A", "a"); addRow("Option B", "b");
  [type, name, label, style, reply].forEach((e) => e.addEventListener("input", draw));
  type.addEventListener("change", () => { if (type.value === "Modal") { items[0].x.value = "Your name"; items[0].y.value = "short"; items[1].x.value = "Message"; items[1].y.value = "paragraph"; } draw(); });
  const body = h("div", {}, field("Component", type), field("Name (identifier)", name), gLabel, gStyle, gReply, gItems, out);
  draw();
  modal("Components builder (button / select / modal)", body, "Insert code", () => { api.insert(out.value); });
}

// ---------- custom snippets ----------
export function snippetsManager(api, prefill = "") {
  let list = loadCustom();
  const box = h("div", { className: "snips" });
  const draw = () => {
    box.innerHTML = "";
    if (!list.length) box.append(h("div", { className: "sub", textContent: "No snippets yet. Add one below." }));
    list.forEach((s, i) => box.append(h("div", { className: "snip" }, h("code", { textContent: s.trigger + "  (" + s.lang + ")" }), h("button", { textContent: "Delete", onclick: () => { list.splice(i, 1); saveCustom(list); draw(); } }))));
  };
  const trig = h("input", { placeholder: "trigger, e.g. mycog" });
  const lang = h("select");
  [["py", "Python"], ["js", "JavaScript"], ["both", "Both"]].forEach(([v, t]) => lang.append(h("option", { value: v, textContent: t })));
  const body = h("textarea", { rows: 7, placeholder: "Code. Use ${name} for fields you can tab through.", value: prefill });
  draw();
  modal("My snippets", h("div", {}, box, h("div", { className: "sub", textContent: "New snippet" }), field("Trigger", trig), field("Language", lang), field("Code", body)), "Save snippet", () => {
    if (!trig.value.trim() || !body.value.trim()) return false;
    list.push({ trigger: trig.value.trim(), lang: lang.value, body: body.value });
    saveCustom(list);
    api.toast("Snippet saved: type " + trig.value.trim());
  });
}
