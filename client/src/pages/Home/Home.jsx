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
        <div className="flex-1 bg-gray-50 dark:bg-[#1b1b1d] min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <div className="space-y-6">
                            {blogs.map((blog) => (
                                <BlogCard key={blog.externalId} blog={blog} />
                            ))}

                            {loading && (
                                <>
                                    <Skeleton className="h-48 w-full rounded-lg" />
                                    <Skeleton className="h-48 w-full rounded-lg" />
                                </>
                            )}

                            {!loading && blogs.length === 0 && (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    No blogs found.
                                </div>
                            )}
                            
                            {!loading && hasMore && (
                                <div className="text-center mt-8">
                                    <button 
                                        onClick={loadMore}
                                        className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800 dark:text-gray-300 transition-colors"
                                    >
                                        Load More
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-1">
                        <DailyChallenge />
                        <Statistics />
                        <ContestsSidebar />
                        <TopUsers />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
