import SQLite, {
  SQLiteDatabase,
  ResultSet,
} from 'react-native-sqlite-storage';
import {ClipboardItem, ClipboardItemInput, DatabaseResult} from '../types';
import {generatePreview} from '../utils/formatters';

// Enable promise-based API
SQLite.enablePromise(true);

const DATABASE_NAME = 'clibber.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAY_NAME = 'Clibber Clipboard Database';

let database: SQLiteDatabase | null = null;

/**
 * Initialize and open the database connection
 */
export async function openDatabase(): Promise<SQLiteDatabase> {
  if (database) {
    return database;
  }

  database = await SQLite.openDatabase({
    name: DATABASE_NAME,
    location: 'default',
  });

  await createTables(database);
  return database;
}

/**
 * Create database tables if they don't exist
 */
async function createTables(db: SQLiteDatabase): Promise<void> {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS clipboard_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      content_preview TEXT,
      created_at INTEGER NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manual'
    );
  `);

  // Create indexes for faster queries
  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_created_at ON clipboard_items(created_at DESC);
  `);

  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_content ON clipboard_items(content);
  `);

  // Create settings table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Initialize default settings
  await db.executeSql(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_delete_days', 'null');
  `);

  await db.executeSql(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('max_items', '1000');
  `);
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.close();
    database = null;
  }
}

/**
 * Map database row to ClipboardItem
 */
function mapRowToClipboardItem(row: any): ClipboardItem {
  return {
    id: row.id,
    content: row.content,
    contentPreview: row.content_preview || generatePreview(row.content),
    createdAt: row.created_at,
    isFavorite: row.is_favorite === 1,
    source: row.source || 'manual',
  };
}

/**
 * Get all clipboard items, sorted by date (newest first)
 */
export async function getAllItems(): Promise<ClipboardItem[]> {
  const db = await openDatabase();
  const [results]: [ResultSet] = await db.executeSql(
    'SELECT * FROM clipboard_items ORDER BY created_at DESC',
  );

  const items: ClipboardItem[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    items.push(mapRowToClipboardItem(results.rows.item(i)));
  }

  return items;
}

/**
 * Get a single item by ID
 */
export async function getItemById(id: number): Promise<ClipboardItem | null> {
  const db = await openDatabase();
  const [results]: [ResultSet] = await db.executeSql(
    'SELECT * FROM clipboard_items WHERE id = ?',
    [id],
  );

  if (results.rows.length === 0) {
    return null;
  }

  return mapRowToClipboardItem(results.rows.item(0));
}

/**
 * Check if the most recent item has the same content (duplicate detection)
 */
export async function isDuplicate(content: string): Promise<boolean> {
  const db = await openDatabase();
  const [results]: [ResultSet] = await db.executeSql(
    'SELECT content FROM clipboard_items ORDER BY created_at DESC LIMIT 1',
  );

  if (results.rows.length === 0) {
    return false;
  }

  return results.rows.item(0).content === content;
}

/**
 * Add a new clipboard item
 */
export async function addItem(
  input: ClipboardItemInput,
): Promise<DatabaseResult> {
  // Check for duplicate
  if (await isDuplicate(input.content)) {
    return {rowsAffected: 0};
  }

  const db = await openDatabase();
  const preview = generatePreview(input.content);
  const createdAt = Date.now();

  const [result]: [ResultSet] = await db.executeSql(
    'INSERT INTO clipboard_items (content, content_preview, created_at, source) VALUES (?, ?, ?, ?)',
    [input.content, preview, createdAt, input.source],
  );

  // Enforce max items limit
  await enforceMaxItems();

  return {
    insertId: result.insertId,
    rowsAffected: result.rowsAffected,
  };
}

/**
 * Delete an item by ID
 */
export async function deleteItem(id: number): Promise<DatabaseResult> {
  const db = await openDatabase();
  const [result]: [ResultSet] = await db.executeSql(
    'DELETE FROM clipboard_items WHERE id = ?',
    [id],
  );

  return {rowsAffected: result.rowsAffected};
}

/**
 * Toggle favorite status for an item
 */
export async function toggleFavorite(id: number): Promise<boolean> {
  const db = await openDatabase();

  // Get current favorite status
  const [current]: [ResultSet] = await db.executeSql(
    'SELECT is_favorite FROM clipboard_items WHERE id = ?',
    [id],
  );

  if (current.rows.length === 0) {
    return false;
  }

  const newStatus = current.rows.item(0).is_favorite === 1 ? 0 : 1;

  await db.executeSql(
    'UPDATE clipboard_items SET is_favorite = ? WHERE id = ?',
    [newStatus, id],
  );

  return newStatus === 1;
}

/**
 * Search items by content
 */
export async function searchItems(query: string): Promise<ClipboardItem[]> {
  const db = await openDatabase();
  const searchPattern = `%${query}%`;

  const [results]: [ResultSet] = await db.executeSql(
    'SELECT * FROM clipboard_items WHERE content LIKE ? ORDER BY created_at DESC',
    [searchPattern],
  );

  const items: ClipboardItem[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    items.push(mapRowToClipboardItem(results.rows.item(i)));
  }

  return items;
}

/**
 * Delete old items based on auto-delete setting
 */
export async function deleteOldItems(): Promise<number> {
  const autoDeleteDays = await getSetting('auto_delete_days');

  if (autoDeleteDays === 'null' || autoDeleteDays === null) {
    return 0;
  }

  const days = parseInt(autoDeleteDays, 10);
  if (isNaN(days)) {
    return 0;
  }

  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const db = await openDatabase();

  // Don't delete favorites
  const [result]: [ResultSet] = await db.executeSql(
    'DELETE FROM clipboard_items WHERE created_at < ? AND is_favorite = 0',
    [cutoffTime],
  );

  return result.rowsAffected;
}

/**
 * Enforce maximum items limit
 */
async function enforceMaxItems(): Promise<void> {
  const maxItemsStr = await getSetting('max_items');
  const maxItems = parseInt(maxItemsStr || '1000', 10);

  const db = await openDatabase();

  // Get count of non-favorite items
  const [countResult]: [ResultSet] = await db.executeSql(
    'SELECT COUNT(*) as count FROM clipboard_items WHERE is_favorite = 0',
  );

  const count = countResult.rows.item(0).count;

  if (count > maxItems) {
    // Delete oldest non-favorite items
    const deleteCount = count - maxItems;
    await db.executeSql(
      `DELETE FROM clipboard_items WHERE id IN (
        SELECT id FROM clipboard_items
        WHERE is_favorite = 0
        ORDER BY created_at ASC
        LIMIT ?
      )`,
      [deleteCount],
    );
  }
}

/**
 * Get a setting value
 */
export async function getSetting(key: string): Promise<string | null> {
  const db = await openDatabase();
  const [results]: [ResultSet] = await db.executeSql(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );

  if (results.rows.length === 0) {
    return null;
  }

  return results.rows.item(0).value;
}

/**
 * Set a setting value
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await openDatabase();
  await db.executeSql(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<{
  autoDeleteDays: number | null;
  maxItems: number;
}> {
  const autoDeleteDays = await getSetting('auto_delete_days');
  const maxItems = await getSetting('max_items');

  return {
    autoDeleteDays:
      autoDeleteDays === 'null' ? null : parseInt(autoDeleteDays || '0', 10),
    maxItems: parseInt(maxItems || '1000', 10),
  };
}

/**
 * Clear all clipboard items (except favorites optionally)
 */
export async function clearAllItems(
  keepFavorites: boolean = true,
): Promise<number> {
  const db = await openDatabase();

  const query = keepFavorites
    ? 'DELETE FROM clipboard_items WHERE is_favorite = 0'
    : 'DELETE FROM clipboard_items';

  const [result]: [ResultSet] = await db.executeSql(query);
  return result.rowsAffected;
}
