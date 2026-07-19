import { translate } from "../main.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginDir = join(root, ".tmp");

async function check(word) {
  const result = await translate(word, "en", "zh", {
    utils: { pluginDir },
  });
  console.log("OK", word, "=>", result.dictionary.meanings?.[0]?.translations?.slice(0, 3));
}

async function missing(word) {
  try {
    await translate(word, "en", "zh", { utils: { pluginDir } });
    throw new Error("expected miss");
  } catch (error) {
    if (!String(error.message).includes("未找到词条")) {
      throw error;
    }
    console.log("OK missing", word);
  }
}

await check("hello");
await check("Take");
await missing("zzzznotawordxyz");
console.log("real-db verification passed");
