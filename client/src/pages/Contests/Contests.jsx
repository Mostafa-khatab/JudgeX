import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Calendar, Clock, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '~/components/ui/button';

import { getContests } from '~/services/contest';
import Select from '~/components/Select';
import Search from '~/components/Search';
import useAuthStore from '~/stores/authStore';
import Pagination from '~/components/Pagination';
import contestImg from '~/assets/images/1stcontest.png';
import routesConfig from '~/config/routes';
import useDebounce from '~/hooks/useDebounce';

const Contests = () => {
	const { t } = useTranslation('contests');
	const { user } = useAuthStore();

	const [contests, setContests] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [maxPage, setMaxPage] = useState(0);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState();
	const searchValue = useDebounce(search, 400);

	const formatDuration = (ms) => {
		const MS_IN_SECOND = 1000;
		const MS_IN_MINUTE = MS_IN_SECOND * 60;
		const MS_IN_HOUR = MS_IN_MINUTE * 60;
		const MS_IN_DAY = MS_IN_HOUR * 24;
		const MS_IN_MONTH = MS_IN_DAY * 30.44; // trung bình
		const MS_IN_YEAR = MS_IN_DAY * 365.25;

		if (ms >= MS_IN_YEAR) {
			const years = Math.floor(ms / MS_IN_YEAR);
			return `${years} year${years > 1 ? 's' : ''}`;
		}
		if (ms >= MS_IN_MONTH) {
			const months = Math.floor(ms / MS_IN_MONTH);
			return `${months} month${months > 1 ? 's' : ''}`;
		}
		if (ms >= MS_IN_DAY) {
			const days = Math.floor(ms / MS_IN_DAY);
			return `${days} day${days > 1 ? 's' : ''}`;
		}
		if (ms >= MS_IN_HOUR) {
			const hours = Math.floor(ms / MS_IN_HOUR);
			return `${hours} hour${hours > 1 ? 's' : ''}`;
		}
		if (ms >= MS_IN_MINUTE) {
			const minutes = Math.floor(ms / MS_IN_MINUTE);
			return `${minutes} minute${minutes > 1 ? 's' : ''}`;
		}
		const seconds = Math.floor(ms / MS_IN_SECOND);
		return `${seconds} second${seconds > 1 ? 's' : ''}`;
	};

	const query = () => {
		setLoading(true);
		getContests({
			page: currentPage,
			size: 50,
			status,
			q: searchValue,
		})
			.then((res) => {
				setContests(
					res.data.sort((a, b) => {
						const astatus = user?.joiningContest === a.id && a.status == 'ongoing' ? 'joined' : a.status;
						const bstatus = user?.joiningContest === b.id && b.status == 'ongoing' ? 'joined' : b.status;
						const priority = {
							joined: 4,
							ongoing: 3,
							upcoming: 2,
							ended: 1,
						};
						if (astatus == bstatus) {
							return b.startTime - a.startTime;
						}
						return priority[bstatus] - priority[astatus];
					}),
				);
				setMaxPage(res.maxPage);
			})
			.catch((err) => {
				toast.error(err.response.data.msg);
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		query();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, status, searchValue]);

	return (
		<div className="flex-1 space-y-6 px-4 md:px-14 pt-6 md:pt-8 pb-20 max-w-7xl mx-auto">
			<div className="flex flex-col md:flex-row w-full justify-between items-start md:items-center gap-6">
				<div className="space-y-1">
					<h2 className="text-xl md:text-2xl font-black tracking-tight dark:text-white uppercase tracking-[0.2em]">{t('all-contests')}</h2>
					<p className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-widest">{contests.length} {t('contests-found')}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
					<Select
						setValue={setStatus}
						data={[
							{ label: <span className="capitalize">{t('status')}</span> },
							{ value: 'ended', label: <span className="capitalize text-red-500">{t('ended')}</span> },
							{ value: 'ongoing', label: <span className="capitalize text-green-500">{t('ongoing')}</span> },
							{ value: 'upcoming', label: <span className="capitalize text-yellow-400">{t('upcoming')}</span> },
						]}
					></Select>
					<div className="flex-1 min-w-[140px] md:w-64">
						<Search placeholder={t('search-placeholder')} value={search} setValue={setSearch}></Search>
					</div>
					<Button onClick={query} className="h-10 w-10 sm:w-auto !bg-sky-400 font-bold capitalize !text-white hover:!bg-sky-500 shrink-0">
						<RotateCcw className="size-4"></RotateCcw>
						<span className="hidden sm:inline">{t('refresh')}</span>
					</Button>
				</div>
			</div>
			<div className="w-full space-y-4">
				{loading ? (
					<div className="my-44 w-full text-center dark:text-white flex flex-col items-center gap-2">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
						{t('loading')}...
					</div>
				) : (
					contests.map((item, index) => {
						const itemstatus = user?.joiningContest === item.id && item.status == 'ongoing' ? 'joined' : item.status;
						const startTime = new Date(item.startTime);
						return (
							<div className="flex flex-col md:flex-row md:items-center w-full rounded-2xl bg-white p-4 md:px-8 md:py-5 shadow-sm border border-gray-100 dark:border-neutral-700/50 dark:bg-neutral-800 transition-all hover:border-sky-500/30 group gap-4" key={index}>
								<div className="flex items-center flex-1">
									<div className="relative shrink-0">
										<img className="size-12 md:size-14 rounded-xl object-cover" src={contestImg} alt="" />
										<div className="absolute -top-1 -right-1 size-4 bg-sky-500 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center text-[8px] text-white font-bold">
											{index + 1}
										</div>
									</div>
									<div className="ml-4 space-y-1 min-w-0 flex-1">
										<Link 
											className="text-base md:text-xl font-bold hover:!text-sky-400 group-hover:text-sky-400 transition-colors dark:text-white block truncate" 
											to={routesConfig.contest.replace(':id', item.id)}
										>
											{item.title}
										</Link>
										<div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium">
											<span className="flex items-center gap-1.5">
												<Calendar className="size-3 md:size-3.5 text-sky-500"></Calendar>
												{`${startTime.getFullYear()}-${startTime.getMonth() + 1}-${startTime.getDate()} ${startTime.getHours()}:00`}
											</span>
											<span className="flex items-center gap-1.5">
												<Clock className="size-3 md:size-3.5 text-sky-500"></Clock>
												{formatDuration(new Date(item.duration))}
											</span>
										</div>
									</div>
								</div>
								<div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-neutral-700/50">
									<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
										<div
											data-status={itemstatus}
											className="size-2 rounded-full shadow-sm data-[status=ended]:bg-red-500 data-[status=joined]:bg-purple-600 data-[status=ongoing]:bg-green-500 data-[status=upcoming]:bg-yellow-400 animate-pulse"
										></div>
										<span className="text-[9px] font-black uppercase tracking-widest dark:text-white">{itemstatus}</span>
									</div>
									<ChevronRight className="text-gray-300 group-hover:text-sky-500 transition-all group-hover:translate-x-1" size={18} />
								</div>
							</div>
						);
					})
				)}
			</div>
			{!loading && <div className="py-4"><Pagination maxPage={maxPage} currentPage={currentPage} setPage={setCurrentPage}></Pagination></div>}
		</div>
	);
};

export default Contests;
