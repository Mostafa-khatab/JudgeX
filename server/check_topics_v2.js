import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL;

const topicSchema = new mongoose.Schema({
  topicId: String,
  title: String
});
const Topic = mongoose.model('Topic', topicSchema);

async function check() {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    const topics = await Topic.find();
    console.log('TOPICS_DATA:' + JSON.stringify(topics.map(t => ({ _id: t._id, topicId: t.topicId, title: t.title }))));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
