import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getContests } from '~/services/contest';
import routesConfig from '~/config/routes';
import { Skeleton } from '~/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';
import { Calendar, Clock, Trophy } from 'lucide-react';

const ContestsSidebar = () => {
    const [upcoming, setUpcoming] = useState([]);
    const [previous, setPrevious] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContests = async () => {
            setLoading(true);
            try {
                const [upcomingRes, previousRes] = await Promise.all([
                    getContests({ size: 3, status: 'upcoming' }),
                    getContests({ size: 3, status: 'ended' })
                ]);
                setUpcoming(upcomingRes.data);
                setPrevious(previousRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchContests();
    }, []);

    const formatTime = (date) => {
        const d = new Date(date);
        return `${d.toLocaleDateString()} ${d.getHours()}:00`;
    };

    const ContestList = ({ items, type }) => (
        <div className="space-y-4 pt-2">
            {items.map((contest) => (
                <Link 
                    key={contest.id} 
                    to={routesConfig.contest.replace(':id', contest.id)}
                    className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-neutral-600"
                >
                    <h3 className="text-sm font-semibold mb-2 line-clamp-1 dark:text-gray-200">
                        {contest.title}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                            <Calendar className="size-3 text-sky-500" />
                            {formatTime(contest.startTime)}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                            {type === 'upcoming' ? (
                                <>
                                    <Clock className="size-3 text-sky-500" />
                                    {Math.floor(contest.duration / (60 * 60 * 1000))}h duration
                                </>
                            ) : (
                                <>
                                    <Trophy className="size-3 text-yellow-500" />
                                    Ended
                                </>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
            {items.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                    No {type} contests found.
                </div>
            )}
        </div>
    );

    return (
        <Card className="border-none shadow-sm dark:bg-neutral-800">
            <CardHeader className="pb-3 border-b dark:border-neutral-700">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <span>Contests</span>
                    <Link to={routesConfig.contests} className="text-xs font-normal text-sky-500 hover:underline">
                        View All
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 rounded-none bg-transparent border-b dark:border-neutral-700">
                        <TabsTrigger 
                            value="upcoming" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent dark:text-gray-400 dark:data-[state=active]:text-white"
                        >
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger 
                            value="previous"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent dark:text-gray-400 dark:data-[state=active]:text-white"
                        >
                            Previous
                        </TabsTrigger>
                    </TabsList>
                    <div className="px-4 pb-4">
                        {loading ? (
                            <div className="space-y-4 pt-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-2/3" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <TabsContent value="upcoming">
                                    <ContestList items={upcoming} type="upcoming" />
                                </TabsContent>
                                <TabsContent value="previous">
                                    <ContestList items={previous} type="previous" />
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default ContestsSidebar;
