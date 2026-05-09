import axios from 'axios';
import Blog from '../models/blog.js';
import Comment from '../models/comment.js';
import mongoose from 'mongoose';

import * as cheerio from 'cheerio'; // Import cheerio
import puppeteer from 'puppeteer';

/**
 * Get paginated blogs
 */
export const getBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const blogs = await Blog.find()
            .populate('user', 'name avatar')
            .sort({ creationTimeSeconds: -1 }) // Newest first
            .skip(skip)
            .limit(limit)
            .lean(); // Convert to plan JS objects to add virtual fields
        
        // Enhance blogs with counts and like status
        const enhancedBlogs = await Promise.all(blogs.map(async (blog) => {
            const commentsCount = await Comment.countDocuments({ blogId: blog._id });
            const likesCount = blog.likes?.length || 0;
            const isLiked = req.userId ? blog.likes?.some(id => id.toString() === req.userId.toString()) : false;
            
            return {
                ...blog,
                commentsCount,
                likesCount,
                isLiked
            };
        }));

        const total = await Blog.countDocuments();

        res.status(200).json({
            success: true,
            data: enhancedBlogs,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get single blog by ID (externalId or _id)
 */
export const getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        // Try finding by externalId first (number), then by _id
        let blog = await Blog.findOne({ externalId: id });
        if (!blog && mongoose.Types.ObjectId.isValid(id)) {
            blog = await Blog.findById(id);
        }

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.status(200).json({ success: true, data: blog });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Sync blogs from Codeforces API and Scrape Content
 */
export const syncCodeforcesBlogs = async (req, res) => {
    try {
        console.log('🔄 Syncing blogs from Codeforces...');
        const response = await axios.get('https://codeforces.com/api/recentActions?maxCount=100');
        const actions = response.data.result;

        let count = 0;
        const blogsToUpdate = [];

        for (const action of actions) {
            if (action.blogEntry) {
                const entry = action.blogEntry;
                const originalUrl = `https://codeforces.com/blog/entry/${entry.id}`;
                const cleanTitle = entry.title.replace(/<[^>]*>?/gm, '');

                const blog = await Blog.findOneAndUpdate(
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
        
        console.log(`✅ Synced/Updated ${count} blog entries.`);
        
        // Find blogs needing content from DB (Prioritize those without content)
        const blogsToScrape = await Blog.find({
            $or: [{ content: { $exists: false } }, { content: '' }, { content: null }]
        }).sort({ creationTimeSeconds: -1 }).limit(30);

        // Scrape content using Puppeteer (Bypass 403)
        console.log(`📝 Scraping content for ${blogsToScrape.length} blogs from DB using Puppeteer...`);
        
        let scrapedCount = 0;
        if (blogsToScrape.length > 0) {
            console.log('🚀 Launching Puppeteer browser...');
            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                console.log('✅ Browser launched.');

                try {
                    for (const blog of blogsToScrape) {
                        console.log(`📄 Scraper opening page for blog ${blog.externalId}...`);
                        try {
                            const page = await browser.newPage();
                            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                            
                            // Optimize loading
                            await page.setRequestInterception(true);
                            page.on('request', (req) => {
                                if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                                    req.abort();
                                } else {
                                    req.continue();
                                }
                            });

                            await page.goto(blog.originalUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                            console.log(`✅ Page loaded for ${blog.externalId}. Waiting for selector...`);
                            
                            // Wait for content
                            try {
                                await page.waitForSelector('.ttypography', { timeout: 10000 });
                                const content = await page.$eval('.ttypography', el => el.innerHTML);
                                if (content) {
                                    // Process images to be absolute URLs
                                    const $ = cheerio.load(content);
                                    $('img').each((i, el) => {
                                        const src = $(el).attr('src');
                                        if (src && src.startsWith('/')) {
                                            $(el).attr('src', `https://codeforces.com${src}`);
                                        }
                                    });
                                    
                                    blog.content = $.html();
                                    await blog.save();
                                    scrapedCount++;
                                    console.log(`✅ Scraped & Saved content (with absolute images) for blog ${blog.externalId}`);
                                }
                            } catch (e) {
                                console.log(`⚠️ Content selector not found or timeout for ${blog.externalId}`);
                            }

                            await page.close();
                            // Random delay
                            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
                        } catch (err) {
                            console.error(`❌ Failed to scrape blog ${blog.externalId}: ${err.message}`);
                        }
                    }
                } finally {
                    await browser.close();
                    console.log('🔒 Browser closed.');
                }
            } catch (launchErr) {
                 console.error('❌ Puppeteer Launch Failed:', launchErr.message);
            }
        }

        console.log(`✅ Synced ${count} entries, Scraped ${scrapedCount} contents.`);
        if (res) res.status(200).json({ success: true, message: `Synced ${count} entries, Scraped ${scrapedCount} contents` });
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        if (res) res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Toggle like for a blog
 */
export const likeBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const blog = await Blog.findById(id);
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

        const likeIndex = blog.likes.indexOf(userId);
        if (likeIndex === -1) {
            blog.likes.push(userId);
        } else {
            blog.likes.splice(likeIndex, 1);
        }

        await blog.save();
        res.status(200).json({ success: true, likesCount: blog.likes.length, isLiked: likeIndex === -1 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Add a comment to a blog
 */
export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, parentId } = req.body;
        const userId = req.userId;

        const comment = await Comment.create({
            blogId: id,
            userId,
            text,
            parentId: parentId || null
        });

        await comment.populate('userId', 'name avatar');

        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get comments for a blog
 */
export const getBlogComments = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await Comment.find({ blogId: id })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 });

        // Simple nesting for 1-level replies
        const topLevelComments = comments.filter(c => !c.parentId);
        const replies = comments.filter(c => c.parentId);

        const structuredComments = topLevelComments.map(comment => {
            const commentObj = comment.toObject();
            commentObj.replies = replies.filter(r => r.parentId.toString() === comment._id.toString());
            // Add isLiked info if user is logged in
            if (req.userId) {
                commentObj.isLiked = comment.likes?.some(uid => uid.toString() === req.userId.toString());
                commentObj.replies.forEach(reply => {
                    reply.isLiked = reply.likes?.some(uid => uid.toString() === req.userId.toString());
                });
            }
            return commentObj;
        });

        res.status(200).json({ success: true, data: structuredComments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new blog (local)
 */
export const createBlog = async (req, res) => {
    try {
        const { title, content, tags, image } = req.body;
        const user = await mongoose.model('User').findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newBlog = await Blog.create({
            title,
            content,
            tags: tags || [],
            authorHandle: user.name || user.handle, // Use user's name as handle
            user: user._id,
            creationTimeSeconds: Math.floor(Date.now() / 1000),
            rating: 0,
            likes: [],
            image
        });

        res.status(201).json({
            success: true,
            data: newBlog
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
