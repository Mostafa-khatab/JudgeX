import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getBlogs } from '~/services/blog';
import BlogCard from '~/components/BlogCard';
import { Skeleton } from '~/components/ui/skeleton';
import { TopUsers, ContestsSidebar, Statistics } from '~/components/Sidebar';
import DailyChallenge from '~/components/DailyChallenge/DailyChallenge';

const Home = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchBlogs = async (currentPage = 1) => {
        setLoading(true);
        try {
            const res = await getBlogs({ page: currentPage, limit: 10 });
            if (currentPage === 1) {
                setBlogs(res.data);
            } else {
                setBlogs(prev => [...prev, ...res.data]);
            }
            setHasMore(res.data.length === 10);
        } catch (err) {
            toast.error('Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs(1);
    }, []);

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchBlogs(nextPage);
        }
    };

    return (
        <div className="flex-1 min-h-screen jx-mesh-bg relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 py-12 max-w-7xl relative z-10">
                {/* Hero / Header Section */}
                <div className="mb-16 space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="jx-pulse-dot" />
                        <span className="jx-label text-blue-500">Live Community Feed</span>
                    </div>
                    <h1 className="jx-h1 mb-2">Explore the <span className="text-blue-500">JudgeX</span> Universe</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg font-medium leading-relaxed">
                        Stay updated with the latest blogs, contests, and achievements from our global community of developers.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="jx-h3">Recent Blogs</h2>
                                <div className="h-[1px] flex-1 mx-6 bg-neutral-200 dark:bg-white/5" />
                            </div>

                            {blogs.map((blog) => (
                                <BlogCard key={blog.externalId} blog={blog} />
                            ))}

                            {loading && (
                                <div className="space-y-6">
                                    <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
                                    <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
                                </div>
                            )}

                            {!loading && blogs.length === 0 && (
                                <div className="jx-glass py-24 text-center">
                                    <p className="jx-label">No blogs found in the universe.</p>
                                </div>
                            )}
                            
                            {!loading && hasMore && (
                                <div className="text-center mt-12">
                                    <button 
                                        onClick={loadMore}
                                        className="group relative px-10 py-4 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl transition-all hover:scale-105 active:scale-95"
                                    >
                                        <span className="jx-label group-hover:text-blue-500 transition-colors">Load More Content</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-10 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
                        <div className="space-y-8">
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                                    <h3 className="jx-label text-neutral-900 dark:text-white">Daily Challenge</h3>
                                </div>
                                <DailyChallenge />
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                    <h3 className="jx-label text-neutral-900 dark:text-white">Statistics</h3>
                                </div>
                                <Statistics />
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-4 bg-purple-500 rounded-full" />
                                    <h3 className="jx-label text-neutral-900 dark:text-white">Active Contests</h3>
                                </div>
                                <ContestsSidebar />
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                    <h3 className="jx-label text-neutral-900 dark:text-white">Top Performers</h3>
                                </div>
                                <TopUsers />
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
