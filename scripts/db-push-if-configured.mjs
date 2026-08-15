import { execSync } from "node:child_process";

if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  console.log("DATABASE_URL detected, pushing Drizzle schema to Postgres...");
  execSync("npx drizzle-kit push --force", { stdio: "inherit" });
} else {
  console.log("No DATABASE_URL/POSTGRES_URL set, skipping drizzle-kit push.");
}
