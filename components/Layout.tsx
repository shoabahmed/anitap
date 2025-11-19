
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Compass, List as ListIcon, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // We don't hide this anymore on detail pages to fix the "Disappearing Navbar" bug
  // if (location.pathname === '/login') return null; // Still hide on login though
  if (location.pathname === '/login') return null;

  const tabs = [
    { name: 'Discover', icon: Compass, path: '/' },
    { name: 'Trending', icon: Flame, path: '/trending' },
    { name: 'My List', icon: ListIcon, path: '/list' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100]">
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="relative bg-[#1E1C22]/95 backdrop-blur-xl border-t border-white/5 pb-safe pt-3 px-6 h-20 flex justify-around items-start rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.3)] max-w-md mx-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className="group flex flex-col items-center gap-1 relative"
              >
                <motion.div 
                    whileTap={{ scale: 0.9 }}
                    animate={{ backgroundColor: isActive ? "rgba(103, 80, 164, 0.15)" : "transparent" }}
                    className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'text-primary' : 'text-onSurfaceVariant/60'}`}
                >
                  <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-onSurface' : 'text-onSurfaceVariant/60'}`}>
                  {tab.name}
                </span>
              </button>
            );
          })}
        </div>
    </div>
  );
};

const Layout = () => {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
};

export default Layout;
