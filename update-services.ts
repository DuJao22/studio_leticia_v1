import { getDb } from './src/db/database.ts';

async function updateServices() {
  const db = getDb();
  await db.sql('UPDATE services SET duration = 40');
  console.log('Services updated to 40 minutes');
  process.exit(0);
}

updateServices().catch((e) => {
  console.error(e);
  process.exit(1);
});
