import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let database: ReturnType<typeof drizzle> | undefined;

export function getDatabase() {
  if (!database) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    database = drizzle(postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 2,
      connect_timeout: 5,
      idle_timeout: 20,
    }));
  }
  return database;
}
