import { useState, useEffect, memo } from 'react';
import { Button, IconButton, Dialog, DialogHeader, DialogBody, DialogFooter, Input, Textarea, Tooltip } from '@material-tailwind/react';
import { Play, ExternalLink, Clock, Star, Users, Search, Plus, Edit, Trash2, Eye, Upload, Link as LinkIcon, Image } from 'lucide-react';
import { toast } from 'react-toastify';
import courseService from '~/services/courseService';
import useAuthStore from '~/stores/authStore';
import Select from '~/components/Select';
import Pagination from '~/components/Pagination';
import FullOutlineInput from '~/components/FullOutlineInput';
import useDebounce from '~/hooks/useDebounce';

// eslint-disable-next-line react/display-name, react/prop-types
const TableSkeleton = memo(({ perPage }) =>
	[...Array(perPage)].map((_, index) => (
		<tr key={index} className="skeleton odd:skeleton-variant h-16">
			{[...Array(8)].map((_, idx) => (
				<td key={idx} className="p-4"></td>
			))}
		</tr>
	)),
);

// eslint-disable-next-line react/display-name
const TableRow = memo(({ item, setSelectId, setOpenDeleteDialog, handleEditClick, setUploadVideoDialog, setUploadThumbnailDialog, setSelectedCourseId }) => (
	<tr className="even:bg-base-200 dark:bg-base-200 dark:even:bg-base-100 bg-base-100 text-base-content/80">
		<td className="p-4">
			{item.thumbnail ? (
				<img
					src={item.thumbnail}
					alt={item.title}
					className="w-12 h-12 object-cover rounded"
				/>
			) : (
				<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
					<Play className="w-6 h-6 text-white" />
				</div>
			)}
		</td>
		<td className="p-4 text-sm font-medium">{item.title}</td>
		<td className="p-4 text-sm">{item.instructor}</td>
		<td className="p-4 text-sm">
			<span className={`px-2 py-1 rounded-full text-xs ${
				item.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
				item.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
				'bg-red-100 text-red-800'
			}`}>
				{item.difficulty}
			</span>
		</td>
		<td className="p-4 text-sm">{item.duration || '-'}</td>
		<td className="p-4 text-sm">
			{item.rating > 0 ? `${item.rating.toFixed(1)} (${item.ratingCount})` : '-'}
		</td>
		<td className="p-4 text-sm">
			<span className={`px-2 py-1 rounded-full text-xs ${
				item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
			}`}>
				{item.isPublished ? 'Published' : 'Draft'}
			</span>
		</td>
		<td className="space-x-2 p-4 text-sm">
			<Tooltip content="View">
				<IconButton
					size="sm"
					className="bg-info hover:!shadow-cmd cursor-pointer rounded-full"
					onClick={() => {
						const clientUrl = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';
						window.open(`${clientUrl}/course/${item._id}`, '_blank');
					}}
				>
					<Eye color="#fff" size="16" />
				</IconButton>
			</Tooltip>
			<Tooltip content="Edit">
				<IconButton
					size="sm"
					className="bg-warning hover:!shadow-cmd cursor-pointer rounded-full"
					onClick={() => handleEditClick(item)}
				>
					<Edit color="#fff" size="16" />
				</IconButton>
			</Tooltip>
			<Tooltip content="Upload Video">
				<IconButton
					size="sm"
					className="bg-primary hover:!shadow-cmd cursor-pointer rounded-full"
					onClick={() => {
						setSelectedCourseId(item._id);
						setUploadVideoDialog(true);
					}}
				>
					<Upload color="#fff" size="16" />
				</IconButton>
			</Tooltip>
			<Tooltip content="Upload Thumbnail">
				<IconButton
					size="sm"
					className="bg-secondary hover:!shadow-cmd cursor-pointer rounded-full"
					onClick={() => {
						setSelectedCourseId(item._id);
						setUploadThumbnailDialog(true);
					}}
				>
					<Image color="#fff" size="16" />
				</IconButton>
			</Tooltip>
			<Tooltip content="Delete">
				<IconButton
					size="sm"
					className="bg-error hover:!shadow-cmd cursor-pointer rounded-full"
					onClick={() => {
						setSelectId(item._id);
						setOpenDeleteDialog(true);
					}}
				>
					<Trash2 color="#fff" size="16" />
				</IconButton>
			</Tooltip>
		</td>
	</tr>
));

