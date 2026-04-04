import { getDb } from './src/db/database';
async function test() {
  const db = getDb();
  try {
    const res = await db.sql`SELECT * FROM settings`;
    console.log("Settings:", res);
  } catch (e) {
    console.error(e);
  }
}
test();
