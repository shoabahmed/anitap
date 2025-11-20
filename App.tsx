import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Search as SearchIcon, User as UserIcon, LogOut, ChevronDown, ChevronLeft, Play, Plus, Tv, AlertCircle, SlidersHorizontal, Sparkles, Flame, X, Check, ArrowUpDown, Filter, Ghost, Calendar, Star, Eye, EyeOff, Share2, Clock, Users, Trophy, Film, Info, Heart, MonitorPlay, Youtube, Trash2, Link as LinkIcon, Compass, LayoutGrid, List as ListIcon, ExternalLink, Loader2, Sparkle, WifiOff, Rss, CheckCircle2, Mail } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';

import { Anime, AnimeStatus, Character, Episode, Relation, FilterPreset, RecentEpisode, NewsItem, AuthView } from './types';
import * as GeminiService from './services/geminiService'; 
import * as LiveChartService from './services/liveChartService';
import * as AniListService from './services/anilist';
import * as NewsService from './services/news';
import NewsCard from './components/NewsCard';
import Layout from './components/Layout';
import AuthModal from './components/AuthModal';
import TrendingScreen from './pages/Trending';
import StudioScreen from './pages/Studio';
import GoogleAd from './components/GoogleAd';
import { VerticalAnimeCard, HorizontalAnimeCard, SkeletonCard } from './components/AnimeCard';
import { TrendingSlider } from './components/TrendingSlider';

// --- Constants ---

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity', sort: 'asc' },
  { label: 'Highest Rated', value: 'score', sort: 'desc' },
  { label: 'Newest', value: 'start_date', sort: 'desc' },
  { label: 'Oldest', value: 'start_date', sort: 'asc' },
  { label: 'Title (A-Z)', value: 'title', sort: 'asc' },
  { label: 'Episodes (Most)', value: 'episodes', sort: 'desc' },
];

// --- Utility Functions ---

function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// Interleave News into Anime array: 1 News Item after every 6 Anime Items
function interleaveData(animeList: Anime[], newsList: NewsItem[]): (Anime | NewsItem)[] {
    if (!newsList.length) return animeList;

    const combined: (Anime | NewsItem)[] = [];
    let animeCount = 0;
    let newsIndex = 0;

    animeList.forEach((item) => {
        combined.push(item);
        animeCount++;

        // After every 6th anime, insert a news item if available
        if (animeCount % 6 === 0) {
            if (newsIndex < newsList.length) {
                combined.push(newsList[newsIndex]);
                // Cycle news if we run out to keep the pattern
                newsIndex = (newsIndex + 1) % newsList.length; 
            }
        }
    });

    return combined;
}

