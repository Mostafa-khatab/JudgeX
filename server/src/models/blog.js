import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    externalId: { type: Number, required: true, unique: true }, // Codeforces Blog ID
    title: { type: String, required: true },
    authorHandle: { type: String, required: true },
    content: { type: String }, // HTML content or summary
    originalUrl: { type: String, required: true },
    creationTimeSeconds: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    tags: [String],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
