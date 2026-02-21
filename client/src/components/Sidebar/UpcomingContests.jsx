import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getContests } from '~/services/contest';
import routesConfig from '~/config/routes';
import { Skeleton } from '~/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

const UpcomingContests = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getContests({ size: 3, status: 'upcoming' })
            .then((res) => setContests(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatTime = (date) => {
        const d = new Date(date);
        return `${d.toLocaleDateString()} ${d.getHours()}:00`;
    };

    if (!loading && contests.length === 0) return null;

    return (
        <Card className="border-none shadow-sm dark:bg-neutral-800">
            <CardHeader className="pb-3 border-b dark:border-neutral-700">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <span>Upcoming Contests</span>
                    <Link to={routesConfig.contests} className="text-xs font-normal text-sky-500 hover:underline">
                        View More
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {contests.map((contest) => (
                            <Link 
                                key={contest.id} 
                                to={routesConfig.contest.replace(':id', contest.id)}
                                className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <h3 className="text-sm font-semibold mb-1 line-clamp-1 dark:text-gray-200">
                                    {contest.title}
                                </h3>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                        <Calendar className="size-3 text-sky-500" />
                                        {formatTime(contest.startTime)}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                        <Clock className="size-3 text-sky-500" />
                                        {Math.floor(contest.duration / (60 * 60 * 1000))}h duration
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UpcomingContests;
