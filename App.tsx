import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Home, Search as SearchIcon, User as UserIcon, LogOut, ChevronDown, ChevronLeft, Play, Plus, Tv, AlertCircle, SlidersHorizontal, Sparkles, Flame, X, Check, ArrowUpDown, Filter, Ghost, Calendar, Star, Eye, EyeOff, Share2, Clock, Users, Trophy, Film, Info, Heart, MonitorPlay, Youtube, Trash2, Link as LinkIcon, Compass, LayoutGrid, List as ListIcon } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';

import { Anime, AnimeStatus, User, Character, Episode, Relation, FilterPreset } from './types';
import * as GeminiService from './services/geminiService';

// --- Constants ---

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity', sort: 'asc' },
  { label: 'Highest Rated', value: 'score', sort: 'desc' },
  { label: 'Newest', value: 'start_date', sort: 'desc' },
  { label: 'Oldest', value: 'start_date', sort: 'asc' },
  { label: 'Title (A-Z)', value: 'title', sort: 'asc' },
  { label: 'Episodes (Most)', value: 'episodes', sort: 'desc' },
];

const MAIN_GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Slice of Life', 'Mystery', 'Horror', 'Sports'
];

// --- Context ---

interface AppContextType {
  user: User;
  myList: Anime[];
  login: () => void;
  logout: () => void;
  addToMyList: (anime: Anime, status: AnimeStatus) => void;
  removeFromMyList: (animeId: number) => void;
  updateAnimeStatus: (animeId: number, status: AnimeStatus, score?: number) => void;
  
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Anime[];
  setSearchResults: (results: Anime[]) => void;
  isSearching: boolean;
  setIsSearching: (v: boolean) => void;
  loadMoreResults: () => void;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  handleNewSearch: (results: Anime[], hasNext: boolean) => void;
  searchError: string | null;
  setSearchError: (error: string | null) => void;

  searchFilters: GeminiService.SearchFilters;
  setSearchFilters: (filters: GeminiService.SearchFilters) => void;
  resetFilters: () => void;
  applyPreset: (preset: FilterPreset) => void;
  
  lastSearchedParams: React.MutableRefObject<string>;
  trendingAnime: Anime[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- Components ---

const GoogleAd = ({ className }: { className?: string }) => {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        try {
            const adsbygoogle = (window as any).adsbygoogle || [];
            if (adRef.current && adRef.current.innerHTML === "") {
                adsbygoogle.push({});
            }
        } catch (e) {
            console.error("AdSense error", e);
        }
    }, []);

    return (
        <div className={`w-full overflow-hidden bg-surfaceVariant/5 flex justify-center items-center min-h-[100px] relative ${className}`}>
             <span className="text-[10px] text-onSurfaceVariant/20 absolute top-1 right-2 uppercase tracking-wider">Ad</span>
             <ins className="adsbygoogle"
                 ref={adRef}
                 style={{ display: 'block', width: '100%' }}
                 data-ad-client="ca-pub-7652027225361719"
                 data-ad-slot="7167045749" 
                 data-ad-format="auto"
                 data-full-width-responsive="true"
             />
        </div>
    );
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = [
    { name: 'Discover', icon: Compass, path: '/' },
    { name: 'My List', icon: ListIcon, path: '/list' },
  ];

  if (location.pathname === '/login' || location.pathname.startsWith('/detail')) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="relative bg-[#1E1C22]/95 backdrop-blur-xl border-t border-white/5 pb-safe pt-3 px-6 h-20 flex justify-around items-start rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
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

const FilterDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { searchFilters, setSearchFilters, resetFilters, applyPreset } = useAppContext();
    const [localFilters, setLocalFilters] = useState(searchFilters);
    
    const currentYear = new Date().getFullYear();
    const minYear = 1970;

    useEffect(() => {
        if (isOpen) setLocalFilters(searchFilters);
    }, [isOpen, searchFilters]);

    const toggleGenre = (id: number) => {
        setLocalFilters(prev => {
            const currentGenres = prev.genres || [];
            if (currentGenres.includes(id)) return { ...prev, genres: currentGenres.filter(g => g !== id) };
            else return { ...prev, genres: [...currentGenres, id] };
        });
    };

    const handleApply = () => {
        setSearchFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({ sfw: true });
        resetFilters();
        onClose();
    };

    const handlePresetClick = (preset: FilterPreset) => {
        applyPreset(preset);
        onClose();
    }

    // Group genres for display
    const groupedGenres = GeminiService.GENRE_LIST.reduce((acc, genre) => {
        if (!acc[genre.group]) acc[genre.group] = [];
        acc[genre.group].push(genre);
        return acc;
    }, {} as Record<string, typeof GeminiService.GENRE_LIST>);

