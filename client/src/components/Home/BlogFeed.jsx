import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getBlogs } from '~/services/blog';
import BlogCard from '~/components/BlogCard';
import { Skeleton } from '~/components/ui/skeleton';
import CreateBlogModal from '~/components/CreateBlogModal';
import { PlusCircle } from 'lucide-react';

const BlogFeed = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleBlogCreated = (newBlog) => {
        setBlogs(prev => [newBlog, ...prev]);
    };

    return (
        <div className="space-y-6">
            {/* Action Header */}
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-8">
                <div>
                    <h2 className="text-xl font-black dark:text-white tracking-tight">Community Feed</h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">Join the discussion and share your expertise</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-blue-900/40 active:scale-95"
                >
                    <PlusCircle size={20} />
                    Write a Blog
                </button>
            </div>

            <CreateBlogModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onBlogCreated={handleBlogCreated}
            />

            {blogs.map((blog) => (
                <BlogCard key={blog.externalId || blog._id} blog={blog} />
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
    );
};

export default BlogFeed;