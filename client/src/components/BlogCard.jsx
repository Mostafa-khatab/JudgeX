import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { likeBlog } from '~/services/blog';
import { Heart, MessageCircle } from 'lucide-react';
import CommentSection from './CommentSection';

const BlogCard = ({ blog: initialBlog }) => {
    const [blog, setBlog] = useState(initialBlog);
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(initialBlog.isLiked);
    const [likesCount, setLikesCount] = useState(initialBlog.likes?.length || 0);

    const handleLike = async () => {
        // Optimistic Update
        const newIsLiked = !isLiked;
        const newLikesCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
        
        setIsLiked(newIsLiked);
        setLikesCount(newLikesCount);

        try {
            const res = await likeBlog(blog._id);
            if (res.success) {
                // Confirm with server data just in case
                setIsLiked(res.isLiked);
                setLikesCount(res.likesCount);
            }
        } catch (error) {
            console.error('Failed to like blog:', error);
            // Rollback on failure
            setIsLiked(!newIsLiked);
            setLikesCount(newIsLiked ? newLikesCount - 1 : newLikesCount + 1);
        }
    };

    return (
        <div className="jx-glass mb-6 p-8 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl relative group overflow-hidden">
            {/* Subtle glow on hover */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
                            {blog.authorHandle?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">{blog.authorHandle}</span>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                {formatDistanceToNow(new Date(blog.creationTimeSeconds * 1000), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                    {blog.rating !== undefined && (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                            blog.rating >= 0 ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                        }`}>
                            {blog.rating > 0 ? '+' : ''}{blog.rating}
                        </div>
                    )}
                </div>

                <h3 className="mb-4">
                    <Link to={`/blog/${blog.externalId}`} className="text-2xl font-black tracking-tighter text-neutral-900 dark:text-neutral-50 hover:text-blue-500 transition-colors">
                        {blog.title || 'Untitled Blog'}
                    </Link>
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-6">
                    {blog.tags && blog.tags.map((tag, index) => (
                        <span key={index} className="text-[9px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 px-2.5 py-1 rounded-lg">
                            #{tag}
                        </span>
                    ))}
                </div>
                
                <div 
                    className="prose max-w-none dark:prose-invert prose-p:text-sm prose-p:leading-relaxed prose-p:text-neutral-600 dark:prose-p:text-neutral-400 prose-headings:font-black prose-headings:tracking-tighter border-b border-neutral-100 dark:border-white/5 pb-6"
                    dangerouslySetInnerHTML={{ __html: blog.content || '<p class="text-gray-400 italic">Loading content...</p>' }}
                ></div>

                {/* Social Actions */}
                <div className="mt-6 flex items-center gap-8">
                    <button 
                        onClick={handleLike}
                        className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${isLiked ? 'text-rose-500' : 'text-neutral-500 hover:text-rose-500'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${isLiked ? 'bg-rose-500/10' : 'bg-neutral-100 dark:bg-white/5 group-hover:bg-rose-500/5'}`}>
                            <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                        </div>
                        <span>{likesCount > 0 ? likesCount : ''} Likes</span>
                    </button>

                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${showComments ? 'text-blue-500' : 'text-neutral-500 hover:text-blue-500'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${showComments ? 'bg-blue-500/10' : 'bg-neutral-100 dark:bg-white/5 group-hover:bg-blue-500/5'}`}>
                            <MessageCircle size={16} />
                        </div>
                        <span>Comments</span>
                    </button>
                </div>

                {showComments && (
                    <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500">
                        <CommentSection blogId={blog._id} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogCard;