// Helper to remove duplicates based on ID (for Anime) or Link (for News)
function deduplicateItems(currentItems: (Anime | NewsItem)[], newItems: (Anime | NewsItem)[]): (Anime | NewsItem)[] {
    const seenIds = new Set<number | string>();
    
    // Index existing items
    currentItems.forEach(item => {
        if ('id' in item) seenIds.add(item.id);
        else if ('link' in item) seenIds.add(item.link);
    });

    const filteredNewItems = newItems.filter(item => {
        const key = 'id' in item ? item.id : item.link;
        if (seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
    });

    return filteredNewItems;
}

// --- Scroll Helper ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- Context ---

interface AppContextType {
  session: Session | null;
  user: User | null;
  myList: Anime[];
  loadingAuth: boolean;
  addToMyList: (anime: Anime, status: AnimeStatus) => Promise<void>;
  removeFromMyList: (listId: number) => Promise<void>;
  updateAnimeStatus: (listId: number, status: AnimeStatus, score?: number) => Promise<void>;
  updateProgress: (listId: number, progress: number) => Promise<void>;
  
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: (Anime | NewsItem)[];
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
  
  isOnline: boolean;

  isAuthModalOpen: boolean;
  openAuthModal: (view?: AuthView) => void;
  closeAuthModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- Components ---

const NetworkStatus = () => {
    const { isOnline } = useAppContext();
    if (isOnline) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-80 bg-error text-[#21005d] p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-5 fade-in duration-300 border border-error/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full text-onPrimary">
                    <WifiOff size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <p className="font-bold text-sm text-onPrimary leading-tight">You are currently offline</p>
                    <p className="text-[10px] text-onPrimary/80 font-medium uppercase tracking-wide">Content may be outdated</p>
                </div>
            </div>
            <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-white/20 rounded-xl text-xs font-bold text-onPrimary hover:bg-white/30 active:scale-95 transition-all"
            >
                Retry
            </button>
        </div>
    );
};

const FilterDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { searchFilters, setSearchFilters, resetFilters, applyPreset, isOnline } = useAppContext();
    const [localFilters, setLocalFilters] = useState(searchFilters);
    
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
        if (!isOnline) return;
        setSearchFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({ sfw: true });
        resetFilters();
        onClose();
    };

    const handlePresetClick = (preset: FilterPreset) => {
        if (!isOnline) return;
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
                                            disabled={!isOnline}
                                            className={`px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 active:scale-95 transition-all disabled:opacity-50`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </section>

                             {/* Genres */}
                             {groupsOrder.map(group => (
                                <section key={group}>
                                    <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest mb-3">{group}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedGenres[group]?.map(genre => (
                                            <button
                                                key={genre.id}
                                                onClick={() => toggleGenre(genre.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                                                ${(localFilters.genres || []).includes(genre.id)
                                                    ? 'bg-primary text-onPrimary border-primary'
                                                    : 'bg-surfaceVariant/10 text-onSurface border-white/5 hover:border-primary/50'
                                                }`}
                                            >
                                                {genre.name}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ))}
                            
                            {/* Sorting */}
                            <section>
                                <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest mb-3">Sort By</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {SORT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.label}
                                            onClick={() => setLocalFilters(prev => ({ ...prev, order_by: opt.value as any, sort: opt.sort as any }))}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between
                                            ${localFilters.order_by === opt.value && localFilters.sort === opt.sort
                                                ? 'bg-secondary/20 text-secondary border-secondary'
                                                : 'bg-surfaceVariant/5 text-onSurfaceVariant border-white/5'
                                            }`}
                                        >
                                            {opt.label}
                                            {localFilters.order_by === opt.value && localFilters.sort === opt.sort && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Type */}
                            <section>
                                <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-widest mb-3">Format</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['tv', 'movie', 'ova', 'special'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setLocalFilters(prev => ({ ...prev, type: prev.type === type ? undefined : type as any }))}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase border
                                            ${localFilters.type === type 
                                                ? 'bg-tertiary/20 text-tertiary border-tertiary' 
                                                : 'bg-surfaceVariant/5 text-onSurfaceVariant border-white/5'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </section>

                        </div>

                        <div className="p-6 bg-[#201E24] border-t border-white/5 flex gap-4 z-20 pb-10">
                            <button onClick={handleReset} className="flex-1 py-3.5 rounded-xl font-bold text-sm text-onSurfaceVariant bg-surfaceVariant/20 hover:bg-surfaceVariant/30 transition-colors">Reset</button>
                            <button 
                                onClick={handleApply} 
                                disabled={!isOnline}
                                className="flex-[2] bg-primary text-onPrimary py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                            >
                                Show Results
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

const JustAiredSection: React.FC<{ episodes: RecentEpisode[] }> = ({ episodes }) => {
    if (!episodes.length) return null;

    return (
        <section className="mb-6">
            <div className="px-6 mb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Rss size={14} className="text-primary" />
                    <h2 className="text-sm font-bold text-onSurfaceVariant uppercase tracking-widest">Just Aired</h2>
                </div>
                <span className="text-[10px] text-onSurfaceVariant/60 bg-white/5 px-2 py-0.5 rounded">LiveChart.me</span>
            </div>
            <div className="flex gap-3 px-6 overflow-x-auto no-scrollbar pb-2">
                {episodes.map((ep) => (
                    <a 
                        key={ep.id}
                        href={ep.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 w-[160px] flex flex-col group"
                    >
                        <div className="aspect-video bg-surfaceVariant/10 rounded-xl overflow-hidden mb-2 relative border border-white/5">
                            {ep.thumbnail ? (
                                <img src={ep.thumbnail} alt={ep.animeTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surfaceVariant/20">
                                    <Play size={24} className="text-white/20" />
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                                EP {ep.episodeNumber}
                            </div>
                        </div>
                        <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">{ep.animeTitle}</h3>
                        <div className="text-[10px] text-onSurfaceVariant flex items-center gap-1">
                            <Clock size={10} />
                            {formatTimeAgo(ep.timestamp)}
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
};

interface LegalSource {
    name: string;
    url: string;
    type: 'youtube' | 'service';
    icon: React.ElementType;
}

// --- Pages ---

const DiscoverScreen = () => {
  const { 
      searchQuery, setSearchQuery, 
      searchResults, isSearching, 
      setIsSearching,
      loadMoreResults, hasNextPage, isLoadingMore,
      handleNewSearch, searchError, setSearchError,
      searchFilters, setSearchFilters, resetFilters, lastSearchedParams,
      trendingAnime, isOnline, openAuthModal
  } = useAppContext();
  
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const observerTarget = useRef(null);
  const [recentEpisodes, setRecentEpisodes] = useState<RecentEpisode[]>([]);

  useEffect(() => {
      const fetchRecent = async () => {
          if (isOnline) {
              const recents = await LiveChartService.getRecentEpisodes();
              setRecentEpisodes(recents);
          }
      };
      fetchRecent();
  }, [isOnline]);
  
  // Handle Genre Chip Click
  const handleGenreClick = (genreId: number) => {
      if (!isOnline) return;
      // Apply genre filter instead of searching by name
      setSearchFilters({ ...searchFilters, genres: [genreId] });
      setIsFilterOpen(true); // Open drawer to show the applied filter context
  }

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(async () => {
        const paramsKey = JSON.stringify({ q: searchQuery, f: searchFilters });
        if (paramsKey === lastSearchedParams.current && searchResults.length > 0 && !searchError) return;
        
        if (searchQuery.length >= 3 || Object.keys(searchFilters).length > 1) {
             if (!isOnline) {
                 setSearchError("Unable to connect to AI services. Please check your internet.");
                 return;
             }

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
    }, 800); // Increased debounce for Jikan
    return () => clearTimeout(timer);
  }, [searchQuery, searchFilters, isOnline]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore && !isSearching && isOnline) {
          loadMoreResults();
        }
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, isSearching, loadMoreResults, isOnline]);

  const hasActiveFilters = (searchFilters.genres && searchFilters.genres.length > 0) ||
    searchFilters.type ||
    searchFilters.status ||
    searchFilters.order_by ||
    searchFilters.rating ||
    searchFilters.min_score ||
    searchFilters.start_year ||
    searchFilters.sfw === false;

  const showResults = searchQuery.length > 0 || Object.keys(searchFilters).length > 1;

  return (
    // Removed min-h-screen and pb-24 as Layout handles scrolling now
    <div className="bg-background flex flex-col min-h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#1E1C22]/95 backdrop-blur-xl px-6 pt-4 pb-2 border-b border-white/5 shadow-md">
          <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">Discover</h1>
              <button onClick={() => navigate('/list')} className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 md:hidden">
                  <UserIcon size={16} className="text-primary" />
              </button>
          </div>
          <div className="flex gap-3 mb-2">
              <div className="relative flex-1 group">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-onSurfaceVariant group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={!isOnline}
                      placeholder="Search anime..."
                      className="w-full bg-surfaceVariant/10 border border-white/5 text-onSurface rounded-2xl pl-11 pr-10 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-onSurfaceVariant/50 disabled:opacity-50"
                  />
                  {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-onSurfaceVariant hover:text-onSurface p-1">
                          <X size={14} />
                      </button>
                  )}
              </div>
              <button 
                onClick={() => setIsFilterOpen(true)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all active:scale-95
                ${Object.keys(searchFilters).length > 1 
                    ? 'bg-primary text-onPrimary border-primary shadow-lg shadow-primary/20' 
                    : 'bg-surfaceVariant/10 text-onSurfaceVariant border-white/5 hover:bg-surfaceVariant/20'}`}
              >
                  <SlidersHorizontal size={20} />
              </button>
          </div>

          {/* Active Filters & Reset Row */}
          <AnimatePresence>
              {hasActiveFilters && (
                  <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1"
                  >
                      <button 
                          onClick={resetFilters}
                          className="shrink-0 px-3 py-1.5 bg-error/10 text-error border border-error/20 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 hover:bg-error/20 transition-colors"
                      >
                          <Trash2 size={12} />
                          Clear All
                      </button>
                      
                      {/* Sort Chip */}
                      {searchFilters.order_by && (
                           <span className="shrink-0 px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] text-primary font-medium flex items-center gap-1">
                              Sort: {SORT_OPTIONS.find(s => s.value === searchFilters.order_by)?.label || searchFilters.order_by}
                           </span>
                      )}
                      
                      {/* Genre Chips */}
                      {searchFilters.genres?.map(gId => (
                           <span key={gId} className="shrink-0 px-2 py-1 bg-surfaceVariant/20 border border-white/5 rounded-lg text-[10px] text-onSurfaceVariant font-medium whitespace-nowrap">
                              {GeminiService.GENRE_LIST.find(g => g.id === gId)?.name}
                           </span>
                      ))}
                      
                      {/* Type Chip */}
                      {searchFilters.type && (
                           <span className="shrink-0 px-2 py-1 bg-surfaceVariant/20 border border-white/5 rounded-lg text-[10px] text-onSurfaceVariant font-medium uppercase">
                              {searchFilters.type}
                           </span>
                      )}

                      {/* Status Chip */}
                      {searchFilters.status && (
                           <span className="shrink-0 px-2 py-1 bg-surfaceVariant/20 border border-white/5 rounded-lg text-[10px] text-onSurfaceVariant font-medium uppercase">
                              {searchFilters.status}
                           </span>
                      )}
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      <div className="flex-1 space-y-8 pt-4">
          
          {/* Discovery Content (Only show if NOT searching) */}
          {!showResults && (
            <>
                {/* Trending Carousel */}
                <TrendingSlider 
                    animeList={trendingAnime} 
                    onSelect={(a) => navigate(`/detail/${a.id}`, { state: { anime: a } })} 
                />

                {/* Just Aired (RSS) */}
                <JustAiredSection episodes={recentEpisodes} />

                {/* Genre Chips */}
                <section className="px-6">
                     <h2 className="text-sm font-bold text-onSurfaceVariant uppercase tracking-widest mb-3">Browse Categories</h2>
                     <div className="flex flex-wrap gap-2">
                         {GeminiService.GENRE_LIST.filter(g => g.group === 'Mainstream').map(genre => (
                             <button 
                                key={genre.id} 
                                onClick={() => handleGenreClick(genre.id)}
                                disabled={!isOnline}
                                className="px-4 py-2 bg-surfaceVariant/10 border border-white/5 rounded-xl text-xs font-medium text-onSurface hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-50"
                             >
                                 {genre.name}
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
              </div>

              {isSearching && !isLoadingMore && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                  </div>
              )}
                
              {/* Error Display inside content area */}
              {searchError && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                      <AlertCircle size={32} className="text-error mb-2" />
                      <p className="text-sm font-medium text-white">{searchError}</p>
                  </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {!isSearching && !searchError && searchResults.map((item, index) => {
                      // Type Guard to render correct card
                      // Anime objects ALWAYS have a numeric 'id', NewsItems do not.
                      if ('id' in item) {
                          return (
                              <VerticalAnimeCard 
                                  key={`anime-${item.id}-${index}`} 
                                  anime={item as Anime} 
                                  onClick={() => navigate(`/detail/${(item as Anime).id}`, { state: { anime: item } })} 
                              />
                          );
                      } else {
                          const news = item as NewsItem;
                          // Use news link as key to avoid re-render issues
                          return <NewsCard key={news.link || `news-${index}`} news={news} />;
                      }
                  })}
              </div>

              {isLoadingMore && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
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
  const { myList, user, loadingAuth, openAuthModal } = useAppContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('All');

  if (loadingAuth) {
    return (
        <div className="min-h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) {
    return (
        <div className="min-h-full flex flex-col items-center justify-center text-center p-6">
            <UserIcon size={48} className="text-primary mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Your Watchlist</h2>
            <p className="text-onSurfaceVariant max-w-sm mb-6">
                Sign in to sync your personal anime list across all your devices and manage your progress.
            </p>
            <button 
                onClick={() => openAuthModal('signIn')}
                className="px-8 py-3 bg-primary text-onPrimary rounded-full font-bold shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-transform"
            >
                Sign In
            </button>
        </div>
    )
  }

  const filteredList = myList
    .filter(a => filter === 'All' || a.userStatus === filter)
    .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';
  const totalEpsWatched = myList.reduce((acc, curr) => acc + (curr.userProgress || 0), 0);

  return (
    // Removed min-h-screen as layout handles it
    <div className="bg-background min-h-full">
      {/* Header */}
      <div className="pt-12 px-6 mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">{greeting},</h1>
        <h2 className="text-2xl font-bold text-primary truncate max-w-full">{user?.email}</h2>
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
      <div className="px-6 space-y-4 grid grid-cols-1 lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {filteredList.length === 0 ? (
            <div className="text-center py-20 opacity-50 col-span-full">
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
    const { user, addToMyList, myList, updateAnimeStatus, removeFromMyList, updateProgress, isOnline, openAuthModal } = useAppContext();
    const scrollRef = useRef<HTMLDivElement>(null);
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
    const [showAllEpisodes, setShowAllEpisodes] = useState(false);

    // Watch Options State
    const [isWatchDropdownOpen, setIsWatchDropdownOpen] = useState(false);
    const [legalSources, setLegalSources] = useState<LegalSource[]>([]);
    const [isCheckingSources, setIsCheckingSources] = useState(false);
    const watchDropdownRef = useRef<HTMLDivElement>(null);

    // Resume state
    const resumeEp = animeFromList?.userProgress ? animeFromList.userProgress + 1 : 1;

    // Reset scroll on navigate
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
        // Reset view states
        setShowFullSynopsis(false);
        setShowAllEpisodes(false);
    }, [animeId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (watchDropdownRef.current && !watchDropdownRef.current.contains(event.target as Node)) {
                setIsWatchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const checkLegalAvailability = async (title: string, isMounted: boolean) => {
        if (!isOnline || !isMounted) return;

        setIsCheckingSources(true);
        // Simulate network delay for checking availability
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (!isMounted) return;

        const encodedTitle = encodeURIComponent(title);
        setLegalSources([
            { name: 'Muse Asia', url: `https://www.youtube.com/results?search_query=Muse+Asia+${encodedTitle}`, type: 'youtube', icon: Youtube },
            { name: 'Ani-One Asia', url: `https://www.youtube.com/results?search_query=Ani-One+Asia+${encodedTitle}`, type: 'youtube', icon: Youtube },
            { name: 'Netflix', url: `https://www.netflix.com/search?q=${encodedTitle}`, type: 'service', icon: MonitorPlay },
            { name: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${encodedTitle}`, type: 'service', icon: ExternalLink },
        ]);
        setIsCheckingSources(false);
    };

    useEffect(() => {
        let isMounted = true;

        const fetchDetails = async () => {
            // Reset Logic
            setLoading(true);
            setError(null);
            setEpisodes([]); 
            setCharacters([]);
            setRecommendations([]);
            setRelations([]);

            if (!animeId || isNaN(animeId)) {
                if(isMounted) setLoading(false);
                return;
            }

            // Phase 1: Critical Data
            let details: Anime | null = null;
            try {
                 if (isOnline) {
                     details = await GeminiService.getAnimeFullDetails(animeId);
                     if (details && isMounted) {
                         setFullAnime(prev => ({ ...(prev || {}), ...details }));
                         checkLegalAvailability(details.title, isMounted);
                     } else if (!fullAnime && isMounted) {
                         setError("Failed to load details.");
                     }
                 }
            } catch(e) {
                 if(isMounted && !fullAnime) setError("Network error.");
            } finally {
                if(isMounted) setLoading(false);
            }

            // Phase 2: Secondary Data (Sequential to prevent Rate Limit 429)
            // We only fetch if online and we have the base anime data
            if (isOnline && isMounted && (details || fullAnime)) {
                try {
                    // Episodes
                    if (isMounted) {
                        const eps = await GeminiService.getAnimeEpisodes(animeId);
                        if (isMounted && eps.length) setEpisodes(eps);
                    }
                    
                    // Characters
                    if (isMounted) {
                        const chars = await GeminiService.getAnimeCharacters(animeId);
                        if (isMounted && chars.length) setCharacters(chars);
                    }
                    
                    // Recs
                    if (isMounted) {
                        const recs = await GeminiService.getAnimeRecommendationsById(animeId);
                        if (isMounted && recs.length) setRecommendations(shuffleArray(recs));
                    }
                    
                    // Relations
                    if (isMounted) {
                        const rels = await GeminiService.getAnimeRelations(animeId);
                        if (isMounted && rels.length) setRelations(rels);
                    }
                } catch (e) {
                    // Secondary data failure is non-critical, ignore
                    console.warn("Secondary data fetch incomplete", e);
                }
            }
        };
        
        fetchDetails();
        
        return () => { isMounted = false; };
    }, [animeId, isOnline]);

    if (loading && !fullAnime) return <div className="min-h-full flex items-center justify-center text-onSurfaceVariant"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    
    if (error && !fullAnime) return (
        <div className="min-h-full flex flex-col items-center justify-center text-onSurfaceVariant gap-4 p-6 text-center">
            <AlertCircle size={48} className="text-error mb-2" />
            <p className="text-lg font-medium text-white">{error}</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-surfaceVariant rounded-full text-white font-bold">Go Back</button>
        </div>
    );

    if (!fullAnime) return null;

    const isAdded = !!animeFromList;
    const currentAnime = { ...fullAnime, ...animeFromList };

    const handleWatch = (query?: string) => {
        const q = query || currentAnime.title;
        const url = `https://hianime.to/search?keyword=${encodeURIComponent(q)}`;
        window.open(url, '_blank');
    };

    const handleDelete = () => {
        if (!user) {
            openAuthModal('signIn');
            return;
        }
        if (window.confirm("Remove from list?") && currentAnime.list_id) {
            removeFromMyList(currentAnime.list_id);
        }
    };
    
    const toggleEpisodeWatched = (epNum: number) => {
        if (!user) {
            openAuthModal('signIn');
            return;
        }
        if (!isAdded) {
            addToMyList(currentAnime, AnimeStatus.Watching);
        } else if (currentAnime.list_id) {
            updateProgress(currentAnime.list_id, epNum);
        }
    };

    return (
        // Changed h-[100dvh] to h-full to respect the Layout's flex container
        <div ref={scrollRef} className="h-full overflow-y-auto bg-background scroll-smooth relative">
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
                <div className="absolute -top-8 left-6 right-6 bg-[#252329] rounded-2xl shadow-xl border border-white/10 p-4 flex justify-around items-center max-w-2xl mx-auto">
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

                {/* Content Wrapper for Desktop Centering */}
                <div className="max-w-4xl mx-auto">
                    {/* Actions */}
                    <div className="mt-12 flex gap-3 mb-8 z-50 relative">
                        {/* Watch Options Dropdown */}
                        <div className="flex-1 relative" ref={watchDropdownRef}>
                            <button 
                                onClick={() => setIsWatchDropdownOpen(!isWatchDropdownOpen)}
                                className="w-full bg-primary hover:bg-primary/90 text-onPrimary font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Play size={20} fill="currentColor" /> Watch Options <ChevronDown size={16} className={`transition-transform duration-200 ${isWatchDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isWatchDropdownOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-[#2B2930] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 p-2 flex flex-col gap-1"
                                    >
                                        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-onSurfaceVariant/60 font-bold">Streaming Sources</div>
                                        
                                        {/* Unofficial */}
                                        <button 
                                            onClick={() => handleWatch()}
                                            className="flex items-center gap-3 w-full px-3 py-3 hover:bg-white/10 rounded-xl transition-colors text-left group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <Play size={14} fill="currentColor" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white">HiAnime</div>
                                                <div className="text-[10px] text-onSurfaceVariant">Unofficial • Free</div>
                                            </div>
                                            <ExternalLink size={14} className="text-onSurfaceVariant/50" />
                                        </button>

                                        <div className="h-px bg-white/5 my-1 mx-2" />
                                        
                                        {/* Legal Sources */}
                                        {isCheckingSources ? (
                                            <div className="py-4 flex flex-col items-center justify-center text-onSurfaceVariant/50 gap-2">
                                                <Loader2 size={20} className="animate-spin text-primary" />
                                                <span className="text-xs">Checking availability...</span>
                                            </div>
                                        ) : (
                                            legalSources.map((source) => (
                                                <a 
                                                    key={source.name}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-white/10 rounded-xl transition-colors text-left group"
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${source.type === 'youtube' ? 'bg-red-500/20 text-red-500 group-hover:bg-red-600 group-hover:text-white' : 'bg-surfaceVariant text-onSurfaceVariant group-hover:bg-white group-hover:text-black'}`}>
                                                        <source.icon size={16} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-white">{source.name}</div>
                                                        <div className="text-[10px] text-onSurfaceVariant">Official • Legal</div>
                                                    </div>
                                                    <ExternalLink size={14} className="text-onSurfaceVariant/50" />
                                                </a>
                                            ))
                                        )}

                                        {!isOnline && !isCheckingSources && legalSources.length === 0 && (
                                            <div className="py-3 px-4 text-center text-xs text-onSurfaceVariant/50">
                                                Check internet to see legal sources
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {!isAdded ? (
                            <button 
                                onClick={() => {
                                    if (!user) openAuthModal('signIn');
                                    else addToMyList(currentAnime, AnimeStatus.PlanToWatch);
                                }}
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
                                        onChange={(e) => currentAnime.list_id && updateAnimeStatus(currentAnime.list_id, e.target.value as AnimeStatus)}
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
                                <span className="text-sm font-medium text-white">Episode {resumeEp}</span>
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
                            <div className="flex flex-wrap gap-2">
                                {currentAnime.studios?.length ? (
                                    currentAnime.studios.map(studio => (
                                        <Link 
                                            key={studio.id} 
                                            to={`/studio/${studio.id}`}
                                            className="text-sm font-bold text-primary hover:underline"
                                        >
                                            {studio.name}
                                        </Link>
                                    ))
                                ) : (
                                    <span className="text-sm font-bold text-white">Unknown</span>
                                )}
                            </div>
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
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-onSurfaceVariant">{episodes.length > 0 ? `${episodes.length} eps` : ''}</span>
                                <button 
                                    onClick={() => setShowAllEpisodes(!showAllEpisodes)} 
                                    className="text-xs font-bold text-primary hover:text-primary/80"
                                >
                                    {showAllEpisodes ? 'Show Less' : 'Show All'}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {episodes.slice(0, showAllEpisodes ? episodes.length : 5).map(ep => {
                                const epNum = typeof ep.episode === 'number' ? ep.episode : parseInt(ep.episode as string);
                                const isWatched = (currentAnime.userProgress || 0) >= epNum;
                                
                                return (
                                    <div key={ep.mal_id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                                        <div 
                                            className="relative w-28 aspect-video bg-surfaceVariant/20 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                                            onClick={() => handleWatch()}
                                        >
                                            {/* Mock thumbnail as API doesn't always provide ep thumb */}
                                            <img src={currentAnime.imageUrl} className="w-full h-full object-cover opacity-50" alt="ep" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white group-hover:bg-primary group-hover:scale-110 transition-all">
                                                    <Play size={12} fill="currentColor" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleWatch()}>
                                            <div className="text-xs font-bold text-white mb-0.5 line-clamp-1">{ep.title}</div>
                                            <div className="text-[10px] text-onSurfaceVariant">Episode {ep.episode} • 24m</div>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleEpisodeWatched(epNum); }}
                                            className={`p-2 rounded-full transition-all ${isWatched ? 'text-primary bg-primary/10' : 'text-onSurfaceVariant/20 hover:text-onSurfaceVariant'}`}
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>
                                    </div>
                                );
                            })}
                            {!showAllEpisodes && episodes.length > 5 && (
                                <button 
                                    onClick={() => setShowAllEpisodes(true)}
                                    className="w-full py-3 text-xs font-bold text-onSurfaceVariant bg-surfaceVariant/10 rounded-xl hover:bg-surfaceVariant/20 transition-colors"
                                >
                                    View {episodes.length - 5} more episodes
                                </button>
                            )}
                            {episodes.length === 0 && (
                                <div className="text-center text-xs text-onSurfaceVariant/50 py-4">
                                    No episode data available.
                                </div>
                            )}
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

                    {/* Recommendations (Refactored) */}
                    {recommendations.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white">More Like This</h3>
                                <Sparkle size={16} className="text-primary animate-pulse" />
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {recommendations.map((rec, index) => {
                                    const isHero = index === 0;
                                    return (
                                        <div 
                                            key={rec.id} 
                                            onClick={() => navigate(`/detail/${rec.id}`, { state: { anime: rec } })}
                                            className={`
                                                cursor-pointer group relative rounded-xl overflow-hidden 
                                                transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                                                animate-fade-in-up
                                                ${isHero ? 'col-span-2 bg-surfaceVariant/10 flex flex-row' : 'col-span-1'}
                                            `}
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            {/* Hero Card Layout */}
                                            {isHero ? (
                                                <>
                                                    <div className="w-1/3 shrink-0 relative">
                                                        <img 
                                                            src={rec.imageUrl} 
                                                            className="w-full h-full object-cover" 
                                                            alt={rec.title} 
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1E1C22]/90 sm:hidden" />
                                                    </div>
                                                    <div className="p-4 flex flex-col justify-center flex-1 relative">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px] font-bold uppercase tracking-wider">Featured</span>
                                                            <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                                                                <Star size={10} fill="currentColor" /> {rec.score}
                                                            </div>
                                                        </div>
                                                        <h4 className="text-base font-bold text-white leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{rec.title}</h4>
                                                        <p className="text-xs text-onSurfaceVariant/80 line-clamp-2 mb-3">{rec.synopsis || 'No description available.'}</p>
                                                        <div className="flex items-center gap-3 text-[10px] text-onSurfaceVariant/50 uppercase tracking-wider font-medium">
                                                            <span>{rec.type || 'TV'}</span>
                                                            <span>•</span>
                                                            <span>{rec.episodes ? `${rec.episodes} EPS` : '? EPS'}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                /* Standard Card Layout */
                                                <>
                                                    <div className="relative aspect-[2/3] mb-2">
                                                        <img 
                                                            src={rec.imageUrl} 
                                                            className="w-full h-full object-cover rounded-xl group-hover:brightness-110 transition-all" 
                                                            alt={rec.title} 
                                                        />
                                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                                                            <Star size={8} fill="currentColor" /> {rec.score}
                                                        </div>
                                                    </div>
                                                    <h4 className="text-xs font-medium text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">{rec.title}</h4>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Main App Shell ---

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [myList, setMyList] = useState<Anime[]>([]);

  const [searchQuery, setSearchQueryState] = useState('');
  const [searchFilters, setSearchFilters] = useState<GeminiService.SearchFilters>({ sfw: true });
  const [searchResults, setSearchResultsState] = useState<(Anime | NewsItem)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  
  const lastSearchedParams = useRef<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingRef = useRef(false); // Lock to prevent race conditions

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const initialAuthView = useRef<AuthView>('signIn');
  
  const openAuthModal = (view: AuthView = 'signIn') => {
      initialAuthView.current = view;
      setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setLoadingAuth(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN') {
        closeAuthModal();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMyList = async (userId: string) => {
    const { data, error } = await supabase
        .from('anime_list')
        .select('*')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false });

    if (error) {
        console.error('Error fetching list:', error);
    } else {
        const fetchedList: Anime[] = data.map((item: any) => ({
            ...(item.anime_data as Anime),
            userStatus: item.user_status,
            userProgress: item.user_progress,
            userScore: item.user_score,
            lastUpdated: new Date(item.last_updated).getTime(),
            list_id: item.id
        }));
        setMyList(fetchedList);
    }
  };

  useEffect(() => {
      if (session?.user) {
          fetchMyList(session.user.id);
      } else {
          setMyList([]);
      }
  }, [session]);

  // Initial Data Load (FRESH FEED + NEWS)
  useEffect(() => {
      if (isOnline) {
          Promise.allSettled([
              AniListService.getRecommendedAnime(),
              NewsService.fetchNews()
          ]).then(([animeResult, newsResult]) => {
              let newsData: NewsItem[] = [];
              if (newsResult.status === 'fulfilled') {
                  newsData = newsResult.value;
                  setNewsItems(newsData);
              } else {
                  console.error("News fetch failed", newsResult.reason);
              }
              
              if (animeResult.status === 'fulfilled' && animeResult.value.length > 0) {
                  const mixed = interleaveData(animeResult.value, newsData);
                  setSearchResultsState(mixed);
              } else {
                   GeminiService.getTopAnime(1).then(fallbackAnime => {
                       const mixed = interleaveData(fallbackAnime, newsData);
                       setSearchResultsState(mixed);
                   });
              }
          });
          GeminiService.getTrendingAnime().then(setTrendingAnime);
      }
  }, [isOnline]);

  const setSearchQuery = (q: string) => {
      setSearchQueryState(q);
      if (q.length <= 2) {
          setHasNextPage(false);
          setSearchError(null);
      }
  };

  const resetFilters = () => {
      setSearchFilters({ sfw: true });
      setSearchQuery('');
      setSearchError(null);
      setHasNextPage(false);
      if (isOnline) {
        setIsSearching(true);
        Promise.allSettled([
            AniListService.getRecommendedAnime(),
            NewsService.fetchNews()
        ]).then(([animeResult, newsResult]) => {
             let newsData: NewsItem[] = [];
             if (newsResult.status === 'fulfilled') newsData = newsResult.value;
             else if (newsItems.length) newsData = newsItems;
             
             setNewsItems(newsData);
             
             if (animeResult.status === 'fulfilled') {
                 const mixed = interleaveData(animeResult.value, newsData);
                 setSearchResultsState(mixed);
             }
             setIsSearching(false);
        });
      }
  };

  const applyPreset = (preset: FilterPreset) => {
      if (!isOnline) return;
      setIsSearching(true);
      let filters: GeminiService.SearchFilters = { sfw: true };
      
      switch (preset) {
          case 'Top Rated': filters = { ...filters, order_by: 'score', sort: 'desc' }; break;
          case 'Trending': filters = { ...filters, order_by: 'popularity', sort: 'asc' }; break;
          case 'New Releases': filters = { ...filters, status: 'airing', order_by: 'score', sort: 'desc' }; break;
          case 'Movies': filters = { ...filters, type: 'movie', order_by: 'score', sort: 'desc' }; break;
          case 'Classics': filters = { ...filters, end_year: 2010, order_by: 'score', sort: 'desc' }; break;
      }

      setSearchFilters(filters);
      GeminiService.searchAnime('', 1, filters).then(res => {
          handleNewSearch(res.data, res.hasNextPage);
          setIsSearching(false);
      });
  }

  const loadMoreResults = async () => {
      if (!hasNextPage || isLoadingRef.current || !isOnline) return;
      
      setIsLoadingMore(true);
      isLoadingRef.current = true;
      
      const nextPage = currentPage + 1;
      try {
        const result = await GeminiService.searchAnime(searchQuery, nextPage, searchFilters);
        if (!result.error) {
            setSearchResultsState(prev => {
                const newItems = deduplicateItems(prev, result.data);
                return [...prev, ...newItems];
            });
            setHasNextPage(result.hasNextPage);
            setCurrentPage(nextPage);
        }
      } catch (e) {
          console.error("Load more failed", e);
      } finally { 
          setIsLoadingMore(false); 
          isLoadingRef.current = false;
      }
  };
  
  const handleNewSearch = (results: Anime[], hasNext: boolean) => {
      setSearchResultsState(results);
      setHasNextPage(hasNext);
      setCurrentPage(1);
  };

  const addToMyList = async (anime: Anime, status: AnimeStatus) => {
    if (!session?.user || myList.some(a => a.id === anime.id)) return;

    const { list_id, ...animeData } = anime;

    const newItem = {
        user_id: session.user.id,
        anime_id: anime.id,
        anime_data: animeData,
        user_status: status,
        user_progress: 0,
        last_updated: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('anime_list').insert(newItem).select().single();

    if (error) {
      console.error('Error adding to list:', error);
    } else {
        const addedAnime: Anime = {
            ...(data.anime_data as Anime),
            userStatus: data.user_status,
            userProgress: data.user_progress,
            userScore: data.user_score,
            lastUpdated: new Date(data.last_updated).getTime(),
            list_id: data.id,
        };
        setMyList(prev => [addedAnime, ...prev]);
    }
  };

  const removeFromMyList = async (listId: number) => {
    const { error } = await supabase.from('anime_list').delete().eq('id', listId);
    if (error) {
        console.error('Error removing from list:', error);
    } else {
        setMyList(prev => prev.filter(a => a.list_id !== listId));
    }
  };

  const updateAnimeStatus = async (listId: number, status: AnimeStatus, score?: number) => {
      const updateObject: any = {
          user_status: status,
          last_updated: new Date().toISOString(),
      };
      if (score !== undefined) updateObject.user_score = score;

      const { error } = await supabase.from('anime_list').update(updateObject).eq('id', listId);
      
      if (error) {
          console.error('Error updating status:', error);
      } else {
          setMyList(prev => prev.map(a => a.list_id === listId ? { ...a, userStatus: status, userScore: score ?? a.userScore, lastUpdated: Date.now() } : a ));
      }
  };
  
  const updateProgress = async (listId: number, progress: number) => {
      const animeInList = myList.find(a => a.list_id === listId);
      if (!animeInList) return;

      const newStatus = (progress >= (animeInList.episodes || 9999)) ? AnimeStatus.Completed : (animeInList.userStatus === AnimeStatus.PlanToWatch ? AnimeStatus.Watching : animeInList.userStatus);

      const { error } = await supabase.from('anime_list').update({
          user_progress: progress,
          user_status: newStatus,
          last_updated: new Date().toISOString(),
      }).eq('id', listId);

      if (error) {
          console.error('Error updating progress:', error);
      } else {
          setMyList(prev => prev.map(a => a.list_id === listId ? { ...a, userProgress: progress, userStatus: newStatus, lastUpdated: Date.now() } : a ));
      }
  };

  return (
    <AppContext.Provider value={{ 
        session, user: session?.user || null, myList, loadingAuth,
        addToMyList, removeFromMyList, updateAnimeStatus, updateProgress,
        searchQuery, setSearchQuery, 
        searchResults, setSearchResults: setSearchResultsState, 
        isSearching, setIsSearching,
        loadMoreResults, hasNextPage, isLoadingMore,
        handleNewSearch,
        searchError, setSearchError,
        searchFilters, setSearchFilters, resetFilters, applyPreset,
        lastSearchedParams, trendingAnime, isOnline,
        isAuthModalOpen, openAuthModal, closeAuthModal
    }}>
      {children}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialView={initialAuthView.current} 
      />
    </AppContext.Provider>
  );
};

const App = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <AppProvider>
        <div className="w-full bg-background min-h-screen shadow-2xl relative font-sans text-onSurface selection:bg-primary/30">
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<DiscoverScreen />} />
                <Route path="/trending" element={<TrendingScreen />} />
                <Route path="/list" element={<MyListScreen />} />
                <Route path="/detail/:id" element={<DetailScreen />} />
                <Route path="/studio/:id" element={<StudioScreen />} />
              </Route>
            </Routes>
            <NetworkStatus />
        </div>
      </AppProvider>
    </HashRouter>
  );
};

export default App;