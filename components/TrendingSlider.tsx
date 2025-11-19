import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Flame } from 'lucide-react';
import { Anime } from '../types';

interface TrendingSliderProps {
  animeList: Anime[];
  onSelect: (anime: Anime) => void;
}

export const TrendingSlider: React.FC<TrendingSliderProps> = ({ animeList, onSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = 300; // approx card width
      const gap = 16; // gap-4
      const scrollAmount = (cardWidth + gap) * 2; // Scroll 2 cards at a time
      
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!animeList || animeList.length === 0) return null;

  // Limit to top 10 for performance
  const displayList = animeList.slice(0, 10);

  return (
    <section className="w-full py-6 group relative">
       {/* Header */}
       <div className="px-6 mb-4 flex justify-between items-end">
           <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-onSurfaceVariant uppercase tracking-widest">Trending Now</h2>
           </div>
           <Link 
             to="/trending" 
             className="text-primary text-xs font-bold hover:text-primary/80 transition-colors"
           >
             View All
           </Link>
       </div>

       {/* Carousel Container */}
       <div className="relative group/slider">
           {/* Left Button - Desktop Only */}
           <button
             onClick={() => scroll('left')}
             className="hidden md:flex absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-20 items-center justify-start pl-4 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 disabled:opacity-0 cursor-pointer"
             aria-label="Scroll Left"
           >
             <ChevronLeft className="text-white drop-shadow-lg transition-transform active:scale-90" size={40} />
           </button>

           {/* Scroll Area */}
           <div
             ref={scrollContainerRef}
             className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-8 snap-x snap-mandatory scroll-smooth"
           >
             {displayList.map((anime) => (
                <div
                   key={anime.id}
                   onClick={() => onSelect(anime)}
                   className="relative shrink-0 w-[85vw] sm:w-[300px] aspect-video rounded-xl overflow-hidden snap-center sm:snap-start cursor-pointer hover:scale-105 hover:z-10 transition-all duration-300 shadow-lg border border-white/5 bg-surfaceVariant/20"
                >
                   {/* Image & Gradient */}
                   <img 
                     src={anime.imageUrl} 
                     alt={anime.title} 
                     className="w-full h-full object-cover" 
                     loading="lazy"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

                   {/* Content Overlay */}
                   <div className="absolute bottom-0 left-0 w-full p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                             <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase flex items-center gap-1 shadow-sm">
                                <Flame size={10} className="text-orange-500" fill="currentColor"/> Trending
                             </span>
                             <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold drop-shadow-md">
                                 <Star size={10} fill="currentColor" /> {anime.score}
                             </div>
                        </div>
                        <h3 className="text-lg font-bold text-white line-clamp-1 drop-shadow-md leading-tight">{anime.title}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-white/70 mt-1 font-medium">
                            <span>{anime.type || 'TV'}</span>
                            <span>•</span>
                            <span>{anime.episodes ? `${anime.episodes} eps` : 'Simulcast'}</span>
                        </div>
                   </div>
                </div>
             ))}
           </div>

           {/* Right Button - Desktop Only */}
           <button
             onClick={() => scroll('right')}
             className="hidden md:flex absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/80 via-black/40 to-transparent z-20 items-center justify-end pr-4 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 cursor-pointer"
             aria-label="Scroll Right"
           >
             <ChevronRight className="text-white drop-shadow-lg transition-transform active:scale-90" size={40} />
           </button>
       </div>
    </section>
  );
};
