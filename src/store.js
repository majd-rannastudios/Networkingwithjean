import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Persistence.
//
// The whole event is small enough to hold in memory and snapshot as one blob,
// so that is exactly what we do. Postgres when DATABASE_URL is set (Railway
// injects it), a local JSON file otherwise, so `npm start` needs no setup.
//
// Writes are debounced: a room of 300 people heartbeating is a lot of churn
// and none of it needs to hit disk immediately. What matters is that a crash
// or redeploy mid-event loses seconds, not the event.
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 2000;
const FILE = path.join(process.cwd(), 'data', 'state.json');

let driver = null;
let pending = null;
let timer = null;

export async function initStore() {
  if (process.env.DATABASE_URL) {
    try {
      const { default: pg } = await import('pg');
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      await pool.query(`
        CREATE TABLE IF NOT EXISTS event_state (
          id         int PRIMARY KEY,
          data       jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      driver = {
        name: 'postgres',
        async load() {
          const { rows } = await pool.query('SELECT data FROM event_state WHERE id = 1');
          return rows[0]?.data ?? null;
        },
        async save(snapshot) {
          await pool.query(
            `INSERT INTO event_state (id, data, updated_at) VALUES (1, $1, now())
             ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()`,
            [snapshot]
          );
        }
      };
      console.log('[store] postgres');
      return driver;
    } catch (err) {
      console.error('[store] postgres unavailable, falling back to file:', err.message);
    }
  }

  driver = {
    name: 'file',
    async load() {
      try {
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
      } catch {
        return null;
      }
    },
    async save(snapshot) {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      // Write-then-rename, so a crash mid-write cannot leave a truncated file.
      const tmp = `${FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(snapshot));
      fs.renameSync(tmp, FILE);
    }
  };
  console.log('[store] file:', FILE);
  return driver;
}

export async function load() {
  if (!driver) await initStore();
  try {
    return await driver.load();
  } catch (err) {
    console.error('[store] load failed:', err.message);
    return null;
  }
}

/** Queue a snapshot. Repeated calls inside the debounce window collapse. */
export function save(snapshot) {
  pending = snapshot;
  if (timer) return;
  timer = setTimeout(flush, DEBOUNCE_MS);
  if (timer.unref) timer.unref();
}

export async function flush() {
  clearTimeout(timer);
  timer = null;
  if (!pending || !driver) return;
  const snapshot = pending;
  pending = null;
  try {
    await driver.save(snapshot);
  } catch (err) {
    console.error('[store] save failed:', err.message);
  }
}

export function driverName() {
  return driver?.name ?? 'none';
}
