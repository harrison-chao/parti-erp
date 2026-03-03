import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (typeof window !== "undefined") {
    throw new Error("Database can only be accessed on the server side");
  }
  
  if (!dbInstance) {
    const sql = neon(process.env.DATABASE_URL!);
    dbInstance = drizzle(sql, { schema });
  }
  
  return dbInstance;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const db = getDb();
    return db[prop as keyof typeof db];
  },
});

export type Database = ReturnType<typeof drizzle>;
