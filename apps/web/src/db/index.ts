import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const u = new URL(url);
const pool = new Pool({
  host: u.hostname,
  port: Number(u.port || 5432),
  user: decodeURIComponent(u.username || ""),
  password: decodeURIComponent(u.password || ""),
  database: u.pathname.replace(/^\//, ""),
  ssl: (u.searchParams.get("sslmode") || "").toLowerCase() === "disable" ? false : false, // локально off
});

export const db = drizzle(pool);
