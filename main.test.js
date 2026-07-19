import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mapRowToResult, translate } from "./main.js";

describe("mapRowToResult", () => {
  test("maps ECDICT row into Manggo dictionary shape", () => {
    const result = mapRowToResult("take", {
      word: "take",
      phonetic: "teɪk",
      translation: "vt. 拿,取,执,抱,带去\nn. 拿,取,收入",
      tag: "zk gk cet4",
      exchange: "p:took/d:taken/i:taking/3:takes",
    });

    expect(result.kind).toBe("dictionary");
    expect(result.dictionary.word).toBe("take");
    expect(result.dictionary.pronunciations[0].phonetic).toBe("/teɪk/");
    expect(result.dictionary.meanings.length).toBe(2);
    expect(result.dictionary.meanings[0].partOfSpeech).toBe("vt");
    expect(result.dictionary.meanings[0].translations).toContain("拿");
    expect(result.dictionary.forms).toEqual([
      { type: "past", word: "took" },
      { type: "past_participle", word: "taken" },
      { type: "present_participle", word: "taking" },
      { type: "third_person_singular", word: "takes" },
    ]);
    expect(result.dictionary.tags).toEqual(["zk", "gk", "cet4"]);
    expect(result.dictionary.properties[0].value).toBe("ECDICT");
  });
});

describe("translate with local sqlite", () => {
  test("looks up word from pluginDir database", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ecdict-"));
    const dbPath = join(dir, "stardict.db");
    const db = new Database(dbPath);
    db.run(`
      CREATE TABLE stardict (
        word TEXT,
        phonetic TEXT,
        translation TEXT,
        tag TEXT,
        exchange TEXT
      );
    `);
    db.run(
      "INSERT INTO stardict VALUES (?, ?, ?, ?, ?)",
      ["hello", "həˈləʊ", "int. 你好,喂", "cet4", ""],
    );
    db.close();

    try {
      const result = await translate("Hello", "en", "zh", {
        utils: { pluginDir: dir },
      });
      expect(result.dictionary.word).toBe("hello");
      expect(result.dictionary.meanings[0].translations).toContain("你好");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("throws when word is missing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ecdict-"));
    const db = new Database(join(dir, "stardict.db"));
    db.run(`
      CREATE TABLE stardict (
        word TEXT,
        phonetic TEXT,
        translation TEXT,
        tag TEXT,
        exchange TEXT
      );
    `);
    db.close();

    try {
      await expect(
        translate("zzzznotaword", "en", "zh", { utils: { pluginDir: dir } }),
      ).rejects.toThrow("未找到词条");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
