import { useSearchParams } from 'react-router-dom';
import { TopUsers, ContestsSidebar, Statistics } from '~/components/Sidebar';
import DailyChallenge from '~/components/DailyChallenge/DailyChallenge';
import BlogFeed from '~/components/Home/BlogFeed';
import AILab from '~/components/Home/AILab';
import Roadmap from '~/components/Roadmap/Roadmap';

const Home = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';

    return (
        <div className="flex-1 bg-gray-50 dark:bg-[#1b1b1d] min-h-screen">
            <div className="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* Main Content Area */}
                    <div className={activeTab === 'dashboard' ? 'lg:col-span-8' : 'lg:col-span-12'}>
                        {activeTab === 'dashboard' && (
                            <div className="space-y-6">
                                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-sm group">
                                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
                                    <div className="relative z-10 space-y-4 md:space-y-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                            Status: Active & Ready
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Soldier!</span> 🚀
                                        </h1>
                                        <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-base md:text-lg max-w-xl font-medium">
                                            Your command center is fully operational. Continue your journey through the roadmap or experiment with the latest neural tools in the AI Lab.
                                        </p>
                                        <div className="pt-2 md:pt-4 flex flex-wrap gap-3 md:gap-4">
                                            <div className="px-3 md:px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700/50 flex-1 min-w-[140px]">
                                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Current Rank</div>
                                                <div className="text-xs md:text-sm font-black dark:text-white uppercase">Novice Competitor</div>
                                            </div>
                                            <div className="px-3 md:px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700/50 flex-1 min-w-[140px]">
                                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Missions Done</div>
                                                <div className="text-xs md:text-sm font-black dark:text-white uppercase">12 Solved</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DailyChallenge />
                            </div>
                        )}
                        {activeTab === 'roadmap' && <Roadmap />}
                        {activeTab === 'blogs' && <BlogFeed />}
                        {activeTab === 'ailab' && <AILab />}
                    </div>

                    {/* Sidebar - Visible on Dashboard, stacked on mobile */}
                    {activeTab === 'dashboard' && (
                        <div className="lg:col-span-4 space-y-6 md:space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
                            <Statistics />
                            <ContestsSidebar />
                            <TopUsers />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;