const Courses = () => {
	const [courses, setCourses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [difficultyFilter, setDifficultyFilter] = useState('all');
	const [isPublishedFilter, setIsPublishedFilter] = useState('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectId, setSelectId] = useState(null);
	const [perPage, setPerPage] = useState(50);
	const [uploadVideoDialog, setUploadVideoDialog] = useState(false);
	const [uploadThumbnailDialog, setUploadThumbnailDialog] = useState(false);
	const [selectedCourseId, setSelectedCourseId] = useState(null);
	const [videoFile, setVideoFile] = useState(null);
	const [thumbnailFile, setThumbnailFile] = useState(null);
	const { token } = useAuthStore();

	const searchValue = useDebounce(searchQuery, 400);

	const [formData, setFormData] = useState({
		title: '',
		description: '',
		instructor: '',
		thumbnail: '',
		difficulty: 'beginner',
		duration: '',
		isPublished: false,
		tags: '',
		videos: [],
		links: [],
	});

	const difficultyOptions = [
		{ value: 'all', label: 'All Levels' },
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
	];

	const publishedOptions = [
		{ value: 'all', label: 'All Status' },
		{ value: 'true', label: 'Published' },
		{ value: 'false', label: 'Draft' },
	];

	const fetchCourses = async () => {
		try {
			setLoading(true);
			const params = {
				q: searchValue,
				difficulty: difficultyFilter === 'all' ? '' : difficultyFilter,
				isPublished: isPublishedFilter === 'all' ? '' : isPublishedFilter,
				page: currentPage,
				size: perPage,
			};

			const response = await courseService.getCourses(params);
			setCourses(response.data);
			setTotalPages(response.maxPage);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCourses();
	}, [searchValue, difficultyFilter, isPublishedFilter, currentPage, perPage]);

	// Handle pagination validation
	useEffect(() => {
		if (totalPages > 0 && currentPage > totalPages) {
			setCurrentPage(totalPages);
		} else if (currentPage < 1) {
			setCurrentPage(1);
		}
	}, [totalPages, currentPage]);

	const handleCreateCourse = async () => {
		try {
			const courseData = {
				...formData,
				tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
			};

			await courseService.createCourse(courseData, token);
			toast.success('Course created successfully');
			setIsCreateDialogOpen(false);
			resetForm();
			fetchCourses();
		} catch (error) {
			toast.error(error.message);
		}
	};

	const handleEditCourse = async () => {
		try {
			const courseData = {
				...formData,
				tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
			};

			await courseService.updateCourse(editingCourse._id, courseData, token);
			toast.success('Course updated successfully');
			setIsEditDialogOpen(false);
			setEditingCourse(null);
			resetForm();
			fetchCourses();
		} catch (error) {
			toast.error(error.message);
		}
	};

	const handleDeleteCourse = async () => {
		if (!selectId) return;
		
		try {
			await courseService.deleteCourse(selectId, token);
			toast.success('Course deleted successfully');
			setDeleteDialogOpen(false);
			setSelectId(null);
			fetchCourses();
		} catch (error) {
			toast.error(error.message);
		}
	};

	const handleEditClick = async (course) => {
		try {
			// fetch latest data to ensure fields are populated
			const res = await courseService.getCourse(course._id);
			const fresh = (res && res.data) ? res.data : course; // res.data here is the payload from API { success, data } or direct; normalize below
			const payload = fresh?.data || fresh; // prefer .data if present
			setEditingCourse(payload);
			setFormData({
				title: payload.title || '',
				description: payload.description || '',
				instructor: payload.instructor || '',
				thumbnail: payload.thumbnail || '',
				difficulty: payload.difficulty || 'beginner',
				duration: payload.duration || '',
				isPublished: !!payload.isPublished,
				tags: Array.isArray(payload.tags) ? payload.tags.join(', ') : (payload.tags || ''),
				videos: Array.isArray(payload.videos) ? payload.videos : [],
				links: Array.isArray(payload.links) ? payload.links : [],
			});
			setIsEditDialogOpen(true);
		} catch (e) {
			// fallback to given course object
			setEditingCourse(course);
			setFormData({
				title: course.title || '',
				description: course.description || '',
				instructor: course.instructor || '',
				thumbnail: course.thumbnail || '',
				difficulty: course.difficulty || 'beginner',
				duration: course.duration || '',
				isPublished: !!course.isPublished,
				tags: Array.isArray(course.tags) ? course.tags.join(', ') : (course.tags || ''),
				videos: Array.isArray(course.videos) ? course.videos : [],
				links: Array.isArray(course.links) ? course.links : [],
			});
			setIsEditDialogOpen(true);
		}
	};

	const resetForm = () => {
		setFormData({
			title: '',
			description: '',
			instructor: '',
			thumbnail: '',
			difficulty: 'beginner',
			duration: '',
			isPublished: false,
			tags: '',
			videos: [],
			links: [],
		});
	};

	const addVideo = () => {
		setFormData({
			...formData,
			videos: [...formData.videos, { title: '', url: '', duration: '', description: '' }]
		});
	};

	const removeVideo = (index) => {
		setFormData({
			...formData,
			videos: formData.videos.filter((_, i) => i !== index)
		});
	};

	const updateVideo = (index, field, value) => {
		const newVideos = [...formData.videos];
		newVideos[index] = { ...newVideos[index], [field]: value };
		setFormData({ ...formData, videos: newVideos });
	};

	const addLink = () => {
		setFormData({
			...formData,
			links: [...formData.links, { title: '', url: '', description: '', type: 'other' }]
		});
	};

	const removeLink = (index) => {
		setFormData({
			...formData,
			links: formData.links.filter((_, i) => i !== index)
		});
	};

	const updateLink = (index, field, value) => {
		const newLinks = [...formData.links];
		newLinks[index] = { ...newLinks[index], [field]: value };
		setFormData({ ...formData, links: newLinks });
	};

	const handleVideoUpload = async () => {
		if (!videoFile || !selectedCourseId) return;

		try {
			const formData = new FormData();
			formData.append('video', videoFile);
			formData.append('title', 'Uploaded Video');
			formData.append('description', 'Video uploaded from admin panel');

			await courseService.uploadVideo(selectedCourseId, formData, token);
			toast.success('Video uploaded successfully');
			setUploadVideoDialog(false);
			setVideoFile(null);
			setSelectedCourseId(null);
			fetchCourses();
		} catch (error) {
			toast.error(error.message);
		}
	};

	const handleThumbnailUpload = async () => {
		if (!thumbnailFile || !selectedCourseId) return;

		try {
			const formData = new FormData();
			formData.append('thumbnail', thumbnailFile);

			await courseService.uploadThumbnail(selectedCourseId, formData, token);
			toast.success('Thumbnail uploaded successfully');
			setUploadThumbnailDialog(false);
			setThumbnailFile(null);
			setSelectedCourseId(null);
			fetchCourses();
		} catch (error) {
			toast.error(error.message);
		}
	};

	return (
		<div className="min-h-[100vh]">
			{/* Delete Dialog */}
			<Dialog size="sm" className="p-4" open={deleteDialogOpen} handler={() => setDeleteDialogOpen(false)}>
				<DialogHeader>Are you sure?</DialogHeader>
				<DialogBody className="py-1">This action cannot be undone.</DialogBody>
				<DialogFooter className="space-x-2">
					<Button size="sm" variant="text" className="text-error cursor-pointer" onClick={() => setDeleteDialogOpen(false)}>
						Cancel
					</Button>
					<Button size="sm" className="bg-error flex-center cursor-pointer gap-2" onClick={handleDeleteCourse}>
						Delete
						<Trash2 strokeWidth={3} size="14" />
					</Button>
				</DialogFooter>
			</Dialog>

			{/* Create Course Dialog */}
			<Dialog open={isCreateDialogOpen} handler={() => setIsCreateDialogOpen(false)} size="xl">
				<DialogHeader>Create New Course</DialogHeader>
				<DialogBody className="max-h-[70vh] overflow-y-auto">
					<div className="space-y-4">
						<Input
							label="Title"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							placeholder="Course title"
						/>
						<Textarea
							label="Description"
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							placeholder="Course description"
							rows={3}
						/>
						<div className="grid grid-cols-2 gap-4">
							<Input
								label="Instructor"
								value={formData.instructor}
								onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
								placeholder="Instructor name"
							/>
							<Select
								value={formData.difficulty}
								setValue={(value) => setFormData({ ...formData, difficulty: value })}
								data={[
									{ value: 'beginner', label: 'Beginner' },
									{ value: 'intermediate', label: 'Intermediate' },
									{ value: 'advanced', label: 'Advanced' },
								]}
								label="Difficulty"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Input
								label="Duration"
								value={formData.duration}
								onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
								placeholder="e.g., 5 hours"
							/>
							<Input
								label="Thumbnail URL"
								value={formData.thumbnail}
								onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
								placeholder="Image URL"
							/>
						</div>
						<Input
							label="Tags (comma-separated)"
							value={formData.tags}
							onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
							placeholder="javascript, react, web development"
						/>

						{/* Videos Section */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="text-sm font-medium">Videos</label>
								<Button size="sm" onClick={addVideo} className="bg-primary">
									<Plus size="16" className="mr-1" />
									Add Video
								</Button>
							</div>
							{formData.videos.map((video, index) => (
								<div key={index} className="border rounded-lg p-4 mb-2">
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm font-medium">Video {index + 1}</span>
										<Button size="sm" color="red" variant="outlined" onClick={() => removeVideo(index)}>
											<Trash2 size="16" />
										</Button>
									</div>
									<div className="grid grid-cols-2 gap-2 mb-2">
										<Input
											label="Title"
											value={video.title}
											onChange={(e) => updateVideo(index, 'title', e.target.value)}
											placeholder="Video title"
										/>
										<Input
											label="Duration"
											value={video.duration}
											onChange={(e) => updateVideo(index, 'duration', e.target.value)}
											placeholder="e.g., 10:30"
										/>
									</div>
									<Input
										label="Video URL"
										value={video.url}
										onChange={(e) => updateVideo(index, 'url', e.target.value)}
										placeholder="YouTube, Vimeo, or direct video URL"
									/>
									<Textarea
										label="Description"
										value={video.description}
										onChange={(e) => updateVideo(index, 'description', e.target.value)}
										placeholder="Video description"
										rows={2}
									/>
								</div>
							))}
						</div>

						{/* Links Section */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="text-sm font-medium">Resources & Links</label>
								<Button size="sm" onClick={addLink} className="bg-primary">
									<LinkIcon size="16" className="mr-1" />
									Add Link
								</Button>
							</div>
							{formData.links.map((link, index) => (
								<div key={index} className="border rounded-lg p-4 mb-2">
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm font-medium">Link {index + 1}</span>
										<Button size="sm" color="red" variant="outlined" onClick={() => removeLink(index)}>
											<Trash2 size="16" />
										</Button>
									</div>
									<div className="grid grid-cols-2 gap-2 mb-2">
										<Input
											label="Title"
											value={link.title}
											onChange={(e) => updateLink(index, 'title', e.target.value)}
											placeholder="Link title"
										/>
										<Select
											value={link.type}
											setValue={(value) => updateLink(index, 'type', value)}
											data={[
												{ value: 'documentation', label: 'Documentation' },
												{ value: 'tutorial', label: 'Tutorial' },
												{ value: 'reference', label: 'Reference' },
												{ value: 'other', label: 'Other' },
											]}
											label="Type"
										/>
									</div>
									<Input
										label="URL"
										value={link.url}
										onChange={(e) => updateLink(index, 'url', e.target.value)}
										placeholder="https://example.com"
									/>
									<Textarea
										label="Description"
										value={link.description}
										onChange={(e) => updateLink(index, 'description', e.target.value)}
										placeholder="Link description"
										rows={2}
									/>
								</div>
							))}
						</div>

						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="isPublished"
								checked={formData.isPublished}
								onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
							/>
							<label htmlFor="isPublished" className="text-sm text-gray-700">Publish immediately</label>
						</div>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="text" onClick={() => setIsCreateDialogOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleCreateCourse}>
						Create Course
					</Button>
				</DialogFooter>
			</Dialog>

			{/* Upload Video Dialog */}
			<Dialog open={uploadVideoDialog} handler={() => setUploadVideoDialog(false)} size="sm">
				<DialogHeader>Upload Video</DialogHeader>
				<DialogBody>
					<div className="space-y-4">
						<input
							type="file"
							accept="video/*"
							onChange={(e) => setVideoFile(e.target.files[0])}
							className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
						/>
						{videoFile && (
							<p className="text-sm text-gray-600">Selected: {videoFile.name}</p>
						)}
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="text" onClick={() => setUploadVideoDialog(false)}>
						Cancel
					</Button>
					<Button onClick={handleVideoUpload} disabled={!videoFile}>
						Upload Video
					</Button>
				</DialogFooter>
			</Dialog>

			{/* Upload Thumbnail Dialog */}
			<Dialog open={uploadThumbnailDialog} handler={() => setUploadThumbnailDialog(false)} size="sm">
				<DialogHeader>Upload Thumbnail</DialogHeader>
				<DialogBody>
					<div className="space-y-4">
						<input
							type="file"
							accept="image/*"
							onChange={(e) => setThumbnailFile(e.target.files[0])}
							className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
						/>
						{thumbnailFile && (
							<p className="text-sm text-gray-600">Selected: {thumbnailFile.name}</p>
						)}
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="text" onClick={() => setUploadThumbnailDialog(false)}>
						Cancel
					</Button>
					<Button onClick={handleThumbnailUpload} disabled={!thumbnailFile}>
						Upload Thumbnail
					</Button>
				</DialogFooter>
			</Dialog>

			{/* Edit Course Dialog */}
			<Dialog open={isEditDialogOpen} handler={() => setIsEditDialogOpen(false)} size="xl">
				<DialogHeader>Edit Course</DialogHeader>
				<DialogBody className="max-h-[70vh] overflow-y-auto">
					<div className="space-y-4">
						<Input
							label="Title"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							placeholder="Course title"
						/>
						<Textarea
							label="Description"
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							placeholder="Course description"
							rows={3}
						/>
						<div className="grid grid-cols-2 gap-4">
							<Input
								label="Instructor"
								value={formData.instructor}
								onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
								placeholder="Instructor name"
							/>
							<Select
								value={formData.difficulty}
								setValue={(value) => setFormData({ ...formData, difficulty: value })}
								data={[
									{ value: 'beginner', label: 'Beginner' },
									{ value: 'intermediate', label: 'Intermediate' },
									{ value: 'advanced', label: 'Advanced' },
								]}
								label="Difficulty"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Input
								label="Duration"
								value={formData.duration}
								onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
								placeholder="e.g., 5 hours"
							/>
							<Input
								label="Thumbnail URL"
								value={formData.thumbnail}
								onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
								placeholder="Image URL"
							/>
						</div>
						<Input
							label="Tags (comma-separated)"
							value={formData.tags}
							onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
							placeholder="javascript, react, web development"
						/>

						{/* Videos Section */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="text-sm font-medium">Videos</label>
								<Button size="sm" onClick={addVideo} className="bg-primary">
									<Plus size="16" className="mr-1" />
									Add Video
								</Button>
							</div>
							{formData.videos.map((video, index) => (
								<div key={index} className="border rounded-lg p-4 mb-2">
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm font-medium">Video {index + 1}</span>
										<Button size="sm" color="red" variant="outlined" onClick={() => removeVideo(index)}>
											<Trash2 size="16" />
										</Button>
									</div>
									<div className="grid grid-cols-2 gap-2 mb-2">
										<Input
											label="Title"
											value={video.title}
											onChange={(e) => updateVideo(index, 'title', e.target.value)}
											placeholder="Video title"
										/>
										<Input
											label="Duration"
											value={video.duration}
											onChange={(e) => updateVideo(index, 'duration', e.target.value)}
											placeholder="e.g., 10:30"
										/>
									</div>
									<Input
										label="Video URL"
										value={video.url}
										onChange={(e) => updateVideo(index, 'url', e.target.value)}
										placeholder="YouTube, Vimeo, or direct video URL"
									/>
									<Textarea
										label="Description"
										value={video.description}
										onChange={(e) => updateVideo(index, 'description', e.target.value)}
										placeholder="Video description"
										rows={2}
									/>
								</div>
							))}
						</div>

						{/* Links Section */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="text-sm font-medium">Resources & Links</label>
								<Button size="sm" onClick={addLink} className="bg-primary">
									<LinkIcon size="16" className="mr-1" />
									Add Link
								</Button>
							</div>
							{formData.links.map((link, index) => (
								<div key={index} className="border rounded-lg p-4 mb-2">
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm font-medium">Link {index + 1}</span>
										<Button size="sm" color="red" variant="outlined" onClick={() => removeLink(index)}>
											<Trash2 size="16" />
										</Button>
									</div>
									<div className="grid grid-cols-2 gap-2 mb-2">
										<Input
											label="Title"
											value={link.title}
											onChange={(e) => updateLink(index, 'title', e.target.value)}
											placeholder="Link title"
										/>
										<Select
											value={link.type}
											setValue={(value) => updateLink(index, 'type', value)}
											data={[
												{ value: 'documentation', label: 'Documentation' },
												{ value: 'tutorial', label: 'Tutorial' },
												{ value: 'reference', label: 'Reference' },
												{ value: 'other', label: 'Other' },
											]}
											label="Type"
										/>
									</div>
									<Input
										label="URL"
										value={link.url}
										onChange={(e) => updateLink(index, 'url', e.target.value)}
										placeholder="https://example.com"
									/>
									<Textarea
										label="Description"
										value={link.description}
										onChange={(e) => updateLink(index, 'description', e.target.value)}
										placeholder="Link description"
										rows={2}
									/>
								</div>
							))}
						</div>

						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="edit-isPublished"
								checked={formData.isPublished}
								onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
							/>
							<label htmlFor="edit-isPublished" className="text-sm text-gray-700">Published</label>
						</div>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="text" onClick={() => setIsEditDialogOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleEditCourse}>
						Update Course
					</Button>
				</DialogFooter>
			</Dialog>

			{/* Filters and Search */}
			<div className="mb-4 flex flex-wrap gap-2">
				<Select
					value={difficultyFilter}
					setValue={setDifficultyFilter}
					data={[
						{ value: 'all', label: 'All Levels' },
						{ value: 'beginner', label: <div className="text-success">Beginner</div> },
						{ value: 'intermediate', label: <div className="text-warning">Intermediate</div> },
						{ value: 'advanced', label: <div className="text-error">Advanced</div> },
					]}
					label="Difficulty"
				/>
				<Select
					value={isPublishedFilter}
					setValue={setIsPublishedFilter}
					data={[
						{ value: 'all', label: 'All Status' },
						{ value: 'true', label: <div className="text-success">Published</div> },
						{ value: 'false', label: <div className="text-warning">Draft</div> },
					]}
					label="Status"
				/>
				<div className="relative max-w-sm">
					<FullOutlineInput className="pr-10 placeholder:capitalize" placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
					<Search className="text-base-content/70 absolute right-3 top-3" size="16" />
				</div>
				<Button
					className="bg-primary flex !h-10 cursor-pointer items-center gap-1 capitalize ml-auto"
					onClick={() => {
						resetForm();
						setIsCreateDialogOpen(true);
					}}
				>
					<Plus size="18" />
					Create Course
				</Button>
			</div>

			{/* Table */}
			<div className="shadow-clg shadow-shadow-color/5 w-full overflow-auto rounded-xl">
				<table className="w-full min-w-max table-auto text-left">
					<thead>
						<tr>
							{['Thumbnail', 'Title', 'Instructor', 'Difficulty', 'Duration', 'Rating', 'Status', 'Actions'].map((item, index) => (
								<th key={index} className="border-base-content/30 bg-blue-gray-50 dark:bg-base-300 border-b p-4 text-sm capitalize dark:text-white">
									{item}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<TableSkeleton perPage={perPage} />
						) : (
							courses?.map((item, index) => (
								<TableRow
									item={item}
									key={index}
									setSelectId={setSelectId}
									setOpenDeleteDialog={setDeleteDialogOpen}
									handleEditClick={handleEditClick}
									setUploadVideoDialog={setUploadVideoDialog}
									setUploadThumbnailDialog={setUploadThumbnailDialog}
									setSelectedCourseId={setSelectedCourseId}
								/>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="mt-4 flex flex-wrap gap-2">
				<Select
					prefix="Per page"
					value={perPage}
					clearable={false}
					setValue={setPerPage}
					className="mr-auto"
					data={[...Array(4)].map((_, i) => (i + 1) * 25).map((i) => ({ value: i, label: i }))}
				/>
				<Pagination maxPage={totalPages} page={currentPage} setPage={setCurrentPage} />
			</div>
		</div>
	);
};

export default Courses;