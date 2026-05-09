import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, MessageSquare, Brain, LayoutGrid, Trophy } from 'lucide-react';
import routesConfig from '~/config/routes';

const MobileBottomNav = () => {
    const location = useLocation();
    
    const isActive = (path) => {
        const [pathname, search] = path.split('?');
        if (search) {
            return location.pathname === pathname && location.search.includes(search);
        }
        return location.pathname === pathname && !location.search;
    };

    const navItems = [
        { label: 'Home', icon: Home, path: routesConfig.home },
        { label: 'Contests', icon: Trophy, path: routesConfig.contests },
        { label: 'Problems', icon: LayoutGrid, path: routesConfig.problems },
        { label: 'Roadmap', icon: Map, path: `${routesConfig.home}?tab=roadmap` },
        { label: 'AI Lab', icon: Brain, path: `${routesConfig.home}?tab=ailab` },
        { label: 'Blogs', icon: MessageSquare, path: `${routesConfig.home}?tab=blogs` },
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800 px-2 py-1 pb-safe">
            <div className="flex items-center justify-around">
                {navItems.map((item, index) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    
                    return (
                        <Link 
                            key={index}
                            to={item.path}
                            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all duration-300 ${
                                active 
                                ? 'text-blue-500 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                            }`}
                        >
                            <div className={`relative ${active ? 'scale-110' : 'scale-100'}`}>
                                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                                {active && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                                )}
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
