import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getUsers } from '~/services/user';
import UserAvatar from '~/components/UserAvatar';
import routesConfig from '~/config/routes';
import { Skeleton } from '~/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';

const TopUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUsers({ size: 5, order: -1, sortBy: 'totalScore' })
            .then((res) => setUsers(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="jx-glass p-6">
            <div className="flex items-center justify-between mb-6">
                <span className="jx-label text-blue-500">Hall of Fame</span>
                <Link to={routesConfig.users} className="text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
                    Global Ranking
                </Link>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-24 bg-white/10" />
                                    <Skeleton className="h-2 w-12 bg-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {users.map((user, index) => (
                            <Link 
                                key={user?._id || user?.id || index} 
                                to={routesConfig.user.replace(':name', user?.name || '')}
                                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <UserAvatar user={user} className="h-10 w-10 rounded-xl border-2 border-white/5" />
                                        <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg ${
                                            index === 0 ? 'bg-amber-500 text-white shadow-amber-500/20' :
                                            index === 1 ? 'bg-slate-300 text-slate-800 shadow-slate-300/20' :
                                            index === 2 ? 'bg-orange-600 text-white shadow-orange-600/20' : 'bg-neutral-800 text-neutral-400'
                                        }`}>
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-500 transition-colors">
                                            {user?.name}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 opacity-60">
                                            {user?.totalScore} Points
                                        </span>
                                    </div>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <ChevronRight size={14} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopUsers;
