/**
 * migrate-to-new-cluster.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Migrates ALL collections from the OLD Atlas cluster (me-south-1 — kz9briq)
 * to the NEW Atlas cluster (Europe — 3omvsa9).
 *
 * Usage:
 *   node scripts/migrate-to-new-cluster.js
 *
 * Requirements:
 *   • Both clusters must be reachable (IPs whitelisted in Atlas).
 *   • npm install mongoose dotenv  (already installed in this project)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import mongoose from 'mongoose';

// ── Connection strings ────────────────────────────────────────────────────────
const OLD_URI =
  'mongodb://maaastafakhatab200_db_user:MssDvwq7dmbZ33j5' +
  '@ac-quxuvxx-shard-00-00.kz9briq.mongodb.net:27017' +
  ',ac-quxuvxx-shard-00-01.kz9briq.mongodb.net:27017' +
  ',ac-quxuvxx-shard-00-02.kz9briq.mongodb.net:27017' +
  '/FloatPoint?replicaSet=atlas-ey2nj1-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority';

const NEW_URI =
  'mongodb+srv://maaastafakhatab200_db_user:ur70IO6ozejTnH3K' +
  '@cluster0.3omvsa9.mongodb.net/FloatPoint' +
  '?appName=Cluster0&retryWrites=true&w=majority';

const TIMEOUT_MS = 30_000;

// ── Helpers ───────────────────────────────────────────────────────────────────
function redact(uri) {
  return uri.replace(/:([^:@]+)@/, ':***@');
}

async function openConnection(uri, label) {
  const conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: TIMEOUT_MS,
    connectTimeoutMS: TIMEOUT_MS,
  }).asPromise();
  console.log(`✅ Connected to ${label}`);
  return conn;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function migrate() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('         JudgeX — MongoDB Cluster Migration Tool        ');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`OLD: ${redact(OLD_URI)}`);
  console.log(`NEW: ${redact(NEW_URI)}\n`);

  let oldConn, newConn;

  try {
    // ── 1. Connect to both clusters ──────────────────────────────────────────
    console.log('Connecting to OLD cluster…');
    oldConn = await openConnection(OLD_URI, 'OLD cluster (me-south-1)');

    console.log('Connecting to NEW cluster…');
    newConn = await openConnection(NEW_URI, 'NEW cluster (Europe)');

    // ── 2. Discover all collections in the OLD DB ────────────────────────────
    const collectionsInfo = await oldConn.db.listCollections().toArray();
    const collectionNames = collectionsInfo.map((c) => c.name);

    if (collectionNames.length === 0) {
      console.log('\n⚠️  No collections found in the OLD database. Nothing to migrate.');
      return;
    }

    console.log(`\nCollections to migrate (${collectionNames.length}): ${collectionNames.join(', ')}\n`);

    // ── 3. Migrate each collection ───────────────────────────────────────────
    const summary = [];

    for (const name of collectionNames) {
      process.stdout.write(`  Migrating "${name}"… `);

      const oldCol = oldConn.db.collection(name);
      const newCol = newConn.db.collection(name);

      const docs = await oldCol.find({}).toArray();

      if (docs.length === 0) {
        console.log('empty — skipped.');
        summary.push({ name, count: 0, status: 'skipped' });
        continue;
      }

      // Insert in batches of 500 to avoid overwhelming the new cluster
      const BATCH = 500;
      let inserted = 0;

      for (let i = 0; i < docs.length; i += BATCH) {
        const batch = docs.slice(i, i + BATCH);
        try {
          await newCol.insertMany(batch, { ordered: false });
          inserted += batch.length;
        } catch (err) {
          // BulkWriteError code 11000 = duplicate key — safe to ignore if re-running
          if (err.code === 11000 || err.name === 'MongoBulkWriteError') {
            inserted += err.result?.nInserted ?? 0;
            process.stdout.write(`(${err.result?.nInserted ?? '?'} new / dups skipped) `);
          } else {
            throw err;
          }
        }
      }

      console.log(`done — ${inserted}/${docs.length} documents.`);
      summary.push({ name, count: docs.length, inserted, status: 'ok' });
    }

    // ── 4. Print summary ─────────────────────────────────────────────────────
    console.log('\n───────────────────────────────────────────────────────');
    console.log('Migration Summary:');
    console.log('───────────────────────────────────────────────────────');
    for (const row of summary) {
      const icon = row.status === 'ok' ? '✅' : '⏭️';
      console.log(`  ${icon}  ${row.name.padEnd(25)} ${row.inserted ?? 0} / ${row.count} docs`);
    }
    console.log('───────────────────────────────────────────────────────');
    console.log('✅ Migration complete!\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    if (err.message.includes('whitelist') || err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.error('\n💡 Action required: Whitelist your current IP in MongoDB Atlas:');
      console.error('   https://cloud.mongodb.com → Security → Network Access → + Add IP Address');
      console.error('   Use 0.0.0.0/0 temporarily if you need immediate access.\n');
    }
    process.exitCode = 1;
  } finally {
    if (oldConn) await oldConn.close();
    if (newConn) await newConn.close();
  }
}

migrate();
