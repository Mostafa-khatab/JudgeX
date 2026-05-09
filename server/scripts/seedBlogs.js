import mongoose from 'mongoose';
import Blog from '../src/models/blog.js';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

const seedBlogs = async () => {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to DB.');

        // Clear existing empty blogs
        await Blog.deleteMany({ content: { $in: [null, '', 'Loading content...'] } });
        console.log('Cleared empty blogs.');

        const blogs = [
            {
                externalId: 10001,
                title: "Mastering System Design: Scalability and Performance",
                authorHandle: "JudgeX_Expert",
                content: `
                    <div class="ttypography">
                        <h3>Understanding Scalability</h3>
                        <p>Scalability is the capability of a system to handle a growing amount of work, or its potential to be enlarged to accommodate that growth.</p>
                        <ul>
                            <li><strong>Vertical Scaling:</strong> Adding more power (CPU, RAM) to your existing machine.</li>
                            <li><strong>Horizontal Scaling:</strong> Adding more machines to your network.</li>
                        </ul>
                        <h3>Load Balancing</h3>
                        <p>Load balancers distribute incoming network traffic across a group of backend servers, also known as a server farm or server pool.</p>
                        <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=800" alt="Server" style="max-width:100%; border-radius: 8px;" />
                    </div>
                `,
                originalUrl: "https://judgex.io/blog/1",
                creationTimeSeconds: Math.floor(Date.now() / 1000),
                rating: 150,
                tags: ["System Design", "Scalability", "Backend"]
            },
            {
                externalId: 10002,
                title: "The Future of AI in Competitive Programming",
                authorHandle: "AI_Research",
                content: `
                    <div class="ttypography">
                        <p>With the rise of Large Language Models (LLMs), competitive programming is changing. AI can now solve complex problems from Codeforces and LeetCode in seconds.</p>
                        <blockquote>"AI will not replace programmers, but programmers who use AI will replace those who don't."</blockquote>
                        <h3>Key Trends:</h3>
                        <ol>
                            <li>Automated code optimization.</li>
                            <li>AI-driven test case generation.</li>
                            <li>Intelligent debugging assistants.</li>
                        </ol>
                    </div>
                `,
                originalUrl: "https://judgex.io/blog/2",
                creationTimeSeconds: Math.floor(Date.now() / 1000) - 86400,
                rating: 85,
                tags: ["AI", "Competitive Programming", "Future"]
            },
            {
                externalId: 10003,
                title: "Modern Frontend: React 19 and Beyond",
                authorHandle: "Frontend_Wizard",
                content: `
                    <div class="ttypography">
                        <p>React 19 brings revolutionary features like Actions, Document Metadata, and the React Compiler. These changes aim to reduce boilerplate and improve performance automatically.</p>
                        <pre><code>const [isPending, startTransition] = useTransition();</code></pre>
                        <p>The compiler (React Forget) will handle memoization, meaning no more useMemo and useCallback in most cases!</p>
                    </div>
                `,
                originalUrl: "https://judgex.io/blog/3",
                creationTimeSeconds: Math.floor(Date.now() / 1000) - 172800,
                rating: 200,
                tags: ["React", "Frontend", "JavaScript"]
            }
        ];

        await Blog.insertMany(blogs);
        console.log('Seeded 3 high-quality blogs.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exit(1);
    }
};

seedBlogs();
