import { Database } from "bun:sqlite";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const pluginId = "com.leonyew.ecdict";
const providerId = "com.leonyew.ecdict.dictionary";
const installPath = join(
  process.env.APPDATA,
  "Manggo",
  "Manggo",
  "plugins",
  "installed",
  pluginId,
).replaceAll("\\", "/");

const dbPath = join(process.env.LOCALAPPDATA, "Manggo", "Manggo", "provider-config.sqlite3");
const db = new Database(dbPath);

const existing = db
  .query("SELECT instance_id FROM provider_configs WHERE provider_id = ? OR plugin_id = ?")
  .get(providerId, pluginId);

if (existing) {
  console.log("provider already registered:", existing.instance_id);
  db.close();
  process.exit(0);
}

const now = new Date().toISOString();
const config = {
  _pluginCompatibility: "manggo",
  _pluginEntry: "translate",
  _pluginIconPath: `${installPath}/icon.png`,
  _pluginInstallPath: installPath,
  _pluginLanguageMap: {
    auto: "auto",
    en_US: "en",
    zh_CN: "zh",
  },
  _pluginMainPath: `${installPath}/main.js`,
  _pluginResultType: "dictionary",
  _pluginRuntime: "bun",
  _pluginRuntimeApi: "manggo.plugin.v1",
  _pluginServiceId: "dictionary",
};

db.run(
  `INSERT INTO provider_configs (
    instance_id, service_type, provider_id, plugin_id, name, enabled, priority,
    timeout_ms, concurrency_limit, config_json, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    randomUUID(),
    "translation",
    providerId,
    pluginId,
    "ECDICT",
    1,
    2,
    30000,
    1,
    JSON.stringify(config),
    now,
    now,
  ],
);

console.log("registered native ECDICT provider for Manggo");
db.close();
