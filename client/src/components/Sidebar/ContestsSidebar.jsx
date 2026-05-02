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
        <div className="space-y-3">
            {items.map((contest) => (
                <Link 
                    key={contest.id} 
                    to={routesConfig.contest.replace(':id', contest.id)}
                    className="block p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/5 group"
                >
                    <h3 className="text-sm font-black tracking-tighter mb-3 line-clamp-1 dark:text-gray-100 group-hover:text-blue-500 transition-colors">
                        {contest.title}
                    </h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                            <Calendar className="size-3 text-blue-500" />
                            {formatTime(contest.startTime)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                            {type === 'upcoming' ? (
                                <>
                                    <Clock className="size-3 text-indigo-500" />
                                    {Math.floor(contest.duration / (60 * 60 * 1000))}H Duration
                                </>
                            ) : (
                                <>
                                    <Trophy className="size-3 text-amber-500" />
                                    Event Ended
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
        <div className="jx-glass p-0 overflow-hidden">
            <div className="p-6 pb-0 flex items-center justify-between mb-4">
                <span className="jx-label text-blue-500">Global Arenas</span>
                <Link to={routesConfig.contests} className="text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
                    All Events
                </Link>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <div className="px-6">
                    <TabsList className="w-full grid grid-cols-2 bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
                        <TabsTrigger 
                            value="upcoming" 
                            className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white transition-all"
                        >
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger 
                            value="previous"
                            className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white transition-all"
                        >
                            Previous
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-6 pt-2">
                    {loading ? (
                        <div className="space-y-4 pt-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl space-y-3">
                                    <Skeleton className="h-3 w-full bg-white/10" />
                                    <Skeleton className="h-2 w-2/3 bg-white/10" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <TabsContent value="upcoming" className="m-0 animate-in fade-in duration-500">
                                <ContestList items={upcoming} type="upcoming" />
                            </TabsContent>
                            <TabsContent value="previous" className="m-0 animate-in fade-in duration-500">
                                <ContestList items={previous} type="previous" />
                            </TabsContent>
                        </>
                    )}
                </div>
            </Tabs>
        </div>
    );
};

export default ContestsSidebar;
