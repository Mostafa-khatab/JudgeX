import mongoose from 'mongoose';
import 'dotenv/config';
import Blog from './src/models/blog.js';

async function checkImages() {
    await mongoose.connect(process.env.DATABASE_URL);
    const blogsWithImages = await Blog.find({ content: /<img/ }).limit(5);
    
    console.log(`Found ${blogsWithImages.length} blogs with <img> tags.`);
    
    blogsWithImages.forEach(blog => {
        console.log(`\nBlog ID: ${blog.externalId}`);
        const imgs = blog.content.match(/<img[^>]+src="([^">]+)"/g);
        console.log('Image tags found:', imgs);
    });
    
    await mongoose.connection.close();
}
checkImages();
