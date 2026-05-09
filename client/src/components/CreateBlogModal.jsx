import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Tag, Type, AlignLeft } from 'lucide-react';
import { createBlog } from '~/services/blog';
import { toast } from 'react-toastify';

const CreateBlogModal = ({ isOpen, onClose, onBlogCreated }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content) {
            toast.error('Title and Content are required!');
            return;
        }

        setLoading(true);
        try {
            const tagList = tags.split(',').map(t => t.trim()).filter(t => t !== '');
            
            // Build content with image if provided
            let finalContent = `<div class="ttypography">`;
            if (imageUrl) {
                finalContent += `<img src="${imageUrl}" alt="${title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);" />`;
            }
            finalContent += `<p>${content.replace(/\n/g, '<br/>')}</p></div>`;

            const res = await createBlog({
                title,
                content: finalContent,
                tags: tagList
            });

            if (res.success) {
                toast.success('Blog published successfully!');
                onBlogCreated(res.data);
                onClose();
                // Reset form
                setTitle('');
                setContent('');
                setTags('');
                setImageUrl('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish blog');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 bg-zinc-800/50 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                                    <Send size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Create New Blog</h2>
                                    <p className="text-sm text-zinc-400">Share your knowledge with the community</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                        <Type size={16} className="text-blue-400" />
                                        Blog Title
                                    </label>
                                    <input 
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter a catchy title..."
                                        className="w-full rounded-xl border border-white/10 bg-zinc-800 p-3 text-white outline-none transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                                        required
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                        <Tag size={16} className="text-purple-400" />
                                        Tags (comma separated)
                                    </label>
                                    <input 
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        placeholder="e.g. React, JavaScript, AI"
                                        className="w-full rounded-xl border border-white/10 bg-zinc-800 p-3 text-white outline-none transition-all focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                        <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-orange-500/20 text-orange-400">
                                            <span className="text-[10px] font-bold">IMG</span>
                                        </div>
                                        Cover Image URL (optional)
                                    </label>
                                    <input 
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full rounded-xl border border-white/10 bg-zinc-800 p-3 text-white outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                        <AlignLeft size={16} className="text-emerald-400" />
                                        Content
                                    </label>
                                    <textarea 
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Write your blog content here... (Markdown supported)"
                                        rows={8}
                                        className="w-full resize-none rounded-xl border border-white/10 bg-zinc-800 p-3 text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 flex items-center justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-blue-900/40 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Publish Blog
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateBlogModal;
