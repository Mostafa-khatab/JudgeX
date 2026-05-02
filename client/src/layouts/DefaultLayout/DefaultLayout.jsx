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

const DefaultLayout = ({ children, footer }) => {
	const { t } = useTranslation();
	const location = useLocation();
	const { isAuth, user } = useAuthStore();
	const { theme, setMode } = useThemeStore();

	const isActive = (path) => {
		const regex = new RegExp(`^${path}`);
		return regex.test(location.pathname);
	};

	return (
		<div className="h-full w-full overflow-auto bg-gray-50 dark:bg-[#050505] selection:bg-blue-500/30">
			{/* Floating Glass Navbar */}
			<div className="fixed top-6 left-0 w-full z-[100] px-6 pointer-events-none">
				<header className="max-w-7xl mx-auto h-16 jx-glass flex items-center px-6 gap-8 pointer-events-auto">
					<Link to={routesConfig.home} className="flex items-center gap-2 group">
						<div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
							<img src={Logo} className="size-6 brightness-0 invert" alt="JudgeX" />
						</div>
						<span className="text-lg font-black tracking-tighter text-neutral-900 dark:text-white uppercase">JudgeX</span>
					</Link>

					<nav className="flex items-center gap-1">
						{[
							{ title: t('home'), path: routesConfig.home },
							{ title: t('problem'), path: routesConfig.problems },
							{ title: 'Courses', path: routesConfig.courses },
							{ title: t('submission'), path: routesConfig.submissions },
							{ title: t('contest'), path: routesConfig.contests },
							{ title: 'Interview', path: routesConfig.interviewDashboard },
						].map((item, index) => (
							<Link
								key={index}
								to={item.path}
								className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${
									isActive(item.path) 
										? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
										: 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
								}`}
							>
								{item.title}
							</Link>
						))}
					</nav>

					<div className="flex items-center gap-3 ml-auto">
						{isAuth ? (
							<>
								<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 group">
									<FontAwesomeIcon icon="fa-regular fa-star" className="text-amber-500 group-hover:scale-125 transition-transform" />
									<span className="text-xs font-black text-amber-600 dark:text-amber-500">{user?.totalScore}</span>
								</div>
								<AvatarWithMenu />
							</>
						) : (
							<Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6" asChild>
								<Link to={routesConfig.login} className="text-[10px] font-black uppercase tracking-widest text-white">
									{t('login')}
								</Link>
							</Button>
						)}
						
						<button
							className="size-10 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
							onClick={() => setMode(theme === 'dark' ? 'light' : 'dark')}
						>
							{theme === 'dark' ? (
								<MoonStar className="text-blue-400" size={18} />
							) : (
								<Sun className="text-amber-500" size={18} />
							)}
						</button>
					</div>
				</header>
			</div>

			{/* Main Content Area */}
			<main className="min-h-full pt-28 flex flex-col relative z-0">
				{children}
			</main>
			
			{footer}
		</div>
	);
};

DefaultLayout.propTypes = {
	children: PropTypes.node,
	footer: PropTypes.node,
};

export default DefaultLayout;
