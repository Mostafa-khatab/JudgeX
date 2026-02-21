import React, { useState, useEffect } from 'react';
import { getBlogComments, addComment } from '~/services/blog';
import CommentItem from './CommentItem';
import useAuthStore from '~/stores/authStore';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

const CommentSection = ({ blogId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore(); 

    const fetchComments = async () => {
        try {
            const res = await getBlogComments(blogId);
            if (res.success) {
                setComments(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [blogId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await addComment(blogId, { text: newComment });
            if (res.success) {
                setNewComment('');
                fetchComments(); // Refresh list
            }
        } catch (error) {
            console.error('Failed to post comment:', error);
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading comments...</div>;

    return (
        <div className="mt-6 border-t pt-4 dark:border-zinc-700">
            <h4 className="mb-4 text-lg font-semibold dark:text-gray-200">Comments ({comments.length})</h4>
            
            {user ? (
                <form onSubmit={handleSubmit} className="mb-6">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="mb-2 min-h-[80px]"
                    />
                    <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={!newComment.trim()}>
                            Post Comment
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="mb-6 rounded-lg bg-blue-50 p-4 text-center text-sm text-blue-600 dark:bg-zinc-900/50 dark:text-blue-400">
                    Please login to leave a comment.
                </div>
            )}

            <div className="space-y-4">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <CommentItem 
                            key={comment._id} 
                            comment={comment} 
                            blogId={blogId} 
                            onUpdate={fetchComments} 
                        />
                    ))
                ) : (
                    <p className="py-4 text-center text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
