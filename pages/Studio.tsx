
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Globe, Calendar, Users } from 'lucide-react';
import { Anime } from '../types';
import * as GeminiService from '../services/geminiService';
import { VerticalAnimeCard, SkeletonCard } from '../components/AnimeCard';

const StudioScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [studioData, setStudioData] = useState<GeminiService.StudioData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const observerTarget = useRef(null);
  const loadingRef = useRef(false);

  const studioId = parseInt(id || '0');

  // Fetch Studio Details
  useEffect(() => {
      if (studioId) {
          GeminiService.getStudioById(studioId).then(data => {
              if (data) setStudioData(data);
          });
      }
  }, [studioId]);

  // Fetch Anime by Producer
  const fetchStudioAnime = async (pageNum: number) => {
    if (loadingRef.current || !studioId) return;
    loadingRef.current = true;
    setLoading(true);

    // Pass producer ID to search filters
    const result = await GeminiService.searchAnime('', pageNum, { producers: studioId.toString() });
    
    if (result.data.length > 0) {
        setAnimeList(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const unique = result.data.filter(a => !existingIds.has(a.id));
            return [...prev, ...unique];
        });
        setHasNextPage(result.hasNextPage);
    } else {
        setHasNextPage(false);
    }

    setLoading(false);
    loadingRef.current = false;
  };

  useEffect(() => {
    setAnimeList([]);
    setPage(1);
    fetchStudioAnime(1);
  }, [studioId]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !loadingRef.current) {
            setPage(prev => {
                const nextPage = prev + 1;
                fetchStudioAnime(nextPage);
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
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <div className="relative h-64 overflow-hidden">
           {studioData?.images?.jpg?.image_url ? (
               <div className="absolute inset-0">
                   <img src={studioData.images.jpg.image_url} className="w-full h-full object-cover blur-md opacity-50 scale-110" alt="bg" />
                   <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-black/40" />
               </div>
           ) : (
               <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10" />
           )}

           <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
               <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-6 left-6 p-2 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
               >
                   <ArrowLeft size={24} />
               </button>
               
               <div className="flex items-end gap-6">
                   {studioData?.images?.jpg?.image_url && (
                       <img 
                            src={studioData.images.jpg.image_url} 
                            alt={studioData.titles?.[0]?.title} 
                            className="w-24 h-24 rounded-2xl object-contain bg-white shadow-lg border-4 border-white/10"
                       />
                   )}
                   <div>
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Building2 size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Animation Studio</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {studioData?.titles?.[0]?.title || 'Loading Studio...'}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-onSurfaceVariant">
                            {studioData?.established && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    <span>Est. {new Date(studioData.established).getFullYear()}</span>
                                </div>
                            )}
                            {studioData?.favorites > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Users size={12} />
                                    <span>{studioData.favorites.toLocaleString()} Favorites</span>
                                </div>
                            )}
                        </div>
                   </div>
               </div>
           </div>
      </div>

      {/* Content */}
      <div className="p-6">
          {studioData?.about && (
               <div className="mb-8 bg-surfaceVariant/5 p-4 rounded-2xl border border-white/5">
                   <h3 className="text-sm font-bold text-onSurfaceVariant uppercase tracking-widest mb-2">About</h3>
                   <p className="text-sm text-onSurface/80 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                       {studioData.about.replace(/\\n/g, ' ')}
                   </p>
               </div>
          )}

          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Globe size={20} className="text-primary" /> 
              Known For
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {animeList.map((anime, index) => (
                 <VerticalAnimeCard 
                    key={`studio-anime-${anime.id}-${index}`} 
                    anime={anime} 
                    onClick={() => navigate(`/detail/${anime.id}`, { state: { anime } })} 
                 />
              ))}
              
              {loading && (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
              )}
          </div>
          
          {/* Intersection Target */}
          <div ref={observerTarget} className="h-10" />
      </div>
    </div>
  );
};

export default StudioScreen;
