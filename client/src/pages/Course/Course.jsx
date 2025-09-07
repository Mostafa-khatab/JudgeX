import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Play, ExternalLink, Clock, Star, Users, ArrowLeft, BookOpen, Link as LinkIcon } from 'lucide-react';
import courseService from '~/services/courseService';
import { toast } from 'react-toastify';
import useAuthStore from '~/stores/authStore';

const Course = () => {
	const { id } = useParams();
	const [course, setCourse] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedVideo, setSelectedVideo] = useState(0);
	const { user } = useAuthStore();

	const toEmbedUrl = (url) => {
		if (!url) return '';
		try {
			let u = url.trim();
			// YouTube
			if (u.includes('youtube.com/watch')) {
				return u.replace('watch?v=', 'embed/');
			}
			if (u.includes('youtu.be/')) {
				return u.replace('youtu.be/', 'www.youtube.com/embed/');
			}
			// Vimeo
			if (u.includes('vimeo.com/')) {
				return u.replace('vimeo.com/', 'player.vimeo.com/video/');
			}
			// Direct mp4 or others (serve via native video tag if needed)
			return '';
		} catch {
			return '';
		}
	};

	const fetchCourse = async () => {
		try {
			setLoading(true);
			const response = await courseService.getCourse(id);
			setCourse(response.data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCourse();
	}, [id]);

	const handleEnroll = async () => {
		if (!user?.name) {
			toast.error('Please login to enroll in this course');
			return;
		}

		try {
			await courseService.enrollInCourse(id, user?.name);
			toast.success('Successfully enrolled in course!');
			fetchCourse(); // Refresh course data
		} catch (error) {
			toast.error(error.message);
		}
	};

	const handleRate = async (rating) => {
		if (!user?.name) {
			toast.error('Please login to rate this course');
			return;
		}

		try {
			await courseService.rateCourse(id, rating);
			toast.success('Thank you for rating this course!');
			fetchCourse(); // Refresh course data
		} catch (error) {
			toast.error(error.message);
		}
	};

	const renderStars = (rating) => {
		const stars = [];
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 !== 0;

		for (let i = 0; i < fullStars; i++) {
			stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
		}

		if (hasHalfStar) {
			stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
		}

		const emptyStars = 5 - Math.ceil(rating);
		for (let i = 0; i < emptyStars; i++) {
			stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
		}

		return stars;
	};

	const getDifficultyColor = (difficulty) => {
		switch (difficulty) {
			case 'beginner':
				return 'bg-green-100 text-green-800';
			case 'intermediate':
				return 'bg-yellow-100 text-yellow-800';
			case 'advanced':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const isEnrolled = course?.enrolledUsers?.includes(user?.name);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!course) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
					<Link to="/courses">
						<Button>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Courses
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto mt-8 h-[calc(100%-64px)] w-[90%] max-w-[1184px]">
				{/* Back Button */}
				<div className="mb-6">
					<Link to="/courses">
						<Button variant="outline" className="text-gray-800 dark:text-gray-100">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Courses
						</Button>
					</Link>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Course Header */}
						<Card>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
										<CardDescription className="text-lg mb-4">{course.description}</CardDescription>
										<div className="flex items-center gap-4 mb-4">
											<Badge className={getDifficultyColor(course.difficulty)}>
												{course.difficulty}
											</Badge>
											<div className="flex items-center text-gray-600">
												<Users className="w-4 h-4 mr-1" />
												<span>{course.instructor}</span>
											</div>
											{course.duration && (
												<div className="flex items-center text-gray-600">
													<Clock className="w-4 h-4 mr-1" />
													<span>{course.duration}</span>
												</div>
											)}
										</div>
									</div>
									{course.thumbnail && (
										<img
											src={course.thumbnail}
											alt={course.title}
											className="w-32 h-32 object-cover rounded-lg"
											onError={(e) => {
												e.currentTarget.onerror = null;
												e.currentTarget.src = 'https://via.placeholder.com/128?text=No+Image';
											}}
										/>
									)}
								</div>
							</CardHeader>
						</Card>

						{/* Videos Section */}
						{course.videos && course.videos.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<Play className="w-5 h-5 mr-2" />
										Course Videos
									</CardTitle>
								</CardHeader>
								<CardContent>
									{/* Video Player Area */}
									<div className="mb-6">
										<div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4 overflow-hidden">
											{course.videos[selectedVideo] ? (
												<iframe
													key={selectedVideo}
													title={course.videos[selectedVideo].title}
													src={toEmbedUrl(course.videos[selectedVideo].url) || ''}
													className="w-full h-full"
													allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
													allowFullScreen
												/>
											) : (
												<div className="text-center text-white">
													<Play className="w-16 h-16 mx-auto mb-4" />
													<p className="text-lg font-semibold">Select a video to play</p>
												</div>
											)}
										</div>
									</div>

									{/* Video List */}
									<div className="space-y-2">
										{course.videos.map((video, index) => (
											<div
												key={index}
												className={`p-3 rounded-lg border cursor-pointer transition-colors ${
													selectedVideo === index
														? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
														: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-500'
												}`}
												onClick={() => setSelectedVideo(index)}
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center">
														<Play className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
														<div>
															<p className="font-medium text-gray-900 dark:text-gray-100">{video.title}</p>
															{video.description && (
																<p className="text-sm text-gray-600 dark:text-gray-300">{video.description}</p>
															)}
														</div>
													</div>
													{video.duration && (
														<span className="text-sm text-gray-500 dark:text-gray-400">{video.duration}</span>
													)}
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Links Section */}
						{course.links && course.links.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<LinkIcon className="w-5 h-5 mr-2" />
										Resources & Links
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{course.links.map((link, index) => (
											<a
												key={index}
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all border-gray-200 dark:border-gray-700 dark:hover:border-gray-500"
											>
												<div className="flex items-start">
													<ExternalLink className="w-5 h-5 mr-3 text-blue-500 mt-0.5" />
													<div className="flex-1">
														<h4 className="font-medium text-gray-900 dark:text-gray-100">{link.title}</h4>
														{link.description && (
															<p className="text-sm text-gray-600 mt-1">{link.description}</p>
														)}
														<Badge variant="secondary" className="mt-2">
															{link.type}
														</Badge>
													</div>
												</div>
											</a>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Course Info */}
						<Card>
							<CardHeader>
								<CardTitle>Course Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Rating */}
								{course.rating > 0 && (
									<div>
										<div className="flex items-center mb-2">
											<div className="flex items-center mr-2">
												{renderStars(course.rating)}
											</div>
											<span className="text-sm text-gray-600">
												{course.rating.toFixed(1)} ({course.ratingCount} reviews)
											</span>
										</div>
									</div>
								)}

								{/* Stats */}
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="text-gray-600">Videos:</span>
										<span className="font-medium">{course.videos?.length || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Resources:</span>
										<span className="font-medium">{course.links?.length || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Enrolled:</span>
										<span className="font-medium">{course.enrolledUsers?.length || 0}</span>
									</div>
								</div>

								{/* Tags */}
								{course.tags && course.tags.length > 0 && (
									<div>
										<h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
										<div className="flex flex-wrap gap-1">
											{course.tags.map((tag, index) => (
												<Badge key={index} variant="secondary" className="text-xs">
													{tag}
												</Badge>
											))}
										</div>
									</div>
								)}

								{/* Enroll Button */}
								<Button
									className="w-full"
									onClick={handleEnroll}
									disabled={isEnrolled}
								>
									{isEnrolled ? (
										<>
											<BookOpen className="w-4 h-4 mr-2" />
											Enrolled
										</>
									) : (
										<>
											<BookOpen className="w-4 h-4 mr-2" />
											Enroll Now
										</>
									)}
								</Button>
							</CardContent>
						</Card>

						{/* Rate Course */}
						{user?.name && (
							<Card>
								<CardHeader>
									<CardTitle>Rate this Course</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex justify-center space-x-1">
										{[1, 2, 3, 4, 5].map((rating) => (
											<button
												key={rating}
												onClick={() => handleRate(rating)}
												className="text-2xl hover:text-yellow-400 transition-colors"
											>
												<Star className="w-8 h-8" />
											</button>
										))}
									</div>
									<p className="text-center text-sm text-gray-600 mt-2">
										Click a star to rate
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
		</div>
	);
};

export default Course;
