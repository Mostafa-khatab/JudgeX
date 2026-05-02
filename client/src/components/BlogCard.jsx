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
        <div className="mb-4 flex flex-col rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-800 dark:shadow-[0px_0px_7px_rgba(0,0,0,0.2)]">
            <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-gray-100">
                <Link to={`/blog/${blog.externalId}`} className="hover:text-blue-500 hover:underline">
                    {blog.title || 'Untitled Blog'}
                </Link>
            </h3>
            
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-blue-500">{blog.authorHandle}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(blog.creationTimeSeconds * 1000), { addSuffix: true })}</span>
                {blog.rating !== undefined && (
                    <>
                         <span>•</span>
                         <span className={blog.rating >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {blog.rating > 0 ? '+' : ''}{blog.rating}
                         </span>
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {blog.tags && blog.tags.map((tag, index) => (
                    <span key={index} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-zinc-700 dark:text-gray-300">
                        {tag}
                    </span>
                ))}
            </div>
            
             <div 
                className="prose max-w-none dark:prose-invert mt-6 border-b border-gray-100 pb-4 dark:border-zinc-700"
                dangerouslySetInnerHTML={{ __html: blog.content || '<p class="text-gray-400 italic">Loading content...</p>' }}
            ></div>

            {/* Social Actions */}
            <div className="mt-4 flex items-center gap-6 border-t pt-4 dark:border-zinc-700 font-semibold text-gray-600 dark:text-gray-400">
                <button 
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition-colors hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}
                >
                    <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                    <span>{likesCount > 0 ? likesCount : ''} Like</span>
                </button>

                <button 
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-2 transition-colors hover:text-blue-500 ${showComments ? 'text-blue-500' : ''}`}
                >
                    <MessageCircle size={20} />
                    <span>Comment</span>
                </button>
            </div>

            {showComments && (
                <CommentSection blogId={blog._id} />
            )}
        </div>
    );
};

export default BlogCard;
