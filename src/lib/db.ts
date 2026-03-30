import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'data.sqlite');
  
  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL,
      bookingReference TEXT NOT NULL,
      bookingDate TEXT NOT NULL,
      refundReason TEXT NOT NULL,
      additionalDetails TEXT,
      fileUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenance_tickets (
      id TEXT PRIMARY KEY,
      ticketNumber TEXT NOT NULL UNIQUE,
      property TEXT NOT NULL,
      category TEXT NOT NULL,
      urgency TEXT NOT NULL,
      description TEXT NOT NULL,
      photoUrl TEXT,
      status TEXT NOT NULL DEFAULT 'Open',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}
