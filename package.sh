#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$ROOT/dist"
TMP_DIR="$ROOT/.tmp"
PLUGIN_ID="$(node -e "console.log(JSON.parse(require('fs').readFileSync('$ROOT/manggo.plugin.json','utf8')).id)")"
OUT_FILE="$OUT_DIR/${PLUGIN_ID}.mplugin"
DB_URL="https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict-sqlite-28.zip"
ZIP_PATH="$TMP_DIR/ecdict-sqlite-28.zip"
DB_PATH="$TMP_DIR/stardict.db"

mkdir -p "$OUT_DIR" "$TMP_DIR"
rm -f "$OUT_FILE"

if [[ ! -f "$DB_PATH" ]]; then
  echo "Downloading ECDICT sqlite database..."
  curl -L --fail -o "$ZIP_PATH" "$DB_URL"
  unzip -o "$ZIP_PATH" -d "$TMP_DIR"
  if [[ ! -f "$DB_PATH" ]]; then
    FOUND="$(find "$TMP_DIR" -name 'stardict.db' -type f | head -n 1)"
    if [[ -z "$FOUND" ]]; then
      echo "stardict.db not found after extract" >&2
      exit 1
    fi
    cp "$FOUND" "$DB_PATH"
  fi
fi

cp "$DB_PATH" "$ROOT/stardict.db"
cd "$ROOT"
zip -r "$OUT_FILE" manggo.plugin.json main.js icon.png stardict.db
rm -f "$ROOT/stardict.db"

echo "$OUT_FILE"
