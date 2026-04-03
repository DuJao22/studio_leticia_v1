import { Database } from '@sqlitecloud/drivers';

let db: Database | null = null;

const CONNECTION_STRING = 'sqlitecloud://ct9xsnnpvz.g1.sqlite.cloud:8860/Studio_leticia.db?apikey=c9lGTn4sb98t3kl3w2gU8cMXQiKDavSd7QF3vTwHV9Q';

export function getDb() {
  if (!db) {
    db = new Database(CONNECTION_STRING);
  }
  return db;
}

export async function initDb() {
  const database = getDb();
  
  try {
    await database.sql`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        price REAL NOT NULL,
        promotional_price REAL,
        image TEXT
      );
    `;

    await database.sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await database.sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        client_name TEXT NOT NULL,
        client_phone TEXT NOT NULL,
        service_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Agendado',
        notified_1day BOOLEAN DEFAULT 0,
        notified_1hour BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `;

    // Seed initial data if empty
    const services = await database.sql`SELECT COUNT(*) as count FROM services`;
    if (services[0].count === 0) {
      await database.sql`
        INSERT INTO services (name, description, duration, price, promotional_price, image) VALUES 
        ('Manicure', 'Cuidado completo para suas unhas com esmaltação premium.', 60, 50.00, 40.00, 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&q=80'),
        ('Pedicure', 'Spa dos pés e esmaltação perfeita.', 60, 60.00, NULL, 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=500&q=80'),
        ('Design de Sobrancelha', 'Mapeamento facial e design com henna.', 45, 45.00, 35.00, 'https://images.unsplash.com/photo-1588514930263-8a9d18728a55?w=500&q=80'),
        ('Corte de Cabelo', 'Corte moderno com lavagem e finalização.', 60, 120.00, NULL, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&q=80'),
        ('Tratamento Capilar', 'Hidratação profunda e reconstrução dos fios.', 90, 180.00, 150.00, 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&q=80');
      `;
    }
  } catch (error) {
    console.error('Error initializing SQLite Cloud database:', error);
  }
}
