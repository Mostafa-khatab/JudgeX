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
        <div className="jx-glass p-6">
            <div className="space-y-6">
                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col space-y-2 p-4 bg-white/5 rounded-2xl">
                                <Skeleton className="h-6 w-12 bg-white/10" />
                                <Skeleton className="h-3 w-16 bg-white/10" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {statItems.map((item, index) => (
                            <div key={index} className="flex flex-col p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-transparent hover:border-white/5 transition-all group">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 rounded-lg bg-white/5 group-hover:scale-110 transition-transform`}>
                                        <item.icon className={`size-3.5 ${item.color}`} />
                                    </div>
                                    <span className="text-xl font-black dark:text-white tracking-tighter leading-none">{item.count}</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 opacity-80">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && (
                    <div className="pt-4 border-t border-neutral-200 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Global Pulse</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[9px] font-bold text-neutral-400">System Healthy</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Statistics;
