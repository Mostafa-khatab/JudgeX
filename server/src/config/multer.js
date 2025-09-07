import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import cloudinary from './cloudinary.js';

const avatarStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'avatar',
		allowed_formats: ['jpg', 'png', 'jpeg'],
		public_id: (req, file) => req.userId,
	},
});

const videoStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'courses/videos',
		allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
		resource_type: 'video',
		public_id: (req, file) => `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
	},
});

const thumbnailStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'courses/thumbnails',
		allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
		public_id: (req, file) => `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
	},
});

export const uploadAvatar = multer({ storage: avatarStorage });
export const uploadVideo = multer({ storage: videoStorage });
export const uploadThumbnail = multer({ storage: thumbnailStorage });
