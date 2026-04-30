import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getUsers } from '~/services/user';
import UserAvatar from '~/components/UserAvatar';
import routesConfig from '~/config/routes';
import { Skeleton } from '~/components/ui/skeleton';
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
        <Card className="border-none shadow-sm dark:bg-neutral-800">
            <CardHeader className="pb-3 border-b dark:border-neutral-700">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <span>Top Users</span>
                    <Link to={routesConfig.users} className="text-xs font-normal text-sky-500 hover:underline">
                        View All
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {users.map((user, index) => (
                            <Link 
                                key={user.id} 
                                to={routesConfig.user.replace(':name', user?.name || '')}
                                className="flex items-center justify-between group"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className={`w-5 text-sm font-bold ${index < 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                                        {index + 1}
                                    </span>
                                    <UserAvatar user={user} className="h-8 w-8" />
                                    <span className="text-sm font-medium group-hover:text-sky-500 dark:text-gray-200">
                                        {user?.name}
                                    </span>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {user?.totalScore}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TopUsers;
