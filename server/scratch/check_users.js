import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../src/models/user.js';

async function checkUsers() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    const count = await User.countDocuments();
    const users = await User.find({}, { email: 1, name: 1 }).limit(5);
    console.log(`Total users: ${count}`);
    console.log('Sample users:', users);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUsers();
