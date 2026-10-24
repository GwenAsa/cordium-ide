// Discord-bot specific lint rules with one-click quick fixes.
const AWAIT_PY = /\b(interaction|ctx|channel|message|member|user)\.(response\.(send_message|defer|edit_message|send_modal)|followup\.send|send|reply)\(/;
const AWAIT_JS = /\b(interaction|message|channel)\.(reply|editReply|deferReply|followUp|send)\(/;

export function botLint(lang, text) {
  const out = [];
  const lines = text.split("\n");
  let offset = 0;
  if (lang === "py") {
    const usesContent = /\bmessage\.content\b/.test(text);
    const enabled = /message_content\s*=\s*True|Intents\.all\(\)/.test(text);
    if (usesContent && !enabled) {
      const m = text.match(/^([ \t]*)(\w+)\s*=\s*discord\.Intents\.(?:default|none)\(\)[ \t]*$/m);
      if (m) {
        const from = m.index, to = from + m[0].length, name = m[2], indent = m[1];
        out.push({ from, to, severity: "warning", message: "Your code reads message.content, but the Message Content intent is not enabled (also turn it on in the Developer Portal).",
          actions: [{ name: "Enable message_content", apply(view) { view.dispatch({ changes: { from: to, insert: "\n" + indent + name + ".message_content = True" } }); } }] });
      }
    }
  } else if (/GatewayIntentBits/.test(text) && /message\.content|MessageCreate|messageCreate/.test(text) && !/MessageContent/.test(text)) {
    const idx = text.indexOf("GatewayIntentBits");
    out.push({ from: idx, to: idx + "GatewayIntentBits".length, severity: "warning", message: "Reading message content needs GatewayIntentBits.MessageContent (and the Message Content intent enabled in the Developer Portal)." });
  }
  for (const line of lines) {
    const from = offset;
    offset += line.length + 1;
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("//")) continue;
    const re = lang === "py" ? AWAIT_PY : AWAIT_JS;
    const m = line.match(re);
    if (m && !/\bawait\b/.test(line) && !/^\s*(return|yield)\b/.test(line) && !/create_task|gather\(|\.then\(/.test(line)) {
      const idx = from + m.index;
      out.push({ from: idx, to: from + line.length, severity: "warning", message: "Missing 'await': this call is never awaited, so nothing will be sent.",
        actions: [{ name: "Add await", apply(view) { view.dispatch({ changes: { from: idx, insert: "await " } }); } }] });
    }
    if (lang === "py") {
      const s = line.match(/\btime\.sleep\(/);
      if (s) {
        const idx = from + s.index, len = s[0].length;
        out.push({ from: idx, to: idx + len, severity: "warning", message: "time.sleep() freezes the whole bot. Use 'await asyncio.sleep(...)' (and 'import asyncio').",
          actions: [{ name: "Use asyncio.sleep", apply(view) { view.dispatch({ changes: { from: idx, to: idx + len, insert: "await asyncio.sleep(" } }); } }] });
      }
      const r = line.match(/\brequests\.(get|post|put|delete|patch)\(/);
      if (r) out.push({ from: from + r.index, to: from + r.index + r[0].length, severity: "warning", message: "requests is blocking and will freeze the bot. Use aiohttp (async with aiohttp.ClientSession()) instead." });
    }
  }
  return out;
}
