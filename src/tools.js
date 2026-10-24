import { renderEmbed } from "./testchat.js";

export const h = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => e.append(k));
  return e;
};
export const field = (label, input) => h("label", { className: "fld" }, h("span", { textContent: label }), input);
const ident = (s) => s.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");

export function modal(title, body, okLabel, onOk) {
  const bg = h("div", { className: "modal-bg" });
  const close = () => bg.remove();
  const ok = h("button", { className: "primary", textContent: okLabel, onclick: () => { if (onOk() !== false) close(); } });
  const box = h("div", { className: "modal" }, h("h3", { textContent: title }), body,
    h("div", { className: "modal-actions" }, h("button", { textContent: "Cancel", onclick: close }), ok));
  bg.append(box);
  bg.onmousedown = (e) => { if (e.target === bg) close(); };
  document.body.append(bg);
  box.querySelector("input")?.focus();
}

export function promptName(title, label, onDone) {
  const input = h("input", { placeholder: "moderation" });
  modal(title, field(label, input), "Create", () => {
    const n = ident(input.value);
    if (!n) return false;
    onDone(n);
  });
}

export function slashBuilder(api) {
  const lang = api.lang();
  const name = h("input", { placeholder: "ban" });
  const desc = h("input", { placeholder: "Ban a member" });
  const list = h("div");
  const items = [];
  const addRow = () => {
    const n = h("input", { placeholder: "param" });
    const t = h("select");
    ["str", "int", "bool"].forEach((x) => t.append(h("option", { value: x, textContent: x })));
    const r = h("input", { type: "checkbox", checked: true });
    items.push({ n, t, r });
    list.append(h("div", { className: "row" }, n, t, h("label", {}, r, " required")));
  };
  addRow();
  const body = h("div", {}, field("Command name", name), field("Description", desc),
    h("div", { className: "sub", textContent: "Parameters" }), list,
    h("button", { textContent: "+ Add parameter", onclick: addRow }));
  modal("Slash command builder", body, "Insert code", () => {
    const cmd = ident(name.value);
    if (!cmd) return false;
    const ps = items.map((i) => ({ n: ident(i.n.value), t: i.t.value, r: i.r.checked })).filter((p) => p.n);
    const description = JSON.stringify(desc.value || "No description");
    let code;
    if (lang === "py") {
      const sorted = [...ps].sort((a, b) => Number(b.r) - Number(a.r));
      const sig = sorted.map((p) => `${p.n}: ${p.t}${p.r ? "" : " = None"}`).join(", ");
      const describe = ps.length ? `    @app_commands.describe(${ps.map((p) => `${p.n}="The ${p.n}"`).join(", ")})\n` : "";
      code = `    @app_commands.command(name="${cmd}", description=${description})\n${describe}    async def ${cmd}(self, interaction: discord.Interaction${sig ? ", " + sig : ""}):\n        await interaction.response.send_message("TODO")\n`;
    } else {
      const map = { str: "String", int: "Integer", bool: "Boolean" };
      const opts = ps.map((p) => `\n    .add${map[p.t]}Option((o) => o.setName("${p.n}").setDescription("The ${p.n}").setRequired(${p.r}))`).join("");
      code = `  data: new SlashCommandBuilder()\n    .setName("${cmd}")\n    .setDescription(${description})${opts},\n  async execute(interaction) {\n    await interaction.reply("TODO");\n  },\n`;
    }
    api.insert(code);
  });
}

