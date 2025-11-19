
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
      const containerWidth = scrollContainerRef.current.clientWidth;
      // Scroll about 70% of the screen width for a natural feel
      const scrollAmount = direction === 'left' 
        ? -(containerWidth * 0.7) 
        : (containerWidth * 0.7);
      
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
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
           {/* Left Button - Hidden on Mobile, Visible on Desktop Hover */}
           <button
             onClick={() => scroll('left')}
             className="hidden md:flex absolute left-0 top-0 bottom-0 w-12 lg:w-16 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-30 items-center justify-start pl-2 lg:pl-4 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 cursor-pointer select-none"
             aria-label="Scroll Left"
           >
             <ChevronLeft className="text-white drop-shadow-lg hover:scale-110 transition-transform" size={32} />
           </button>

           {/* Scroll Area */}
           <div
             ref={scrollContainerRef}
             className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-6 snap-x snap-mandatory scroll-smooth touch-pan-x"
           >
             {displayList.map((anime) => (
                <div
                   key={anime.id}
                   onClick={() => onSelect(anime)}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onSelect(anime); }}
                   className="
                     relative shrink-0 
                     w-[85vw] sm:w-[45vw] md:w-[320px] /* Responsive Widths: Mobile -> Tablet -> Desktop */
                     aspect-video rounded-xl overflow-hidden 
                     snap-center sm:snap-start 
                     cursor-pointer 
                     transition-all duration-300 
                     border border-white/5 bg-surfaceVariant/20
                     hover:shadow-xl hover:border-white/20
                     md:hover:scale-105 md:hover:z-10 /* Hover Zoom on Desktop only */
                     active:scale-95 md:active:scale-100 /* Tap Feedback on Mobile */
                   "
                >
                   {/* Image & Gradient */}
                   <img 
                     src={anime.imageUrl} 
                     alt={anime.title} 
                     className="w-full h-full object-cover select-none" 
                     loading="lazy"
                     draggable={false}
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

                   {/* Content Overlay */}
                   <div className="absolute bottom-0 left-0 w-full p-4 select-none">
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

           {/* Right Button - Hidden on Mobile, Visible on Desktop Hover */}
           <button
             onClick={() => scroll('right')}
             className="hidden md:flex absolute right-0 top-0 bottom-0 w-12 lg:w-16 bg-gradient-to-l from-black/80 via-black/40 to-transparent z-30 items-center justify-end pr-2 lg:pr-4 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 cursor-pointer select-none"
             aria-label="Scroll Right"
           >
             <ChevronRight className="text-white drop-shadow-lg hover:scale-110 transition-transform" size={32} />
           </button>
       </div>
    </section>
  );
};
