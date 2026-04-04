import { Database } from '@sqlitecloud/drivers';

const CONNECTION_STRING = 'sqlitecloud://ct9xsnnpvz.g1.sqlite.cloud:8860/Studio_leticia.db?apikey=c9lGTn4sb98t3kl3w2gU8cMXQiKDavSd7QF3vTwHV9Q';

async function test() {
  console.log("Connecting...");
  const db = new Database(CONNECTION_STRING);
  
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
  const query = db.sql`SELECT 1`;
  
  try {
    await Promise.race([query, timeout]);
    console.log("Connection successful!");
  } catch (e) {
    console.error("Connection failed:", e);
  }
  process.exit(0);
}

test();
