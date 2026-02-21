import Comment from '../models/comment.js';

/**
 * Toggle like for a comment
 */
export const likeComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        const likeIndex = comment.likes.indexOf(userId);
        if (likeIndex === -1) {
            comment.likes.push(userId);
        } else {
            comment.likes.splice(likeIndex, 1);
        }

        await comment.save();
        res.status(200).json({ success: true, likesCount: comment.likes.length, isLiked: likeIndex === -1 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
