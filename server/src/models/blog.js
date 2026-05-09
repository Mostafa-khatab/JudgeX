import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    externalId: { type: Number, unique: true, sparse: true }, // Codeforces Blog ID (optional for local)
    title: { type: String, required: true },
    authorHandle: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference for local authors
    content: { type: String }, // HTML content or summary
    originalUrl: { type: String }, // External link (optional for local)
    creationTimeSeconds: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    tags: [String],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    image: { type: String },
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
