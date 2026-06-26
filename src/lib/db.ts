import Database from 'better-sqlite3';
import path from 'path';

export interface JobRow {
  id: string;
  command: string;
  parsed_intent: string | null;
  status: 'pending' | 'running' | 'complete' | 'error';
  source_type: 'firecrawl' | 'custom_url';
  source_url: string | null;
  records_found: number;
  records_valid: number;
  duplicates_skipped: number;
  log: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResultRow {
  id: string;
  job_id: string;
  record: string;
  valid: number;
  missing_fields: string;
  created_at: string;
}

export interface SessionRow {
  token: string;
  expires_at: string;
}

const DB_PATH = path.join(process.cwd(), 'shovel.db');
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    migrate(_db);
  }
  return _db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      command TEXT NOT NULL,
      parsed_intent TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      source_type TEXT NOT NULL DEFAULT 'firecrawl',
      source_url TEXT,
      records_found INTEGER NOT NULL DEFAULT 0,
      records_valid INTEGER NOT NULL DEFAULT 0,
      duplicates_skipped INTEGER NOT NULL DEFAULT 0,
      log TEXT NOT NULL DEFAULT '[]',
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      record TEXT NOT NULL,
      valid INTEGER NOT NULL DEFAULT 1,
      missing_fields TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      expires_at TEXT NOT NULL
    );
  `);
}
