import { Database } from "bun:sqlite";
import { join } from "node:path";

// Reproduce the read-only SQLite interface for development outside Manggo.
export function createSQLiteHost(pluginDir) {
  return {
    sqlite: {
      async open(path, { mode = "readOnly" } = {}) {
        if (mode !== "readOnly") {
          throw new Error(`Expected a read-only database, got ${mode}`);
        }
        const db = new Database(join(pluginDir, path), { readonly: true });
        return {
          async query(statement, parameters = []) {
            return db.query(statement).all(...parameters);
          },
          async close() {
            db.close();
          },
        };
      },
    },
  };
}
