import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, AlertCircle, ArrowLeft } from 'lucide-react';
import { Anime } from '../types';
import * as AniListService from '../services/anilist';
import { VerticalAnimeCard, SkeletonCard } from '../components/AnimeCard';
import GoogleAd from '../components/GoogleAd';

const TrendingScreen = () => {
  const navigate = useNavigate();
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const observerTarget = useRef(null);
  const loadingRef = useRef(false); // Lock to prevent double fetch

  const fetchTrending = async (pageNum: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const newItems = await AniListService.getTrendingAnime(pageNum);
    
    if (newItems.length > 0) {
        setAnimeList(prev => {
            // Simple deduplication
            const existingIds = new Set(prev.map(a => a.id));
            const unique = newItems.filter(a => !existingIds.has(a.id));
            return [...prev, ...unique];
        });
        setHasNextPage(true);
    } else {
        setHasNextPage(false);
    }

    setLoading(false);
    loadingRef.current = false;
  };

  // Initial Load
  useEffect(() => {
    fetchTrending(1);
  }, []);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !loadingRef.current) {
            setPage(prev => {
                const nextPage = prev + 1;
                fetchTrending(nextPage);
                return nextPage;
            });
        }
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage]);

  return (
    <div className="min-h-screen pb-24 bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#1E1C22]/95 backdrop-blur-xl px-6 pt-4 pb-2 border-b border-white/5 shadow-md">
          <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-onSurfaceVariant hover:text-white">
                  <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flame className="text-orange-500" fill="currentColor" size={24} /> 
                  Trending Now
              </h1>
          </div>
      </div>

      <div className="px-6 mt-4">
          <GoogleAd className="rounded-xl" />
      </div>

      {/* Grid */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {animeList.map((anime, index) => (
             <VerticalAnimeCard 
                key={`trending-${anime.id}-${index}`} 
                anime={anime} 
                onClick={() => navigate(`/detail/${anime.id}`, { state: { anime } })} 
             />
          ))}
          
          {loading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
          )}
      </div>
      
      {/* Intersection Target */}
      <div ref={observerTarget} className="h-10" />
    </div>
  );
};

export default TrendingScreen;