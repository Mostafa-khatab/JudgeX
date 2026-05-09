import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import Blog from '../src/models/blog.js';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/judgex';

const syncBlogs = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(DATABASE_URL);
        console.log('Connected.');

        console.log('Syncing blogs from Codeforces...');
        const response = await axios.get('https://codeforces.com/api/recentActions?maxCount=50');
        const actions = response.data.result;

        let count = 0;
        for (const action of actions) {
            if (action.blogEntry) {
                const entry = action.blogEntry;
                const originalUrl = `https://codeforces.com/blog/entry/${entry.id}`;
                const cleanTitle = entry.title.replace(/<[^>]*>?/gm, '');

                await Blog.findOneAndUpdate(
                    { externalId: entry.id },
                    {
                        externalId: entry.id,
                        title: cleanTitle,
                        authorHandle: entry.authorHandle,
                        originalUrl,
                        creationTimeSeconds: entry.creationTimeSeconds,
                        rating: entry.rating || 0,
                        tags: entry.tags || [],
                    },
                    { upsert: true, new: true }
                );
                count++;
            }
        }

        console.log(`Successfully synced ${count} blogs.`);
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err.message);
        process.exit(1);
    }
};

syncBlogs();
