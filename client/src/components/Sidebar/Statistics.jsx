import { useEffect, useState } from 'react';
import { getStat } from '~/services/stat';
import { Skeleton } from '~/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { CheckCircle2, FileCode2, Users2, Target } from 'lucide-react';

const Statistics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStat()
            .then((res) => setStats(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const statItems = [
        { 
            label: 'Problems Solved', 
            count: stats?.countTodayAccepted || 0, 
            icon: CheckCircle2, 
            color: 'text-green-500' 
        },
        { 
            label: 'Total Submissions', 
            count: stats?.countTodaySubmissions || 0, 
            icon: FileCode2, 
            color: 'text-blue-500' 
        },
        { 
            label: 'New Users', 
            count: stats?.countUserCreatedToday || 0, 
            icon: Users2, 
            color: 'text-purple-500' 
        },
        { 
            label: 'Global Activity', 
            count: stats?.countTodayProblem || 0, 
            icon: Target, 
            color: 'text-orange-500' 
        },
    ];

    return (
        <Card className="border-none shadow-sm dark:bg-neutral-800">
            <CardHeader className="pb-3 border-b dark:border-neutral-700">
                <CardTitle className="text-lg font-bold">Today Statistics</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col space-y-2">
                                <Skeleton className="h-6 w-12" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {statItems.map((item, index) => (
                            <div key={index} className="flex flex-col p-2 bg-gray-50 dark:bg-neutral-900 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <item.icon className={`size-4 ${item.color}`} />
                                    <span className="text-lg font-bold dark:text-white">{item.count}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default Statistics;
