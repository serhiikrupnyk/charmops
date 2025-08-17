import "dotenv/config";
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  // видаляємо пінги старші за 14 днів
  await db.execute(sql`DELETE FROM operator_activity WHERE ping_at < NOW() - INTERVAL '2 days'`);
  // необов’язково, але корисно іноді
  await db.execute(sql`VACUUM (ANALYZE) operator_activity`);
  console.log("✓ Housekeeping done");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