    const groupsOrder = ['Mainstream', 'Themes', 'Demographics', 'Explicit'];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[400px] bg-[#201E24] z-[70] border-l border-white/10 flex flex-col shadow-2xl"
                    >
                        <div className="bg-[#201E24]/95 backdrop-blur z-10 px-6 py-5 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-onSurface">Filters</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                            
                            {/* Presets */}
                            <section>
                                <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest mb-3">Quick Presets</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(['Top Rated', 'Trending', 'Classics', 'New Releases', 'Movies'] as FilterPreset[]).map(preset => (
                                        <button 
                                            key={preset}
                                            onClick={() => handlePresetClick(preset)}
                                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 active:scale-95 transition-all"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Sort By */}
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <ArrowUpDown size={16} className="text-primary" />
                                    <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest">Sort Order</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {SORT_OPTIONS.map(opt => {
                                        const isSelected = localFilters.order_by === opt.value && localFilters.sort === opt.sort;
                                        const isActive = isSelected || (!localFilters.order_by && opt.value === 'popularity');
                                        return (
                                            <button
                                                key={opt.label}
                                                onClick={() => setLocalFilters({...localFilters, order_by: opt.value as any, sort: opt.sort as any})}
                                                className={`px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all flex items-center justify-between border
                                                ${isActive ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceVariant/10 border-transparent text-onSurfaceVariant hover:bg-surfaceVariant/20'}`}
                                            >
                                                {opt.label}
                                                {isActive && <Check size={14} />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* NSFW Toggle */}
                            <section className="flex items-center justify-between bg-surfaceVariant/10 p-4 rounded-xl border border-white/5">
                                <div>
                                    <h3 className="text-sm font-bold text-onSurface">Show 18+ Content</h3>
                                    <p className="text-xs text-onSurfaceVariant/60 mt-0.5">Include NSFW results</p>
                                </div>
                                <button 
                                    onClick={() => setLocalFilters({ ...localFilters, sfw: !localFilters.sfw })}
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${!localFilters.sfw ? 'bg-error' : 'bg-surfaceVariant'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${!localFilters.sfw ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </section>

                            {/* Format & Status */}
                            <section>
                                <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest mb-3">Format & Status</h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {['tv', 'movie', 'ova', 'special'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setLocalFilters({...localFilters, type: localFilters.type === t ? undefined : t as any})}
                                            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all border
                                            ${localFilters.type === t ? 'bg-secondary text-white border-secondary' : 'bg-transparent border-white/10 text-onSurfaceVariant hover:border-white/30'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['airing', 'complete', 'upcoming'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setLocalFilters({...localFilters, status: localFilters.status === s ? undefined : s as any})}
                                            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all border
                                            ${localFilters.status === s ? 'bg-secondary text-white border-secondary' : 'bg-transparent border-white/10 text-onSurfaceVariant hover:border-white/30'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Rating */}
                             <section>
                                <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest mb-3">Age Rating</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['g', 'pg', 'pg13', 'r17'].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setLocalFilters({...localFilters, rating: localFilters.rating === r ? undefined : r as any})}
                                            className={`px-3 py-1.5 rounded-md text-xs uppercase transition-all border
                                            ${localFilters.rating === r ? 'bg-secondary text-white border-secondary' : 'bg-transparent border-white/10 text-onSurfaceVariant'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Sliders (Year & Score) */}
                            <div className="grid grid-cols-1 gap-6">
                                <section>
                                    <div className="flex justify-between mb-2">
                                        <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest">Min Score</h3>
                                        <span className="text-xs font-mono text-primary">{localFilters.min_score || 0}</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="10" step="1"
                                        className="w-full h-1.5 bg-surfaceVariant rounded-lg appearance-none cursor-pointer accent-primary"
                                        value={localFilters.min_score || 0}
                                        onChange={(e) => setLocalFilters({...localFilters, min_score: parseInt(e.target.value)})}
                                    />
                                </section>
                                <section>
                                    <div className="flex justify-between mb-3 items-center">
                                        <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest">Year Range</h3>
                                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                                            {localFilters.start_year || minYear} — {localFilters.end_year || currentYear}
                                        </span>
                                    </div>
                                    <div className="space-y-4 px-1">
                                        <input 
                                            type="range" min={minYear} max={currentYear} step="1"
                                            className="w-full h-1.5 bg-surfaceVariant rounded-lg appearance-none cursor-pointer accent-primary"
                                            value={localFilters.start_year || minYear}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setLocalFilters(prev => ({ ...prev, start_year: val, end_year: (prev.end_year || currentYear) < val ? val : prev.end_year }));
                                            }}
                                        />
                                        <input 
                                            type="range" min={minYear} max={currentYear} step="1"
                                            className="w-full h-1.5 bg-surfaceVariant rounded-lg appearance-none cursor-pointer accent-primary"
                                            value={localFilters.end_year || currentYear}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setLocalFilters(prev => ({ ...prev, end_year: val, start_year: (prev.start_year || minYear) > val ? val : prev.start_year }));
                                            }}
                                        />
                                    </div>
                                </section>
                            </div>

                            {/* Genres Grid */}
                            {groupsOrder.map(group => {
                                const genres = groupedGenres[group];
                                if (!genres || genres.length === 0) return null;
                                if (group === 'Explicit' && localFilters.sfw !== false) return null;

                                return (
                                    <section key={group}>
                                        <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest mb-3 border-b border-white/5 pb-1">{group}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {genres.map(g => {
                                                const isSelected = (localFilters.genres || []).includes(g.id);
                                                return (
                                                    <button
                                                        key={g.id}
                                                        onClick={() => toggleGenre(g.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs transition-all border
                                                        ${isSelected ? 'bg-primary/20 text-primary border-primary' : 'bg-surfaceVariant/10 border-transparent text-onSurfaceVariant hover:bg-surfaceVariant/20'}`}
                                                    >
                                                        {g.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-[#201E24] border-t border-white/5 flex gap-4 z-20 pb-10">
                            <button onClick={handleReset} className="flex-1 py-3.5 rounded-xl font-bold text-sm text-onSurfaceVariant bg-surfaceVariant/20 hover:bg-surfaceVariant/30 transition-colors">Reset</button>
                            <button onClick={handleApply} className="flex-[2] bg-primary text-onPrimary py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 active:scale-95 transition-transform">Show Results</button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

const SkeletonCard = () => (
  <div className="w-full animate-pulse">
    <div className="aspect-[2/3] bg-surfaceVariant/20 rounded-xl mb-2" />
    <div className="h-3 bg-surfaceVariant/20 rounded w-3/4 mb-1" />
    <div className="h-2 bg-surfaceVariant/20 rounded w-1/3" />
  </div>
);

const VerticalAnimeCard: React.FC<{ anime: Anime; onClick: () => void }> = ({ anime, onClick }) => (
    <motion.div
        layout
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className="w-full shrink-0 cursor-pointer group"
    >
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 shadow-md bg-surfaceVariant/20">
            <img 
                src={anime.imageUrl} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                alt={anime.title}
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x450/2d2b33/ffffff?text=${encodeURIComponent(anime.title.substring(0, 5))}`; }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                        <Star size={8} fill="currentColor" /> {anime.score}
                    </span>
                    {anime.status === 'Currently Airing' && (
                        <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                    )}
                </div>
            </div>
        </div>
        <h4 className="text-xs font-bold text-onSurface line-clamp-2 leading-tight group-hover:text-primary transition-colors">{anime.title}</h4>
        <p className="text-[10px] text-onSurfaceVariant mt-0.5">{anime.episodes || '?'} eps</p>
    </motion.div>
);

const HorizontalAnimeCard: React.FC<{ anime: Anime; onClick: () => void }> = ({ anime, onClick }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-[#252329] hover:bg-[#2B2930] transition-colors rounded-2xl overflow-hidden shadow-sm border border-white/5 flex h-32 cursor-pointer group relative"
    >
      <div className="w-24 h-full shrink-0 bg-surfaceVariant relative overflow-hidden">
        <img 
            src={anime.imageUrl} 
            alt={anime.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x450/2d2b33/ffffff?text=${encodeURIComponent(anime.title.substring(0, 10))}`; }}
        />
      </div>
      <div className="flex-1 p-3.5 flex flex-col justify-between relative">
        <div>
          <div className="flex justify-between items-start gap-2">
              <h3 className="text-onSurface font-bold text-sm line-clamp-2 leading-tight mb-1">{anime.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-onSurfaceVariant/70">
             {anime.status && <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] uppercase tracking-wide">{anime.status.split(' ')[0]}</span>}
             <span>{anime.episodes ? `${anime.episodes} eps` : '? eps'}</span>
          </div>
        </div>
        
        <div className="w-full bg-surfaceVariant/30 h-1 rounded-full mt-2 overflow-hidden">
             <div className="bg-primary h-full rounded-full" style={{ width: anime.userProgress ? `${((anime.userProgress || 0) / (anime.episodes || 12)) * 100}%` : '0%' }} />
        </div>

        <div className="flex justify-between items-end mt-1">
          <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs">
            <Star size={12} fill="currentColor" />
            {anime.score || 'N/A'}
          </div>
          {anime.userStatus && (
             <span className={`text-[10px] px-2 py-0.5 rounded font-medium border
               ${anime.userStatus === AnimeStatus.Watching ? 'bg-primary/10 text-primary border-primary/20' : 
                 anime.userStatus === AnimeStatus.Completed ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                 'bg-gray-600/10 text-gray-400 border-gray-600/20'}`}>
               {anime.userStatus}
             </span>
          )}
        </div>
      </div>
    </motion.div>
);

const HeroCarousel: React.FC<{ animeList: Anime[], onSelect: (a: Anime) => void }> = ({ animeList, onSelect }) => {
    if (!animeList.length) return null;
    return (
        <div className="w-full overflow-x-auto no-scrollbar flex gap-4 px-6 pb-6 snap-x snap-mandatory">
            {animeList.map(anime => (
                <div 
                    key={anime.id} 
                    onClick={() => onSelect(anime)}
                    className="relative w-[85vw] sm:w-[300px] aspect-video shrink-0 rounded-2xl overflow-hidden snap-center shadow-lg cursor-pointer border border-white/10"
                >
                    <img src={anime.imageUrl} className="w-full h-full object-cover opacity-80" alt={anime.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                        <div className="flex items-center gap-2 mb-1">
                             <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase">Trending</span>
                             <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                                 <Star size={10} fill="currentColor" /> {anime.score}
                             </div>
                        </div>
                        <h3 className="text-lg font-bold text-white line-clamp-1">{anime.title}</h3>
                    </div>
                </div>
            ))}
        </div>
    )
};

// --- Pages ---

const DiscoverScreen = () => {
  const { 
      searchQuery, setSearchQuery, 
      searchResults, isSearching, 
      setIsSearching,
      loadMoreResults, hasNextPage, isLoadingMore,
      handleNewSearch, searchError, setSearchError,
      searchFilters, setSearchFilters, resetFilters, lastSearchedParams,
      trendingAnime
  } = useAppContext();
  
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const observerTarget = useRef(null);
  
  // Handle Genre Chip Click
  const handleGenreClick = (genreName: string) => {
      const genre = GeminiService.GENRE_LIST.find(g => g.name === genreName);
      if (genre) {
          setSearchFilters({ ...searchFilters, genres: [genre.id] });
          // Scroll to results logic handled by search effect
      }
  }

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(async () => {
        const paramsKey = JSON.stringify({ q: searchQuery, f: searchFilters });
        if (paramsKey === lastSearchedParams.current && searchResults.length > 0 && !searchError) return;
        
        // Explicitly search if query exists OR filters exist (more than just sfw default)
        if (searchQuery.length >= 2 || Object.keys(searchFilters).length > 1) {
             setIsSearching(true);
             setSearchError(null);
             
             const { data, hasNextPage, error } = await GeminiService.searchAnime(searchQuery, 1, searchFilters);
             
             if (error) {
                 setSearchError(error);
                 handleNewSearch([], false);
             } else {
                 handleNewSearch(data, hasNextPage);
                 lastSearchedParams.current = paramsKey;
             }
             setIsSearching(false);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchFilters]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore && !isSearching) {
          loadMoreResults();
        }
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, isSearching, loadMoreResults]);

  const showResults = searchQuery.length > 0 || Object.keys(searchFilters).length > 1;

  return (
    <div className="min-h-screen pb-24 bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#1E1C22]/95 backdrop-blur-xl px-6 pt-4 pb-2 border-b border-white/5 shadow-md">
          <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">Discover</h1>
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                  <UserIcon size={16} className="text-primary" />
              </div>
          </div>
          <div className="flex gap-3 mb-2">
              <div className="relative flex-1 group">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-onSurfaceVariant group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search anime, studios..."
                      className="w-full bg-surfaceVariant/10 border border-white/5 text-onSurface rounded-2xl pl-11 pr-10 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-onSurfaceVariant/50"
                  />
                  {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-onSurfaceVariant hover:text-onSurface p-1">
                          <X size={14} />
                      </button>
                  )}
              </div>
              <button 
                  onClick={() => setIsFilterOpen(true)}
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all border ${Object.keys(searchFilters).length > 1 ? 'bg-primary text-onPrimary border-primary' : 'bg-surfaceVariant/10 text-onSurfaceVariant border-white/5 hover:bg-surfaceVariant/20'}`}
              >
                  <SlidersHorizontal size={18} />
              </button>
          </div>
      </div>

      <div className="flex-1 space-y-8 pt-4">
          
          {/* Discovery Content (Only show if NOT searching) */}
          {!showResults && (
            <>
                {/* Trending Carousel */}
                <section>
                    <div className="px-6 mb-3 flex justify-between items-end">
                        <h2 className="text-sm font-bold text-onSurfaceVariant uppercase tracking-widest">Trending Now</h2>
                    </div>
                    <HeroCarousel animeList={trendingAnime} onSelect={(a) => navigate(`/detail/${a.id}`, { state: { anime: a } })} />
                </section>

                {/* Genre Chips */}
                <section className="px-6">
                     <h2 className="text-sm font-bold text-onSurfaceVariant uppercase tracking-widest mb-3">Browse Categories</h2>
                     <div className="flex flex-wrap gap-2">
                         {MAIN_GENRES.map(genre => (
                             <button 
                                key={genre} 
                                onClick={() => handleGenreClick(genre)}
                                className="px-4 py-2 bg-surfaceVariant/10 border border-white/5 rounded-xl text-xs font-medium text-onSurface hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                             >
                                 {genre}
                             </button>
                         ))}
                     </div>
                </section>
                
                {/* Ad Banner */}
                <section className="px-6 my-4">
                    <GoogleAd className="rounded-xl" />
                </section>
            </>
          )}

          {/* Search Results / Default List */}
          <section className="px-6">
              <div className="flex justify-between items-end mb-4">
                  <h2 className="text-sm font-bold text-onSurfaceVariant uppercase tracking-widest">
                      {showResults ? 'Results' : 'Recommendations'}
                  </h2>
                  {showResults && (
                      <button onClick={resetFilters} className="text-xs text-primary font-bold">Clear All</button>
                  )}
              </div>

              {isSearching && !isLoadingMore && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                  </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {!isSearching && !searchError && searchResults.map(anime => (
                      <VerticalAnimeCard 
                          key={anime.id} 
                          anime={anime} 
                          onClick={() => navigate(`/detail/${anime.id}`, { state: { anime } })} 
                      />
                  ))}
              </div>

              {isLoadingMore && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      <SkeletonCard />
                      <SkeletonCard />
                  </div>
              )}

              {!isLoadingMore && hasNextPage && <div ref={observerTarget} className="h-10" />}
          </section>
      </div>

      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </div>
  );
};

const MyListScreen = () => {
  const { myList, user } = useAppContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('All');

  const filteredList = myList
    .filter(a => filter === 'All' || a.userStatus === filter)
    .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';
  const totalEpsWatched = myList.reduce((acc, curr) => acc + (curr.userProgress || 0), 0);

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="pt-12 px-6 mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">{greeting},</h1>
        <h2 className="text-2xl font-bold text-primary">{user.name}</h2>
      </div>

      {/* Stats Bubble */}
      <div className="px-6 mb-8">
          <div className="bg-gradient-to-br from-[#2B2930] to-[#1E1C22] p-6 rounded-3xl border border-white/5 shadow-xl flex justify-around items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="text-center z-10">
                  <span className="block text-3xl font-bold text-white">{myList.length}</span>
                  <span className="text-xs text-onSurfaceVariant uppercase tracking-wide">Anime</span>
              </div>
              <div className="w-px h-12 bg-white/10 z-10" />
              <div className="text-center z-10">
                  <span className="block text-3xl font-bold text-primary">{totalEpsWatched}</span>
                  <span className="text-xs text-onSurfaceVariant uppercase tracking-wide">Episodes</span>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6 overflow-x-auto no-scrollbar flex gap-3">
        {['All', ...Object.values(AnimeStatus)].map(status => (
            <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border
                ${filter === status 
                    ? 'bg-white text-black border-white shadow-lg' 
                    : 'bg-surfaceVariant/10 text-onSurfaceVariant border-white/5 hover:bg-surfaceVariant/20'}`}
            >
                {status}
            </button>
        ))}
      </div>

      {/* List */}
      <div className="px-6 space-y-4">
        {filteredList.length === 0 ? (
            <div className="text-center py-20 opacity-50">
                <Ghost size={48} className="mx-auto mb-3 text-surfaceVariant" />
                <p className="text-sm font-medium">No anime found here.</p>
                <button onClick={() => navigate('/')} className="px-6 py-3 bg-primary/20 rounded-full text-primary text-xs font-bold mt-4 hover:bg-primary/30 transition-colors">Find Anime</button>
            </div>
        ) : (
            filteredList.map(anime => (
                <HorizontalAnimeCard 
                    key={anime.id} 
                    anime={anime} 
                    onClick={() => navigate(`/detail/${anime.id}`, { state: { anime } })} 
                />
            ))
        )}
      </div>
    </div>
  );
};

const DetailScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const { addToMyList, myList, updateAnimeStatus, removeFromMyList } = useAppContext();
    const scrollRef = useRef(null);
    const { scrollY } = useScroll({ container: scrollRef });
    
    const headerOpacity = useTransform(scrollY, [0, 200], [1, 0]);
    const headerY = useTransform(scrollY, [0, 300], [0, 150]);

    const animeFromState = location.state?.anime as Anime | undefined;
    const animeId = parseInt(params.id || '0'); 
    const animeFromList = myList.find(a => a.id === animeId);
    
    const [fullAnime, setFullAnime] = useState<Anime | undefined>(animeFromList || animeFromState);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [recommendations, setRecommendations] = useState<Anime[]>([]);
    const [relations, setRelations] = useState<Relation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFullSynopsis, setShowFullSynopsis] = useState(false);

