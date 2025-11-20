import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Compass, List as ListIcon, Flame, User, LogOut, Tv, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../App';
import { supabase } from '../services/supabaseClient';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, path, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
      isActive 
        ? 'bg-primary/10 text-primary' 
        : 'text-onSurfaceVariant hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
    <span className={`font-medium text-sm ${isActive ? 'font-bold' : ''}`}>{label}</span>
    {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
  </button>
);

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAppContext();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const tabs = [
    { name: 'Discover', icon: Compass, path: '/' },
    { name: 'Trending', icon: Flame, path: '/trending' },
    { name: 'My List', icon: ListIcon, path: '/list' },
  ];

  const handleLogout = async () => {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      navigate('/');
      setIsLoggingOut(false);
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-[#1E1C22] z-50 h-full shrink-0">
      {/* Logo Area */}
      <div className="p-6 mb-2">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
            <Tv size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none tracking-tight">AniStream</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-onSurfaceVariant">AI Powered</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        <div className="px-4 py-2 text-xs font-bold text-onSurfaceVariant/50 uppercase tracking-wider">Menu</div>
        {tabs.map((tab) => (
          <SidebarItem
            key={tab.path}
            icon={tab.icon}
            label={tab.name}
            path={tab.path}
            isActive={location.pathname === tab.path}
            onClick={() => navigate(tab.path)}
          />
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5">
        {user ? (
          <>
            <div className="bg-surfaceVariant/10 rounded-2xl p-3 flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{user.email}</div>
                    <div className="text-xs text-onSurfaceVariant">Free Plan</div>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-error hover:bg-error/10 transition-colors text-xs font-bold disabled:opacity-50"
            >
                {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </>
        ) : (
            <button 
                onClick={() => openAuthModal('signIn')}
                className="w-full bg-primary text-onPrimary font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-transform"
            >
                Sign In
            </button>
        )}
      </div>
    </aside>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  if (location.pathname === '/login') return null;

  const tabs = [
    { name: 'Discover', icon: Compass, path: '/' },
    { name: 'Trending', icon: Flame, path: '/trending' },
    { name: 'My List', icon: ListIcon, path: '/list' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[50]">
        {/* Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        
        <nav className="relative bg-[#1E1C22]/95 backdrop-blur-xl border-t border-white/5 pb-safe pt-3 px-6 h-20 flex justify-around items-start rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className="group flex flex-col items-center gap-1 relative w-16"
              >
                <motion.div 
                    whileTap={{ scale: 0.9 }}
                    animate={{ 
                        backgroundColor: isActive ? "rgba(103, 80, 164, 0.15)" : "transparent",
                        color: isActive ? "rgb(208, 188, 255)" : "rgba(230, 225, 229, 0.6)"
                    }}
                    className="p-2 rounded-2xl transition-colors duration-300"
                >
                  <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-onSurface' : 'text-onSurfaceVariant/60'}`}>
                  {tab.name}
                </span>
              </button>
            );
          })}
        </nav>
    </div>
  );
};

const Layout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-onSurface">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Scrollable Area - This handles scrolling for ALL pages */}
        <main className="flex-1 overflow-y-auto scroll-smooth no-scrollbar pb-24 md:pb-0 relative">
            <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;