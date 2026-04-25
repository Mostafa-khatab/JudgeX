/**
 * restore-from-backup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Restores ALL collections from local BSON backup files
 * (backup/FloatPoint/*.bson) into the new Atlas cluster.
 *
 * Usage:
 *   node scripts/restore-from-backup.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { deserialize } from 'bson';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = resolve(__dirname, '../../backup/FloatPoint');
const URI = process.env.DATABASE_URL;
const DB_NAME = 'FloatPoint';
const BATCH_SIZE = 200;

// ── Parse a BSON file → array of documents ───────────────────────────────────
function parseBsonFile(filePath) {
  const buf = readFileSync(filePath);
  const docs = [];
  let offset = 0;

  while (offset < buf.length) {
    // Each BSON document starts with a 4-byte little-endian int32 (total size)
    if (offset + 4 > buf.length) break;
    const size = buf.readInt32LE(offset);
    if (size <= 0 || offset + size > buf.length) break;

    const docBuf = buf.slice(offset, offset + size);
    try {
      docs.push(deserialize(docBuf));
    } catch (e) {
      console.warn(`  ⚠️  Skipped malformed document at offset ${offset}: ${e.message}`);
    }
    offset += size;
  }

  return docs;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function restore() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('     JudgeX — Restore from Local BSON Backup           ');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Backup dir : ${BACKUP_DIR}`);
  console.log(`Target DB  : ${URI?.replace(/:([^:@]+)@/, ':***@')}\n`);

  if (!URI) {
    console.error('❌ DATABASE_URL not set in .env');
    process.exit(1);
  }

  // ── Find all .bson files ──────────────────────────────────────────────────
  const bsonFiles = readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.bson'))
    .map(f => join(BACKUP_DIR, f));

  if (bsonFiles.length === 0) {
    console.error('❌ No .bson files found in backup directory.');
    process.exit(1);
  }

  console.log(`Found ${bsonFiles.length} collection(s): ${bsonFiles.map(f => basename(f, '.bson')).join(', ')}\n`);

  // ── Connect ───────────────────────────────────────────────────────────────
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    console.log('✅ Connected to new cluster\n');

    const db = client.db(DB_NAME);
    const summary = [];

    for (const filePath of bsonFiles) {
      const collName = basename(filePath, '.bson');
      const fileSize = statSync(filePath).size;

      process.stdout.write(`  Restoring "${collName}" (${(fileSize / 1024).toFixed(1)} KB)… `);

      if (fileSize === 0) {
        console.log('empty file — skipped.');
        summary.push({ collName, total: 0, inserted: 0, status: 'empty' });
        continue;
      }

      // Parse BSON
      let docs;
      try {
        docs = parseBsonFile(filePath);
      } catch (e) {
        console.log(`parse error — ${e.message}`);
        summary.push({ collName, total: 0, inserted: 0, status: 'parse_error' });
        continue;
      }

      if (docs.length === 0) {
        console.log('no valid documents — skipped.');
        summary.push({ collName, total: 0, inserted: 0, status: 'empty' });
        continue;
      }

      const coll = db.collection(collName);
      let inserted = 0;
      let duplicates = 0;

      // Insert in batches
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = docs.slice(i, i + BATCH_SIZE);
        try {
          const result = await coll.insertMany(batch, { ordered: false });
          inserted += result.insertedCount;
        } catch (err) {
          if (err.code === 11000 || err.name === 'MongoBulkWriteError') {
            const ni = err.result?.insertedCount ?? 0;
            inserted += ni;
            duplicates += batch.length - ni;
          } else {
            throw err;
          }
        }
      }

      const dupNote = duplicates > 0 ? ` (${duplicates} dups skipped)` : '';
      console.log(`done — ${inserted}/${docs.length} docs inserted${dupNote}`);
      summary.push({ collName, total: docs.length, inserted, status: 'ok' });
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n───────────────────────────────────────────────────────');
    console.log('Restore Summary:');
    console.log('───────────────────────────────────────────────────────');
    for (const row of summary) {
      const icon = row.status === 'ok' ? '✅' : row.status === 'empty' ? '⏭️' : '❌';
      console.log(`  ${icon}  ${row.collName.padEnd(25)} ${row.inserted ?? 0} / ${row.total} docs`);
    }
    console.log('───────────────────────────────────────────────────────');
    console.log('✅ Restore complete!\n');

  } catch (err) {
    console.error('\n❌ Restore failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

restore();
