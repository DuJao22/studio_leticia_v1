import { Database } from '@sqlitecloud/drivers';
import dotenv from 'dotenv';

dotenv.config();

let db: Database | null = null;

const DEFAULT_CONNECTION_STRING = 'sqlitecloud://ct9xsnnpvz.g1.sqlite.cloud:8860/Studio_leticia.db?apikey=c9lGTn4sb98t3kl3w2gU8cMXQiKDavSd7QF3vTwHV9Q';
const CONNECTION_STRING = process.env.SQLITE_CLOUD_CONNECTION_STRING || DEFAULT_CONNECTION_STRING;

if (!process.env.SQLITE_CLOUD_CONNECTION_STRING) {
  console.warn('WARNING: SQLITE_CLOUD_CONNECTION_STRING not found in environment variables. Using default connection string.');
}

export function getDb() {
  if (!db) {
    try {
      db = new Database(CONNECTION_STRING);
      console.log('Database connection instance created.');
    } catch (error) {
      console.error('Failed to create database connection instance:', error);
      throw error;
    }
  }
  return db;
}

export async function initDb(retries = 3): Promise<void> {
  const database = getDb();
  
  console.log(`Starting database tables initialization (attempts remaining: ${retries})...`);
  try {
    // Test connection
    await database.sql`SELECT 1`;
    console.log('Database connection test successful.');

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

    await database.sql`
      CREATE TABLE IF NOT EXISTS working_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_of_week INTEGER NOT NULL UNIQUE,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        start_time_2 TEXT,
        end_time_2 TEXT,
        is_active BOOLEAN DEFAULT 1
      );
    `;

    // Migration for existing table
    try {
      await database.sql`ALTER TABLE working_hours ADD COLUMN start_time_2 TEXT`;
      await database.sql`ALTER TABLE working_hours ADD COLUMN end_time_2 TEXT`;
      console.log('Migration: Added second shift columns to working_hours.');
    } catch (e) {
      // Ignore if columns already exist
    }

    await database.sql`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT NOT NULL UNIQUE,
        value TEXT
      );
    `;

    // Seed initial settings
    const settingsCount = await database.sql`SELECT COUNT(*) as count FROM settings`;
    if (settingsCount[0].count === 0) {
      console.log('Seeding initial settings...');
      await database.sql`
        INSERT INTO settings (setting_key, value) VALUES 
        ('cover_photo', 'https://images.unsplash.com/photo-1587775537446-271510255146?w=1600&q=80'),
        ('profile_photo', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80')
      `;
    }

    // Seed initial working hours
    const hoursCount = await database.sql`SELECT COUNT(*) as count FROM working_hours`;
    if (hoursCount[0].count === 0) {
      console.log('Seeding initial working hours...');
      await database.sql`
        INSERT INTO working_hours (day_of_week, start_time, end_time, is_active) VALUES 
        (0, '09:00', '18:00', 0), -- Sunday (Closed)
        (1, '09:00', '18:00', 1), -- Monday
        (2, '09:00', '18:00', 1), -- Tuesday
        (3, '09:00', '18:00', 1), -- Wednesday
        (4, '09:00', '18:00', 1), -- Thursday
        (5, '09:00', '18:00', 1), -- Friday
        (6, '09:00', '18:00', 1)  -- Saturday
      `;
    }

    // Seed initial data if empty
    const services = await database.sql`SELECT COUNT(*) as count FROM services`;
    if (services[0].count === 0) {
      console.log('Seeding initial services...');
      await database.sql`
        INSERT INTO services (name, description, duration, price, promotional_price, image) VALUES 
        ('Manicure', 'Cuidado completo para suas unhas com esmaltação premium.', 60, 50.00, 40.00, 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&q=80'),
        ('Pedicure', 'Spa dos pés e esmaltação perfeita.', 60, 60.00, NULL, 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=500&q=80'),
        ('Design de Sobrancelha', 'Mapeamento facial e design com henna.', 45, 45.00, 35.00, 'https://images.unsplash.com/photo-1588514930263-8a9d18728a55?w=500&q=80'),
        ('Corte de Cabelo', 'Corte moderno com lavagem e finalização.', 60, 120.00, NULL, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&q=80'),
        ('Tratamento Capilar', 'Hidratação profunda e reconstrução dos fios.', 90, 180.00, 150.00, 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&q=80');
      `;
    }
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error initializing SQLite Cloud database:', error);
    if (retries > 0) {
      console.log('Retrying database initialization in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return initDb(retries - 1);
    }
    throw error; // Re-throw to be caught by server initialization
  }
}
