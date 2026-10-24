import { h, field, modal } from "./tools.js";
import "@fontsource/source-code-pro/latin-400.css";
import "@fontsource/source-code-pro/latin-600.css";
import "@fontsource/source-code-pro/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-700.css";
import "@fontsource/fira-code/latin-400.css";
import "@fontsource/fira-code/latin-700.css";
import "@fontsource/roboto-mono/latin-400.css";
import "@fontsource/roboto-mono/latin-700.css";
import "@fontsource/noto-sans/latin-400.css";
import "@fontsource/noto-sans/latin-600.css";
import "@fontsource/noto-sans/latin-700.css";
import "@fontsource/nunito-sans/latin-400.css";
import "@fontsource/nunito-sans/latin-600.css";
import "@fontsource/nunito-sans/latin-700.css";
import "@fontsource/vazirmatn/arabic-400.css";
import "@fontsource/vazirmatn/arabic-700.css";

export const CODE_FONTS = ["Source Code Pro", "IBM Plex Mono", "Fira Code", "Roboto Mono", "JetBrains Mono"];
export const UI_FONTS = ["Noto Sans", "Nunito Sans", "Inter"];
const FALLBACK = '"Vazirmatn", "DejaVu Sans Mono", monospace';

export function applyFonts() {
  const code = localStorage.getItem("cordium.codefont") || CODE_FONTS[0];
  const ui = localStorage.getItem("cordium.uifont") || UI_FONTS[0];
  const lig = localStorage.getItem("cordium.lig") === "1";
  const r = document.documentElement.style;
  r.setProperty("--code-font", `"${code}", ${FALLBACK}`);
  r.setProperty("--ui-font", `"${ui}", "Vazirmatn", system-ui, sans-serif`);
  r.setProperty("--lig", lig ? "contextual" : "none");
  window.dispatchEvent(new Event("cordium-font"));
}
applyFonts();

export function openFontPicker() {
  const mk = (list, key, def) => {
    const s = h("select");
    list.forEach((f) => s.append(h("option", { value: f, textContent: f })));
    s.value = localStorage.getItem(key) || def;
    s.addEventListener("change", () => { localStorage.setItem(key, s.value); applyFonts(); });
    return s;
  };
  const code = mk(CODE_FONTS, "cordium.codefont", CODE_FONTS[0]);
  const ui = mk(UI_FONTS, "cordium.uifont", UI_FONTS[0]);
  const lig = h("input", { type: "checkbox", checked: localStorage.getItem("cordium.lig") === "1" });
  lig.addEventListener("change", () => { localStorage.setItem("cordium.lig", lig.checked ? "1" : "0"); applyFonts(); });
  const sample = h("pre", { className: "fsample", textContent: 'async def ping(self, interaction):\n    if latency != 0 and ms >= 100:\n        await interaction.response.send_message(f"Pong! {ms}ms")  # -> ok' });
  modal("Fonts", h("div", {}, field("Code font", code), field("Interface font", ui), h("label", { className: "fld" }, h("span", { textContent: "Code ligatures (=> != ->)" }), lig), sample), "Done", () => {});
}
