import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Falls back to a placeholder so importing this module never throws (which would break
// `next build`'s route analysis); an actual query against a missing DATABASE_URL fails
// naturally at request time instead, with the error surfacing wherever that query is awaited.
const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgresql://unset:unset@unset.tld/unset";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
