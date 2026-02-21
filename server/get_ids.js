import mongoose from 'mongoose';
import 'dotenv/config';
import Blog from './src/models/blog.js';
import User from './src/models/user.js';

async function check() {
    await mongoose.connect(process.env.DATABASE_URL);
    const blog = await Blog.findOne();
    const user = await User.findOne();
    console.log('--- TEST DATA ---');
    console.log('BlogID:', blog?._id);
    console.log('UserID:', user?._id);
    console.log('-----------------');
    await mongoose.connection.close();
}
check();
