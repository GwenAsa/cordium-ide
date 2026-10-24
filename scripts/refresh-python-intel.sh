#!/usr/bin/env bash
# Re-vendors Jedi, Parso and the discord.py source used for Python autocomplete.
# Usage: ./scripts/refresh-python-intel.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DEST=src-tauri/resources/pyls
TMP=$(mktemp -d)
mkdir -p "$DEST/extra"
pip install --quiet --no-deps --target "$DEST" jedi parso
pip install --quiet --no-deps --target "$TMP" discord.py
rm -rf "$DEST/extra/discord" "$DEST"/*.dist-info "$DEST/bin"
cp -r "$TMP/discord" "$DEST/extra/discord"
# keep only the stdlib stubs plus a small set of popular third-party stubs
STUBS="$DEST/jedi/third_party/typeshed/stubs"
for d in "$STUBS"/*; do
  case "$(basename "$d")" in
    requests|PyYAML|python-dateutil|pytz|psutil|tabulate|toml|ujson|Markdown|pyserial|colorama|cachetools|aiofiles|Pygments|html5lib|openpyxl|pexpect|paramiko|redis|docker|peewee|PyMySQL|python-slugify|pyperclip|PyAutoGUI|tqdm|xmltodict|simplejson|tzlocal|termcolor|regex) ;;
    *) rm -rf "$d" ;;
  esac
done
find "$DEST" -name "__pycache__" -type d -prune -exec rm -rf {} +
rm -rf "$TMP"
echo "Done. jedi_server.py is not touched by this script."
