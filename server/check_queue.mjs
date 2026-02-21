import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('redis://localhost:6380', { maxRetriesPerRequest: null });
const queue = new Queue('submissions', { connection });

async function main() {
  console.log('Checking queue...');
  const counts = await queue.getJobCounts();
  console.log('Counts:', JSON.stringify(counts));
  
  const waiting = await queue.getWaiting();
  console.log('Waiting:', waiting.length);
  if (waiting.length > 0) console.log('First waiting:', waiting[0].id);

  const active = await queue.getActive();
  console.log('Active:', active.length);
  if (active.length > 0) console.log('First active:', active[0].id);

  const failed = await queue.getFailed();
  console.log('Failed:', failed.length);
  if (failed.length > 0) console.log('First failed reason:', failed[0].failedReason);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
