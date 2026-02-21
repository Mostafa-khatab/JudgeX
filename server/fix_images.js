import mongoose from 'mongoose';
import 'dotenv/config';
import * as cheerio from 'cheerio';
import Blog from './src/models/blog.js';

async function fixExistingImages() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to DB');

        const blogs = await Blog.find({ content: /src="\// });
        console.log(`Found ${blogs.length} blogs needing image URL fixes.`);

        for (const blog of blogs) {
            const $ = cheerio.load(blog.content);
            let fixed = false;

            $('img').each((i, el) => {
                const src = $(el).attr('src');
                if (src && src.startsWith('/')) {
                    $(el).attr('src', `https://codeforces.com${src}`);
                    fixed = true;
                }
            });

            if (fixed) {
                blog.content = $.html();
                await blog.save();
                console.log(`✅ Fixed images for blog ${blog.externalId}`);
            }
        }

        console.log('All existing blogs processed.');
    } catch (error) {
        console.error('Error during fix:', error);
    } finally {
        await mongoose.connection.close();
    }
}

fixExistingImages();
