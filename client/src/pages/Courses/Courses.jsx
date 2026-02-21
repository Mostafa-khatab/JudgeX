import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, ExternalLink, Clock, Star, Users, Search as SearchIcon, RotateCcw, Shuffle } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { useSearchParams } from 'react-router';

import courseService from '~/services/courseService';
import routesConfig from '~/config/routes';
import Pagination from '~/components/Pagination';
import useAuthStore from '~/stores/authStore';
import useDebounce from '~/hooks/useDebounce';
import Select from '~/components/Select';
import SearchComponent from '~/components/Search';

const Courses = () => {
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const [searchParams] = useSearchParams();

	const [courses, setCourses] = useState([]);
	const [recommendations, setRecommendations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [difficultyFilter, setDifficultyFilter] = useState('all');
	const [tagFilter, setTagFilter] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [sortBy, setSortBy] = useState('');
	const [sortOrder, setSortOrder] = useState(1);

	const searchValue = useDebounce(searchQuery, 400);

	const difficultyOptions = [
		{ value: 'all', label: 'All Levels' },
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
	];

	const sortHandle = (sortType) => {
		setSortBy(sortType);
		setSortOrder((prev) => (prev == -1 ? 1 : -1));
	};

	const fetchCourses = async () => {
		try {
			setLoading(true);
			const params = {
				q: searchValue,
				difficulty: difficultyFilter === 'all' ? '' : difficultyFilter,
				tags: tagFilter,
				page: currentPage,
				size: 50,
				isPublished: 'true',
				sortBy,
				order: sortOrder,
			};

			const [coursesRes, recommendationsRes] = await Promise.all([
				courseService.getCourses(params),
				user ? courseService.getRecommendations() : { data: [] }
			]);

			setCourses(coursesRes.data);
			setTotalPages(coursesRes.maxPage);
			setRecommendations(recommendationsRes.data || []);
		} catch (error) {
			console.error('Error fetching courses:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCourses();
	}, [searchValue, difficultyFilter, tagFilter, currentPage, sortBy, sortOrder]);

	// Handle pagination validation
	useEffect(() => {
		if (totalPages > 0 && currentPage > totalPages) {
			setCurrentPage(totalPages);
		} else if (currentPage < 1) {
			setCurrentPage(1);
		}
	}, [totalPages, currentPage]);

	const handleSearch = (e) => {
		setSearchQuery(e.target.value);
		setCurrentPage(1);
	};

	const handleDifficultyChange = (value) => {
		setDifficultyFilter(value);
		setCurrentPage(1);
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
				return 'text-green-500';
			case 'intermediate':
				return 'text-yellow-600';
			case 'advanced':
				return 'text-red-500';
			default:
				return 'text-gray-500';
		}
	};

	return (
		<div className="mx-auto mt-8 h-[calc(100%-64px)] w-[90%] max-w-[1184px]">
			<div className="mb-1 flex h-12 w-full gap-3">
				<Select
					setValue={setDifficultyFilter}
					data={[
						{
							label: <span className="capitalize text-gray-700 dark:text-gray-300">Difficulty</span>,
						},
						{
							value: 'all',
							label: <span className="capitalize text-gray-700 dark:text-gray-300">All Levels</span>,
						},
						{
							value: 'beginner',
							label: <span className="capitalize text-green-500">Beginner</span>,
						},
						{
							value: 'intermediate',
							label: <span className="capitalize text-yellow-600">Intermediate</span>,
						},
						{
							value: 'advanced',
							label: <span className="capitalize text-red-500">Advanced</span>,
						},
					]}
				/>
				<SearchComponent value={searchQuery} setValue={setSearchQuery} placeholder="Search courses..." />
				<Tooltip>
					<TooltipTrigger asChild>
						<Button onClick={fetchCourses} className="ml-auto size-9 rounded-full !bg-sky-500 p-[10px] !text-white" size="icon">
							<RotateCcw className="size-4" />
						</Button>
					</TooltipTrigger>
				</Tooltip>
			</div>

			{/* AI Recommendations Section */}
			{user && recommendations.length > 0 && (
				<div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
					<div className="flex items-center gap-2 mb-5">
						<div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
							<Shuffle className="w-5 h-5" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-800 dark:text-white">Recommended for You</h2>
							<p className="text-xs text-gray-500">Based on your recent Skill Gap Analysis</p>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{recommendations.map((course) => (
							<Link key={course._id} to={routesConfig.course.replace(':id', course._id)}>
								<Card className="hover:shadow-xl transition-all border-none bg-white dark:bg-neutral-800 relative overflow-hidden group h-full">
									<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
									<CardContent className="p-4">
										<div className="aspect-video mb-4 rounded-xl overflow-hidden relative">
											{course.thumbnail ? (
												<img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
											) : (
												<div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
													<Play className="size-10 text-white opacity-80" />
												</div>
											)}
											<div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
												<Play className="size-12 text-white fill-white" />
											</div>
										</div>
										<h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1" title={course.title}>{course.title}</h3>
										<div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
											<span className={`text-[10px] uppercase font-bold tracking-wider ${getDifficultyColor(course.difficulty)}`}>{course.difficulty}</span>
											<div className="flex items-center text-xs text-yellow-500 font-medium">
												<Star className="size-3 fill-yellow-500 mr-1" />
												{course.rating > 0 ? course.rating.toFixed(1) : 'New'}
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			)}

			<div className="relative block overflow-x-auto shadow-md sm:rounded-lg">
				<table className="w-full text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
					<thead className="bg-white text-xs uppercase text-gray-700 dark:bg-neutral-800 dark:text-gray-400">
						<tr>
							<th scope="col" className="px-6 py-3">
								Thumbnail
							</th>
							<th scope="col" className="truncate px-6 py-3">
								Title
								<button className="ml-1" onClick={() => sortHandle('title')}>
									<FontAwesomeIcon icon="fa-solid fa-sort" />
								</button>
							</th>
							<th scope="col" className="px-6 py-3">
								Instructor
							</th>
							<th scope="col" className="px-6 py-3">
								Difficulty
								<button className="ml-1" onClick={() => sortHandle('difficulty')}>
									<FontAwesomeIcon icon="fa-solid fa-sort" />
								</button>
							</th>
							<th scope="col" className="px-6 py-3">
								Duration
							</th>
							<th scope="col" className="px-6 py-3">
								Rating
								<button className="ml-1" onClick={() => sortHandle('rating')}>
									<FontAwesomeIcon icon="fa-solid fa-sort" />
								</button>
							</th>
							<th scope="col" className="px-6 py-3">
								Videos
							</th>
							<th scope="col" className="px-6 py-3">
								Enrolled
								<button className="ml-1" onClick={() => sortHandle('enrolledUsers')}>
									<FontAwesomeIcon icon="fa-solid fa-sort" />
								</button>
							</th>
							<th scope="col" className="px-6 py-3">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{!loading &&
							courses.map((course, index) => (
								<tr
									key={index}
									className="h-14 border-b border-gray-200 odd:bg-gray-100 even:bg-white dark:border-gray-700 odd:dark:bg-neutral-900 even:dark:bg-neutral-800"
								>
									<td className="px-6 py-4">
										{course.thumbnail ? (
											<img
												src={course.thumbnail}
												alt={course.title}
												className="w-12 h-12 object-cover rounded"
												onError={(e) => {
													e.currentTarget.onerror = null;
													e.currentTarget.src = 'https://via.placeholder.com/96?text=No+Image';
												}}
											/>
										) : (
											<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
												<Play className="w-6 h-6 text-white" />
											</div>
										)}
									</td>
									<td
										scope="row"
										className="truncate whitespace-nowrap px-6 py-4 font-medium text-gray-900 hover:text-blue-400 dark:text-white dark:hover:text-blue-400"
									>
										<Link to={routesConfig.course.replace(':id', course._id)}>{course.title}</Link>
									</td>
									<td className="px-6 py-4">
										<div className="flex items-center">
											<Users className="w-4 h-4 mr-2 text-gray-500" />
											<span>{course.instructor}</span>
										</div>
									</td>
									<td
										className={`px-6 py-4 capitalize ${getDifficultyColor(course.difficulty)}`}
									>
										{course.difficulty}
									</td>
									<td className="px-6 py-4">
										{course.duration ? (
											<div className="flex items-center">
												<Clock className="w-4 h-4 mr-2 text-gray-500" />
												<span>{course.duration}</span>
											</div>
										) : (
											'-'
										)}
									</td>
									<td className="px-6 py-4">
										{course.rating > 0 ? (
											<div className="flex items-center">
												<div className="flex items-center mr-2">
													{renderStars(course.rating)}
												</div>
												<span className="text-sm text-gray-600">
													{course.rating.toFixed(1)} ({course.ratingCount})
												</span>
											</div>
										) : (
											'-'
										)}
									</td>
									<td className="px-6 py-4">{course.videos?.length || 0}</td>
									<td className="px-6 py-4">{course.enrolledUsers?.length || 0}</td>
									<td className="px-6 py-4">
										<div className="flex gap-2">
											<Link to={routesConfig.course.replace(':id', course._id)}>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button size="sm" variant="outline">
															<Play className="w-4 h-4 mr-1" />
															View
														</Button>
													</TooltipTrigger>
													<TooltipContent>View Course</TooltipContent>
												</Tooltip>
											</Link>
											{course.links && course.links.length > 0 && (
												<Tooltip>
													<TooltipTrigger asChild>
														<Button size="sm" variant="outline" asChild>
															<a href={course.links[0]?.url} target="_blank" rel="noopener noreferrer" aria-label="Open first resource" title="Open resource">
																<ExternalLink className="w-4 h-4" />
															</a>
														</Button>
													</TooltipTrigger>
													<TooltipContent>Resources</TooltipContent>
												</Tooltip>
											)}
										</div>
									</td>
								</tr>
							))}
					</tbody>
				</table>
				{loading && <div className="mt-32 h-[100vh] flex-1 text-center dark:text-white">Loading...</div>}
			</div>
			<Pagination maxPage={totalPages} currentPage={currentPage} setPage={setCurrentPage} className="my-8" />
		</div>
	);
};

export default Courses;