export function embedBuilder(api) {
  const lang = api.lang();
  const title = h("input", { value: "Server rules" });
  const desc = h("input", { value: "Please be kind to everyone." });
  const color = h("input", { type: "color", value: "#5865f2" });
  const footer = h("input", { value: "Cordium" });
  const fl = h("div");
  const fields = [];
  const preview = h("div", { className: "preview" });
  const addField = () => {
    const n = h("input", { placeholder: "name" }), v = h("input", { placeholder: "value" });
    const i = h("input", { type: "checkbox", checked: true });
    fields.push({ n, v, i });
    fl.append(h("div", { className: "row" }, n, v, h("label", {}, i, " inline")));
    [n, v, i].forEach((x) => x.addEventListener("input", draw));
  };
  const data = () => ({
    title: title.value, description: desc.value, color: parseInt(color.value.slice(1), 16),
    fields: fields.filter((f) => f.n.value).map((f) => ({ name: f.n.value, value: f.v.value || "-", inline: f.i.checked })),
    footer: footer.value ? { text: footer.value } : null,
  });
  const draw = () => { preview.innerHTML = ""; preview.append(renderEmbed(data())); };
  [title, desc, color, footer].forEach((x) => x.addEventListener("input", draw));
  const body = h("div", { className: "two" },
    h("div", {}, field("Title", title), field("Description", desc), field("Color", color), field("Footer", footer),
      h("div", { className: "sub", textContent: "Fields" }), fl, h("button", { textContent: "+ Add field", onclick: addField })),
    preview);
  addField(); draw();
  modal("Embed builder (live preview)", body, "Insert code", () => {
    const d = data(), q = JSON.stringify, hex = "0x" + d.color.toString(16).padStart(6, "0");
    let c;
    if (lang === "py") {
      c = `embed = discord.Embed(title=${q(d.title)}, description=${q(d.description)}, color=${hex})\n`;
      d.fields.forEach((f) => (c += `embed.add_field(name=${q(f.name)}, value=${q(f.value)}, inline=${f.inline ? "True" : "False"})\n`));
      if (d.footer) c += `embed.set_footer(text=${q(d.footer.text)})\n`;
    } else {
      c = `const embed = new EmbedBuilder()\n  .setTitle(${q(d.title)})\n  .setDescription(${q(d.description)})\n  .setColor(${hex})`;
      if (d.fields.length) c += `\n  .addFields(${d.fields.map((f) => `{ name: ${q(f.name)}, value: ${q(f.value)}, inline: ${f.inline} }`).join(", ")})`;
      if (d.footer) c += `\n  .setFooter({ text: ${q(d.footer.text)} })`;
      c += ";\n";
    }
    api.insert(c);
  });
}

export async function openPalette(api, actions) {
  const files = await api.listFiles();
  const items = [
    ...actions.map((a) => ({ label: a.label, hint: "action", run: a.run })),
    ...files.map((f) => ({ label: f.rel, hint: "file", run: () => api.openFile(f.path, f.name) })),
  ];
  const input = h("input", { placeholder: "Type a file name or action..." });
  const ul = h("div", { className: "plist" });
  const bg = h("div", { className: "modal-bg top" }, h("div", { className: "palette" }, input, ul));
  let sel = 0, shown = [];
  const draw = () => {
    const q = input.value.toLowerCase();
    shown = items.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 12);
    sel = Math.min(sel, Math.max(shown.length - 1, 0));
    ul.innerHTML = "";
    shown.forEach((it, idx) => ul.append(h("div", {
      className: "pitem" + (idx === sel ? " sel" : ""), onclick: () => run(it),
    }, h("span", { textContent: it.label }), h("small", { textContent: it.hint }))));
  };
  const run = (it) => { bg.remove(); it.run(); };
  input.oninput = () => { sel = 0; draw(); };
  input.onkeydown = (e) => {
    if (e.key === "Escape") bg.remove();
    else if (e.key === "ArrowDown") { sel = Math.min(sel + 1, shown.length - 1); draw(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === "Enter" && shown[sel]) run(shown[sel]);
  };
  bg.onmousedown = (e) => { if (e.target === bg) bg.remove(); };
  document.body.append(bg);
  draw(); input.focus();
}

export function promptText(title, label, initial, onDone, anySlash) {
  const input = h("input", { value: initial || "" });
  modal(title, field(label, input), "OK", () => {
    const v = input.value.trim();
    if (!v || (!anySlash && v.includes("/"))) return false;
    onDone(v);
  });
  input.select();
}

export function confirmBox(message, onYes) {
  modal("Are you sure?", h("div", { textContent: message }), "Delete", () => { onYes(); });
}
