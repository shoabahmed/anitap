
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Anime, AnimeStatus } from '../types';

export const SkeletonCard = () => (
  <div className="w-full animate-pulse">
    <div className="aspect-[2/3] bg-surfaceVariant/20 rounded-xl mb-2" />
    <div className="h-3 bg-surfaceVariant/20 rounded w-3/4 mb-1" />
    <div className="h-2 bg-surfaceVariant/20 rounded w-1/3" />
  </div>
);

export const VerticalAnimeCard: React.FC<{ anime: Anime; onClick: () => void }> = ({ anime, onClick }) => (
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
        <p className="text-[10px] text-onSurfaceVariant mt-0.5">{anime.episodes ? `${anime.episodes} eps` : 'Ep count N/A'}</p>
    </motion.div>
);

export const HorizontalAnimeCard: React.FC<{ anime: Anime; onClick: () => void }> = ({ anime, onClick }) => (
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
