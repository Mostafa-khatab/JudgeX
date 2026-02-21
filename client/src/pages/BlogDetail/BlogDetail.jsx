import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlog } from '~/services/blog';
import { Skeleton } from '~/components/ui/skeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';

const BlogDetail = () => {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const res = await getBlog(id);
                setBlog(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <Skeleton className="mb-4 h-8 w-1/2" />
                <Skeleton className="mb-8 h-4 w-1/4" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!blog) {
        return <div className="py-20 text-center">Blog not found</div>;
    }

    return (
        <div className="flex-1 bg-gray-50 dark:bg-[#1b1b1d] min-h-screen">
             <div className="container mx-auto max-w-4xl px-4 py-8">
                <Link to="/" className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Feed
                </Link>

                <article className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-800 dark:text-gray-200">
                    <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">{blog.title}</h1>
                    
                    <div className="mb-8 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-blue-500">{blog.authorHandle}</span>
                        <span>{formatDistanceToNow(new Date(blog.creationTimeSeconds * 1000), { addSuffix: true })}</span>
                        <a href={blog.originalUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-blue-500 hover:underline">
                            View on Codeforces
                        </a>
                    </div>
                    
                    <div 
                        className="prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: blog.content || '<p>Content not available. Try syncing again or view on Codeforces.</p>' }}
                    ></div>
                </article>
            </div>
        </div>
    );
};

export default BlogDetail;
