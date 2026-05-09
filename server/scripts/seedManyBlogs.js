import mongoose from 'mongoose';
import Blog from '../src/models/blog.js';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

const topics = [
    { name: "React 19", tag: "Frontend", img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80" },
    { name: "Node.js Performance", tag: "Backend", img: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80" },
    { name: "Advanced SQL", tag: "Database", img: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80" },
    { name: "Kubernetes Guide", tag: "DevOps", img: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80" },
    { name: "Cybersecurity Tips", tag: "Security", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80" },
    { name: "Python for Data Science", tag: "AI", img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80" },
    { name: "TypeScript Best Practices", tag: "Frontend", img: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80" },
    { name: "Microservices Architecture", tag: "Backend", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" },
    { name: "GraphQL vs REST", tag: "API", img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=800&q=80" },
    { name: "Modern CSS Techniques", tag: "Frontend", img: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80" }
];

const authors = ["CodeMaster", "DevWizard", "TechGuru", "FrontendNerd", "BackendPro"];

const seedBlogs = async () => {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to DB.');

        // Clear previous blogs to avoid clutter
        await Blog.deleteMany({});
        console.log('Cleared existing blogs.');

        const blogs = [];
        for (let i = 1; i <= 30; i++) {
            const topic = topics[i % topics.length];
            const author = authors[i % authors.length];
            const date = Math.floor(Date.now() / 1000) - (i * 3600 * 5); // Spread over time

            blogs.push({
                externalId: 20000 + i,
                title: `${topic.name}: Part ${Math.ceil(i / 10)} - Deep Dive`,
                authorHandle: author,
                content: `
                    <div class="ttypography">
                        <p>This is a professional technical guide about <strong>${topic.name}</strong>. We cover the core concepts, implementation details, and best practices for modern developers.</p>
                        <img src="${topic.img}" alt="${topic.name}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.1);" />
                        <h3>Key Takeaways:</h3>
                        <ul>
                            <li>Understanding the core principles of ${topic.name}.</li>
                            <li>How to optimize performance in production environments.</li>
                            <li>Common pitfalls and how to avoid them.</li>
                        </ul>
                        <p>Stay tuned for more updates on this topic!</p>
                    </div>
                `,
                originalUrl: `https://judgex.io/blog/${20000 + i}`,
                creationTimeSeconds: date,
                rating: Math.floor(Math.random() * 500) - 50,
                tags: [topic.tag, "Tech", "Programming"]
            });
        }

        await Blog.insertMany(blogs);
        console.log(`Successfully seeded ${blogs.length} blogs with images.`);
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exit(1);
    }
};

seedBlogs();
