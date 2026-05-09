import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Sun, MoonStar } from 'lucide-react';
import { Button } from '~/components/ui/button';

import routesConfig from '~/config/routes';
import useAuthStore from '~/stores/authStore';
import useThemeStore from '~/stores/themeStore';
import AvatarWithMenu from '~/components/AvatarWithMenu';
import Logo from '~/assets/images/logo.png';
import MobileBottomNav from '~/components/MobileBottomNav';

const DefaultLayout = ({ children, footer }) => {
	const { t } = useTranslation();
	const location = useLocation();
	const { isAuth, user } = useAuthStore();
	const { theme, setMode } = useThemeStore();

	const isActive = (path) => {
		const [pathname, search] = path.split('?');
		if (search) {
			return location.pathname === pathname && location.search.includes(search);
		}
		return location.pathname === pathname && !location.search;
	};

	return (
		<div className="h-full w-full overflow-auto bg-gray-100 dark:bg-neutral-900">
			<header className="flex h-16 items-center space-x-4 bg-white px-4 md:px-16 shadow dark:bg-neutral-800 sticky top-0 z-[50]">
				<Link to={routesConfig.home} className="flex-shrink-0">
					<img src={Logo} className="size-8" alt="" />
				</Link>

				<nav className="hidden lg:flex items-center space-x-1">
					{[
						{
							title: t('home'),
							path: routesConfig.home,
						},
						{
							title: 'Roadmap',
							path: `${routesConfig.home}?tab=roadmap`,
						},
						{
							title: 'Blogs',
							path: `${routesConfig.home}?tab=blogs`,
						},
						{
							title: 'AI Lab',
							path: `${routesConfig.home}?tab=ailab`,
						},
						{
							title: t('problem'),
							path: routesConfig.problems,
						},
						{
							title: 'Courses',
							path: routesConfig.courses,
						},
						{
							title: t('submission'),
							path: routesConfig.submissions,
						},
						{
							title: t('contest'),
							path: routesConfig.contests,
						},
						{
							title: 'Interview',
							path: routesConfig.interviewDashboard,
						},
					].map((item, index) => (
						<Button key={index} variant="ghost" asChild>
							<Link
								className={`text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 ${isActive(item.path) ? 'bg-zinc-200 text-gray-800 dark:!bg-zinc-900' : 'dark:hover:!bg-zinc-700'}`}
								to={item.path}
							>
								{item.title}
							</Link>
						</Button>
					))}
				</nav>

				{isAuth ? (
					<div className="flex items-center gap-2 !ml-auto">
						<Button variant="ghost" className="text-gray-70 group h-8 px-2 dark:text-gray-300 dark:hover:!bg-zinc-700">
							<FontAwesomeIcon icon="fa-regular fa-star" className="group-hover:text-secondary" />
							{user?.totalScore}
						</Button>
						<AvatarWithMenu></AvatarWithMenu>
					</div>
				) : (
					<div className="flex items-center gap-2 !ml-auto">
						<Button className="h-8 !bg-sky-500 dark:!bg-sky-500/20">
							<Link to={routesConfig.login} className="text-xs font-medium text-white dark:text-sky-400">
								{t('login')}
							</Link>
						</Button>
						<button
							className={`flex size-8 items-center justify-center rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-neutral-900 dark:hover:bg-gray-700`}
							onClick={() => setMode(theme == 'dark' ? 'light' : 'dark')}
						>
							{theme == 'dark' ? (
								<MoonStar className="text-slate-300" size="18px"></MoonStar>
							) : (
								<Sun className="text-gray-700" size="18px"></Sun>
							)}
						</button>
					</div>
				)}
			</header>
			
			<main className="flex min-h-[calc(100%-64px)] flex-col pb-16 lg:pb-0">
				{children}
			</main>

			<MobileBottomNav />
			{footer}
		</div>
	);
};

DefaultLayout.propTypes = {
	children: PropTypes.node,
	footer: PropTypes.node,
};

export default DefaultLayout;