    // Dummy resume state for UI demo
    const resumeEp = Math.floor(Math.random() * 12) + 1;
    const resumeTime = "12:42";

    useEffect(() => {
        const fetchDetails = async () => {
            if (!animeId || isNaN(animeId)) {
                if (!fullAnime) setError("Invalid Anime ID");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            
            try {
                const details = await GeminiService.getAnimeFullDetails(animeId);
                if (details) {
                    setFullAnime(prev => ({ ...prev, ...details }));
                } else if (!fullAnime) {
                    setError("Failed to load anime details.");
                }

                // Continue fetching even if details failed slightly, but stop if major error
                if (details || fullAnime) {
                    const eps = await GeminiService.getAnimeEpisodes(animeId);
                    setEpisodes(eps);

                    await new Promise(resolve => setTimeout(resolve, 300));

                    const [chars, recs, rels] = await Promise.all([
                        GeminiService.getAnimeCharacters(animeId),
                        GeminiService.getAnimeRecommendationsById(animeId),
                        GeminiService.getAnimeRelations(animeId)
                    ]);
                    
                    setCharacters(chars);
                    setRecommendations(recs);
                    setRelations(rels);
                }
            } catch (e) {
                if (!fullAnime) setError("Network error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [animeId]);

    if (loading && !fullAnime) return <div className="min-h-screen flex items-center justify-center text-onSurfaceVariant"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    
    if (error && !fullAnime) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-onSurfaceVariant gap-4 p-6 text-center">
            <AlertCircle size={48} className="text-error mb-2" />
            <p className="text-lg font-medium text-white">{error}</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-surfaceVariant rounded-full text-white font-bold">Go Back</button>
        </div>
    );

    if (!fullAnime) return null; // Should not happen

    const isAdded = !!animeFromList;
    const currentAnime = { ...fullAnime, ...animeFromList };

    const handleWatch = (query?: string) => {
        const q = query || currentAnime.title;
        const url = `https://hianime.to/search?keyword=${encodeURIComponent(q)}`;
        window.open(url, '_blank');
    };

    const handleDelete = () => {
        if (window.confirm("Remove from list?")) {
            removeFromMyList(currentAnime.id);
            // navigate(-1); // Removed to stay on page and toggle UI
        }
    };

    return (
        <div ref={scrollRef} className="h-screen overflow-y-auto bg-background scroll-smooth">
            {/* Parallax Hero */}
            <div className="relative h-[55vh] w-full overflow-hidden">
                <motion.div style={{ y: headerY, opacity: headerOpacity }} className="absolute inset-0">
                    <img 
                        src={currentAnime.imageUrl} 
                        alt={currentAnime.title} 
                        className="w-full h-full object-cover opacity-80"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/600x800/2d2b33/ffffff?text=${encodeURIComponent(currentAnime.title)}`; }} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-transparent h-40" />
                </motion.div>
                
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/10">
                        <ChevronLeft size={24} />
                    </button>
                    <button className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/10">
                        <Share2 size={20} />
                    </button>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pb-16">
                    <h1 className="text-3xl font-bold text-white leading-tight mb-2 drop-shadow-lg">{currentAnime.title}</h1>
                    <div className="flex items-center gap-3 text-xs font-medium text-white/90">
                        <span>{currentAnime.year || 'N/A'}</span>
                        <span className="w-1 h-1 rounded-full bg-white/50" />
                        <span className="uppercase">{currentAnime.status?.split(' ')[0]}</span>
                        <span className="w-1 h-1 rounded-full bg-white/50" />
                        <span className="bg-white/20 px-1.5 py-0.5 rounded border border-white/10">{currentAnime.rating?.split(' ')[0] || 'PG-13'}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="relative z-10 bg-background rounded-t-[32px] -mt-8 px-6 pt-8 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] min-h-screen border-t border-white/5">
                
                {/* Quick Stats Floating Bar */}
                <div className="absolute -top-8 left-6 right-6 bg-[#252329] rounded-2xl shadow-xl border border-white/10 p-4 flex justify-around items-center">
                     <div className="text-center">
                         <div className="text-xs text-onSurfaceVariant uppercase tracking-wide mb-0.5">Rank</div>
                         <div className="text-sm font-bold text-white">#{currentAnime.rank || '-'}</div>
                     </div>
                     <div className="w-px h-8 bg-white/10" />
                     <div className="text-center">
                         <div className="text-xs text-onSurfaceVariant uppercase tracking-wide mb-0.5">Score</div>
                         <div className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                             <Star size={12} fill="currentColor" /> {currentAnime.score}
                         </div>
                     </div>
                     <div className="w-px h-8 bg-white/10" />
                     <div className="text-center">
                         <div className="text-xs text-onSurfaceVariant uppercase tracking-wide mb-0.5">Members</div>
                         <div className="text-sm font-bold text-white">{(currentAnime.popularity || 0).toLocaleString()}</div>
                     </div>
                </div>

                {/* Actions */}
                <div className="mt-12 flex gap-3 mb-8">
                     <button 
                        onClick={() => handleWatch()}
                        className="flex-1 bg-primary hover:bg-primary/90 text-onPrimary font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                         <Play size={20} fill="currentColor" /> Watch Now
                     </button>
                     
                     {!isAdded ? (
                         <button 
                            onClick={() => addToMyList(currentAnime, AnimeStatus.PlanToWatch)}
                            className="px-6 bg-surfaceVariant hover:bg-surfaceVariant/80 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center gap-2 border border-white/5"
                         >
                             <Plus size={24} />
                         </button>
                     ) : (
                         <div className="flex gap-2">
                             <div className="relative">
                                <select 
                                    className="h-full pl-4 pr-8 bg-surfaceVariant text-white font-bold rounded-2xl appearance-none outline-none border border-white/5 text-sm"
                                    value={currentAnime.userStatus}
                                    onChange={(e) => updateAnimeStatus(currentAnime.id, e.target.value as AnimeStatus)}
                                >
                                    {Object.values(AnimeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
                             </div>
                             <button onClick={handleDelete} className="px-4 bg-surfaceVariant/50 text-error rounded-2xl hover:bg-error/20 transition-colors">
                                 <Trash2 size={20} />
                             </button>
                         </div>
                     )}
                </div>

                {/* Resume Progress (Mock) */}
                {isAdded && currentAnime.userStatus === AnimeStatus.Watching && (
                    <div className="mb-8 bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handleWatch()}>
                        <div>
                            <span className="text-xs text-primary font-bold uppercase tracking-wider block mb-1">Continue Watching</span>
                            <span className="text-sm font-medium text-white">Episode {resumeEp} • Resume from {resumeTime}</span>
                        </div>
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <Play size={16} fill="currentColor" />
                        </div>
                    </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-surfaceVariant/5 p-4 rounded-2xl border border-white/5">
                         <span className="text-[10px] text-onSurfaceVariant uppercase tracking-wide block mb-1">Format</span>
                         <span className="text-sm font-bold text-white">{currentAnime.type || 'TV'}</span>
                     </div>
                     <div className="bg-surfaceVariant/5 p-4 rounded-2xl border border-white/5">
                         <span className="text-[10px] text-onSurfaceVariant uppercase tracking-wide block mb-1">Studio</span>
                         <span className="text-sm font-bold text-white truncate">{currentAnime.studios?.[0] || 'Unknown'}</span>
                     </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {currentAnime.genres?.map(g => (
                        <span key={g} className="px-3 py-1.5 rounded-xl bg-surfaceVariant/20 text-xs font-medium text-onSurfaceVariant border border-white/5">
                            {g}
                        </span>
                    ))}
                </div>

                {/* Synopsis */}
                <div className="mb-10">
                    <h3 className="text-base font-bold text-white mb-3">Synopsis</h3>
                    <p className={`text-sm text-onSurfaceVariant leading-7 font-light ${!showFullSynopsis && 'line-clamp-4'}`}>
                        {currentAnime.synopsis}
                    </p>
                    {currentAnime.synopsis && currentAnime.synopsis.length > 200 && (
                        <button onClick={() => setShowFullSynopsis(!showFullSynopsis)} className="text-xs text-primary font-bold mt-2">
                            {showFullSynopsis ? 'Show Less' : 'Read More'}
                        </button>
                    )}
                </div>

                {/* Ad Banner */}
                <div className="mb-8 px-1">
                    <GoogleAd className="rounded-2xl border border-white/5" />
                </div>

                {/* Characters */}
                {characters.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-base font-bold text-white mb-4">Characters</h3>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {characters.map(char => (
                                <div key={char.id} className="w-24 shrink-0">
                                    <div className="relative mb-2">
                                        <img src={char.imageUrl} alt={char.name} className="w-24 h-24 rounded-2xl object-cover border border-white/5" />
                                    </div>
                                    <div className="text-xs font-medium text-white truncate">{char.name}</div>
                                    <div className="text-[10px] text-onSurfaceVariant/60 truncate">{char.role}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Episodes */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-white">Episodes</h3>
                        <span className="text-xs text-onSurfaceVariant">{episodes.length} eps</span>
                    </div>
                    <div className="space-y-3">
                        {episodes.slice(0, showFullSynopsis ? 50 : 4).map(ep => (
                            <div key={ep.mal_id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => handleWatch()}>
                                <div className="relative w-28 aspect-video bg-surfaceVariant/20 rounded-lg overflow-hidden shrink-0">
                                     {/* Mock thumbnail as API doesn't always provide ep thumb */}
                                     <img src={currentAnime.imageUrl} className="w-full h-full object-cover opacity-50" alt="ep" />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white group-hover:bg-primary group-hover:scale-110 transition-all">
                                             <Play size={12} fill="currentColor" />
                                         </div>
                                     </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-white mb-0.5 line-clamp-1">{ep.title}</div>
                                    <div className="text-[10px] text-onSurfaceVariant">Episode {ep.episode} • 24m</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Related Media */}
                 {relations.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-base font-bold text-white mb-4">Related Media</h3>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {relations.map((rel) => (
                                rel.entry.map(entry => (
                                    <div key={`${rel.relation}-${entry.mal_id}`} className="shrink-0 bg-surfaceVariant/5 px-4 py-3 rounded-xl border border-white/5 min-w-[140px]">
                                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 block">{rel.relation}</span>
                                        <span className="text-xs font-medium text-white line-clamp-2">{entry.name}</span>
                                    </div>
                                ))
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-base font-bold text-white mb-4">More Like This</h3>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
                            {recommendations.map(rec => (
                                <div 
                                    key={rec.id} 
                                    onClick={() => navigate(`/detail/${rec.id}`, { state: { anime: rec } })}
                                    className="w-32 shrink-0 cursor-pointer group"
                                >
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2">
                                        <img src={rec.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt={rec.title} />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                                            <Star size={8} fill="currentColor" /> {rec.score}
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-medium text-white line-clamp-2 leading-tight">{rec.title}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Login Screen ---

const LoginScreen = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = () => {
    login();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="mb-8 relative">
             <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
                 <Sparkles size={48} className="text-white" />
             </div>
             <div className="absolute -bottom-2 -right-2 bg-[#252329] p-2 rounded-xl border border-white/10 shadow-lg -rotate-6">
                 <Flame size={24} className="text-orange-500" fill="currentColor" />
             </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Anime Discovery</h1>
        <p className="text-onSurfaceVariant mb-10 max-w-[260px]">
            Track your favorite anime, discover new gems, and keep your watchlist organized.
        </p>

        <button 
            onClick={handleLogin}
            className="w-full max-w-xs bg-white text-black font-bold py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <UserIcon size={14} className="text-white" />
            </div>
            <span>Continue as Guest</span>
        </button>

        <p className="mt-8 text-[10px] text-onSurfaceVariant/40">
            Powered by Jikan API (Unofficial MyAnimeList)
        </p>
    </div>
  );
};

// --- Main App Shell ---

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>({
    name: 'Otaku User',
    avatarUrl: '',
    isLoggedIn: false,
  });
  
  const [myList, setMyList] = useState<Anime[]>(() => {
    const saved = localStorage.getItem('myAnimeList');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQueryState] = useState('');
  const [searchFilters, setSearchFilters] = useState<GeminiService.SearchFilters>({ sfw: true });
  const [searchResults, setSearchResultsState] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  
  const lastSearchedParams = useRef<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    localStorage.setItem('myAnimeList', JSON.stringify(myList));
  }, [myList]);

  // Initial Data Load
  useEffect(() => {
      GeminiService.getTrendingAnime().then(setTrendingAnime);
      // Also load default recs for discover page bottom
      GeminiService.getAnimeRecommendations().then(data => {
          setSearchResultsState(data);
      });
  }, []);

  const setSearchQuery = (q: string) => {
      setSearchQueryState(q);
      if (q.length <= 2 && Object.keys(searchFilters).length <= 1) {
          setHasNextPage(false);
          setSearchError(null);
      }
  };

  const resetFilters = () => {
      setSearchFilters({ sfw: true });
      setSearchQuery('');
      GeminiService.getAnimeRecommendations().then(setSearchResultsState);
  };

  const applyPreset = (preset: FilterPreset) => {
      let newFilters: GeminiService.SearchFilters = { sfw: true };
      if (preset === 'Top Rated') newFilters.order_by = 'score';
      if (preset === 'Trending') newFilters.order_by = 'popularity';
      if (preset === 'New Releases') { newFilters.status = 'airing'; newFilters.order_by = 'popularity'; }
      if (preset === 'Movies') newFilters.type = 'movie';
      if (preset === 'Classics') { newFilters.end_year = 2005; newFilters.order_by = 'popularity'; }
      
      setSearchFilters(newFilters);
  }

  const loadMoreResults = async () => {
      if (!hasNextPage || isLoadingMore) return;
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      try {
        const result = await GeminiService.searchAnime(searchQuery, nextPage, searchFilters);
        if (!result.error) {
            setSearchResultsState(prev => [...prev, ...result.data]);
            setHasNextPage(result.hasNextPage);
            setCurrentPage(nextPage);
        }
      } catch (e) {} finally { setIsLoadingMore(false); }
  };
  
  const handleNewSearch = (results: Anime[], hasNext: boolean) => {
      setSearchResultsState(results);
      setHasNextPage(hasNext);
      setCurrentPage(1);
  };

  const login = () => { setUser({ ...user, isLoggedIn: true }); };
  const logout = () => { setUser({ ...user, isLoggedIn: false }); setMyList([]); };

  const addToMyList = (anime: Anime, status: AnimeStatus) => {
    if (myList.some(a => a.id === anime.id)) return;
    setMyList(prev => [...prev, { ...anime, userStatus: status, lastUpdated: Date.now(), userProgress: 0 }]);
  };

  const removeFromMyList = (animeId: number) => {
    setMyList(prev => prev.filter(a => a.id !== animeId));
  };

  const updateAnimeStatus = (animeId: number, status: AnimeStatus, score?: number) => {
      setMyList(prev => prev.map(a => {
          if (a.id === animeId) {
              return { ...a, userStatus: status, userScore: score ?? a.userScore, lastUpdated: Date.now() };
          }
          return a;
      }));
  };

  return (
    <AppContext.Provider value={{ 
        user, myList, login, logout, addToMyList, removeFromMyList, updateAnimeStatus,
        searchQuery, setSearchQuery, 
        searchResults, setSearchResults: setSearchResultsState, 
        isSearching, setIsSearching,
        loadMoreResults, hasNextPage, isLoadingMore,
        handleNewSearch,
        searchError, setSearchError,
        searchFilters, setSearchFilters, resetFilters, applyPreset,
        lastSearchedParams, trendingAnime
    }}>
      {children}
    </AppContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAppContext();
    if (!user.isLoggedIn) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const App = () => {
  return (
    <HashRouter>
      <AppProvider>
        <div className="max-w-md mx-auto bg-background min-h-screen shadow-2xl overflow-hidden relative font-sans text-onSurface selection:bg-primary/30">
            <Routes>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/" element={<ProtectedRoute><DiscoverScreen /></ProtectedRoute>} />
              <Route path="/list" element={<ProtectedRoute><MyListScreen /></ProtectedRoute>} />
              <Route path="/detail/:id" element={<ProtectedRoute><DetailScreen /></ProtectedRoute>} />
            </Routes>
            <BottomNav />
        </div>
      </AppProvider>
    </HashRouter>
  );
};

export default App;