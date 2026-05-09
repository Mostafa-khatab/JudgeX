import mongoose from 'mongoose';
import Topic from './src/models/topic.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/judgex';

async function checkTopics() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    const topics = await Topic.find();
    console.log('Topics in DB:', topics.map(t => ({ _id: t._id, topicId: t.topicId, title: t.title })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTopics();
