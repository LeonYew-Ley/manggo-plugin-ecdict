const LOOKUP_WORD = "SELECT word, phonetic, translation, tag, exchange FROM stardict WHERE word = ? LIMIT 1";

const EXCHANGE_TYPES = {
  p: "past",
  d: "past_participle",
  i: "present_participle",
  "3": "third_person_singular",
  r: "comparative",
  t: "superlative",
  s: "plural",
  "0": "lemma",
  "1": "lemma",
};

function stringValue(value) {
  return String(value ?? "").trim();
}

function normalizeQuery(text) {
  return stringValue(text);
}

function parseMeanings(translation) {
  const lines = stringValue(translation)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const meanings = [];

  for (const line of lines) {
    const dotIndex = line.indexOf(".");
    let partOfSpeech = "";
    let explainsText = line;

    if (dotIndex > 0 && dotIndex < 8) {
      partOfSpeech = line.slice(0, dotIndex).trim();
      explainsText = line.slice(dotIndex + 1).trim();
    }

    const translations = explainsText
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (translations.length === 0 && !partOfSpeech) {
      continue;
    }

    const meaning = {};
    if (partOfSpeech) {
      meaning.partOfSpeech = partOfSpeech;
    }
    if (translations.length > 0) {
      meaning.translations = translations;
    } else {
      meaning.definitions = [explainsText];
    }
    meanings.push(meaning);
  }

  return meanings;
}

function parseForms(exchange) {
  const forms = [];
  const raw = stringValue(exchange);
  if (!raw) {
    return forms;
  }

  for (const item of raw.split("/")) {
    const [code, word] = item.split(":");
    const type = EXCHANGE_TYPES[stringValue(code)];
    const formWord = stringValue(word);
    if (!type || !formWord) {
      continue;
    }
    forms.push({ type, word: formWord });
  }

  return forms;
}

function parseTags(tag) {
  return stringValue(tag)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function rowToDictionary(word, row) {
  const dictionary = {
    word,
    language: "en_US",
    properties: [
      {
        key: "source",
        label: "来源",
        value: "ECDICT",
      },
    ],
  };

  const phonetic = stringValue(row.phonetic);
  if (phonetic) {
    dictionary.pronunciations = [
      {
        phonetic: phonetic.startsWith("/") ? phonetic : `/${phonetic}/`,
      },
    ];
  }

  const meanings = parseMeanings(row.translation);
  if (meanings.length > 0) {
    dictionary.meanings = meanings;
  }

  const forms = parseForms(row.exchange);
  if (forms.length > 0) {
    dictionary.forms = forms;
  }

  const tags = parseTags(row.tag);
  if (tags.length > 0) {
    dictionary.tags = tags;
  }

  return {
    kind: "dictionary",
    dictionary,
  };
}

async function openDatabase(manggo) {
  try {
    return await manggo.sqlite.open("stardict.db", { mode: "readOnly" });
  } catch (error) {
    throw new Error(`无法打开词典数据库 stardict.db。${error?.message || error}`);
  }
}

async function lookupWord(db, word) {
  const [exact] = await db.query(LOOKUP_WORD, [word]);
  if (exact) {
    return exact;
  }

  const lower = word.toLowerCase();
  if (lower !== word) {
    const [row] = await db.query(LOOKUP_WORD, [lower]);
    return row;
  }

  return null;
}

export function mapRowToResult(query, row) {
  return rowToDictionary(stringValue(row.word) || query, row);
}

export async function translate(text, _from, _to, { manggo }) {
  const word = normalizeQuery(text);
  if (!word) {
    throw new Error("查询词不能为空。");
  }

  const db = await openDatabase(manggo);
  try {
    const row = await lookupWord(db, word);
    if (!row) {
      throw new Error(`未找到词条: ${word}`);
    }
    return mapRowToResult(word, row);
  } finally {
    await db.close();
  }
}
