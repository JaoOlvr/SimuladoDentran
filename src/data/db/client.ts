import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { inicializarBancoLocal } from './migrator';

let expoDbInstance: SQLite.SQLiteDatabase | null = null;
let drizzleDbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const DB_NAME = 'simuladetran.db';

export function getExpoSqliteDb(): SQLite.SQLiteDatabase {
  if (!expoDbInstance) {
    expoDbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return expoDbInstance;
}

export function getDb() {
  if (!drizzleDbInstance) {
    const rawDb = getExpoSqliteDb();
    // Executa migrações e seeds idempotentes no primeiro acesso
    inicializarBancoLocal(rawDb);
    drizzleDbInstance = drizzle(rawDb, { schema });
  }
  return drizzleDbInstance;
}
