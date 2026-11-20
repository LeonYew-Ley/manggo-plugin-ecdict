import { translate } from "../main.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSQLiteHost } from "./sqlite-test-host.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const options = { manggo: createSQLiteHost(join(root, ".tmp")) };

async function check(word) {
  const result = await translate(word, "en", "zh", options);
  console.log("OK", word, "=>", result.dictionary.meanings?.[0]?.translations?.slice(0, 3));
}

async function missing(word) {
  try {
    await translate(word, "en", "zh", options);
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
