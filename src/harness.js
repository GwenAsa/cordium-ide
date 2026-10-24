// Python harness written into the project (.cordium/harness.py) before each test run.
export const PY_HARNESS = `import asyncio, datetime, json, os, sys, traceback
from types import SimpleNamespace
import discord
from discord import app_commands
from discord.ext import commands

commands.Bot.latency = property(lambda self: 0.042)
sys.path.insert(0, os.getcwd())
MARK = "@@RESULT@@"


async def load(bot):
    if os.path.isdir("cogs"):
        for name in sorted(os.listdir("cogs")):
            if name.endswith(".py") and not name.startswith("_"):
                try:
                    await bot.load_extension("cogs." + name[:-3])
                except Exception as e:
                    cause = e.__cause__ or e
                    print("@@WARN@@" + name + ": " + type(cause).__name__ + ": " + str(cause))


NOW = datetime.datetime.now(datetime.timezone.utc)


class FakeUser:
    id = 1
    name = "TestUser"
    display_name = "TestUser"
    mention = "@TestUser"
    created_at = NOW
    joined_at = NOW
    display_avatar = SimpleNamespace(url="https://cdn.discordapp.com/embed/avatars/0.png")

    def __str__(self):
        return "TestUser"


def fake_interaction(bot, out):
    async def send(content=None, *, embed=None, embeds=None, ephemeral=False, **kw):
        items = [embed] if embed else list(embeds or [])
        out.append({"content": content, "embeds": [e.to_dict() for e in items], "ephemeral": ephemeral})

    async def noop(*a, **k):
        return None

    user = FakeUser()
    guild = SimpleNamespace(id=2, name="Test Server", member_count=128, channels=[], icon=None, created_at=NOW)
    channel = SimpleNamespace(id=3, name="general", mention="#general")
    response = SimpleNamespace(send_message=send, defer=noop, edit_message=noop)
    followup = SimpleNamespace(send=send)
    return SimpleNamespace(user=user, author=user, guild=guild, channel=channel,
                           response=response, followup=followup, client=bot)


def convert(value, param):
    kind = str(param.type.name)
    if kind == "integer":
        return int(value)
    if kind == "number":
        return float(value)
    if kind == "boolean":
        return str(value).lower() in ("true", "1", "yes")
    return value


async def main():
    mode = sys.argv[1]
    bot = commands.Bot(command_prefix="!", intents=discord.Intents.default())
    await load(bot)
    cmds = [c for c in bot.tree.walk_commands() if isinstance(c, app_commands.Command)]
    if mode == "list":
        data = [{"name": c.qualified_name, "description": c.description,
                 "params": [{"name": p.name, "required": p.required} for p in c.parameters]} for c in cmds]
        print(MARK + json.dumps(data))
        return
    cmd = next(c for c in cmds if c.qualified_name == sys.argv[2])
    raw = json.loads(sys.argv[3])
    kwargs = {p.name: convert(raw[p.name], p) for p in cmd.parameters if p.name in raw}
    out = []
    itx = fake_interaction(bot, out)
    args = [cmd.binding, itx] if cmd.binding is not None else [itx]
    await cmd.callback(*args, **kwargs)
    print(MARK + json.dumps({"messages": out}))


try:
    asyncio.run(main())
except Exception:
    print(MARK + json.dumps({"error": traceback.format_exc().strip().splitlines()[-1]}))
`;

export const JS_HARNESS = String.raw`const path = require("node:path");
const fs = require("node:fs");
const MARK = "@@RESULT@@";
const dir = path.join(process.cwd(), "commands");

function loadCommands() {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".js")) continue;
    try {
      const m = require(path.join(dir, f));
      if (m && m.data && m.execute) out.push(m);
    } catch (e) {
      console.log("@@WARN@@" + f + ": " + String(e.message).split("\n")[0]);
    }
  }
  return out;
}

function makeInteraction(opts, sink) {
  const get = (n) => (n in opts ? opts[n] : null);
  const user = { id: "1", username: "TestUser", tag: "TestUser", displayName: "TestUser", toString: () => "<@1>" };
  const rec = async (p) => {
    const o = typeof p === "string" ? { content: p } : p || {};
    sink.push({
      content: o.content == null ? null : o.content,
      embeds: (o.embeds || []).map((e) => (e.toJSON ? e.toJSON() : e)),
      ephemeral: !!o.ephemeral || ((o.flags || 0) & 64) === 64,
    });
  };
  return {
    user, member: user,
    guild: { id: "2", name: "Test Server", memberCount: 128 },
    channel: { id: "3", name: "general" },
    client: { ws: { ping: 42 }, user: { tag: "Bot#0001", username: "Bot" } },
    commandName: "", replied: false, deferred: false,
    options: {
      getString: (n) => get(n),
      getInteger: (n) => (get(n) == null ? null : Number(get(n))),
      getNumber: (n) => (get(n) == null ? null : Number(get(n))),
      getBoolean: (n) => (get(n) == null ? null : String(get(n)).toLowerCase() === "true"),
      getUser: () => user, getMember: () => user,
      getChannel: () => ({ id: "3", name: "general" }), getRole: () => ({ id: "4", name: "role" }),
    },
    reply: rec, followUp: rec, editReply: rec, deferReply: async () => {},
    isChatInputCommand: () => true,
  };
}

(async () => {
  try {
    const cmds = loadCommands();
    if (process.argv[2] === "list") {
      const data = cmds.map((m) => {
        const j = m.data.toJSON();
        return { name: j.name, description: j.description, params: (j.options || []).map((o) => ({ name: o.name, required: !!o.required })) };
      });
      console.log(MARK + JSON.stringify(data));
    } else {
      const m = cmds.find((c) => c.data.name === process.argv[3]);
      const out = [];
      await m.execute(makeInteraction(JSON.parse(process.argv[4] || "{}"), out));
      console.log(MARK + JSON.stringify({ messages: out }));
    }
  } catch (e) {
    console.log(MARK + JSON.stringify({ error: String(e && e.message ? e.message : e).split("\n")[0] }));
  }
  process.exit(0);
})();
`;
