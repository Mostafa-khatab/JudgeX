import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { likeComment, addComment } from '~/services/blog';
import { Heart, Reply } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

const CommentItem = ({ comment, blogId, onUpdate }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isLiked, setIsLiked] = useState(comment.isLiked);
    const [likesCount, setLikesCount] = useState(comment.likes?.length || 0);

    const handleLike = async () => {
        // Optimistic Update
        const newIsLiked = !isLiked;
        const newLikesCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
        
        setIsLiked(newIsLiked);
        setLikesCount(newLikesCount);

        try {
            const res = await likeComment(comment._id);
            if (res.success) {
                setIsLiked(res.isLiked);
                setLikesCount(res.likesCount);
            }
        } catch (error) {
            console.error('Like failed:', error);
            // Rollback
            setIsLiked(!newIsLiked);
            setLikesCount(newIsLiked ? newLikesCount - 1 : newLikesCount + 1);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const res = await addComment(blogId, { text: replyText, parentId: comment._id });
            if (res.success) {
                setReplyText('');
                setIsReplying(false);
                onUpdate(); // Refresh parent list
            }
        } catch (error) {
            console.error('Reply failed:', error);
        }
    };

    return (
        <div className={`flex flex-col space-y-2 ${comment.parentId ? 'ml-8' : ''}`}>
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
                    {comment.userId?.avatar ? (
                        <img src={comment.userId?.avatar} alt={comment.userId?.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-500">
                            {comment.userId?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex-1 rounded-2xl bg-gray-100 p-3 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold dark:text-gray-200">{comment.userId?.name}</span>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-800 dark:text-gray-300">{comment.text}</p>
                </div>
            </div>

            <div className="ml-11 flex items-center gap-4 text-xs font-semibold text-gray-500">
                <button 
                    onClick={handleLike} 
                    className={`flex items-center gap-1 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500 font-bold' : ''}`}
                >
                    <Heart size={14} className={isLiked ? 'fill-current' : ''} />
                    {likesCount > 0 && likesCount} Like
                </button>
                
                {!comment.parentId && (
                    <button 
                        onClick={() => setIsReplying(!isReplying)}
                        className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${isReplying ? 'text-blue-500' : ''}`}
                    >
                        <Reply size={14} />
                        Reply
                    </button>
                )}
            </div>

            {isReplying && (
                <form onSubmit={handleReply} className="ml-11 mt-2 flex flex-col gap-2">
                    <Textarea 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="min-h-[60px]"
                    />
                    <div className="flex justify-end gap-2">
                         <Button type="button" variant="ghost" size="sm" onClick={() => setIsReplying(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!replyText.trim()}>
                            Reply
                        </Button>
                    </div>
                </form>
            )}

            {/* Render Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2">
                    {comment.replies.map(reply => (
                        <CommentItem 
                            key={reply._id} 
                            comment={reply} 
                            blogId={blogId} 
                            onUpdate={onUpdate} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
