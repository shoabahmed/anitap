
import React from 'react';
import { NewsItem } from '../types';
import { ExternalLink, Calendar, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewsCardProps {
  news: NewsItem;
}

const formatNewsDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  return (
    <motion.a 
      href={news.link}
      target="_blank"
      rel="noopener noreferrer"
      layout
      whileTap={{ scale: 0.98 }}
      className="relative block w-full h-full min-h-[240px] bg-[#2A2830] rounded-xl overflow-hidden group border border-primary/20 hover:border-primary/50 transition-colors"
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <img 
          src={news.thumbnail} 
          alt={news.title} 
          className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e1c22/ffffff?text=Anime+News'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1C22] via-[#1E1C22]/80 to-primary/10" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="px-2 py-1 bg-primary text-onPrimary rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
             <Newspaper size={10} /> News
          </span>
          <ExternalLink size={14} className="text-onSurfaceVariant/50 group-hover:text-primary transition-colors" />
        </div>

        <div>
          <div className="flex items-center gap-2 text-[10px] text-onSurfaceVariant/80 mb-2">
            <Calendar size={10} />
            <span>{formatNewsDate(news.pubDate)}</span>
            <span>•</span>
            <span className="line-clamp-1">{news.source}</span>
          </div>
          
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-3 group-hover:text-primary/90 transition-colors">
            {news.title}
          </h3>
          
          <div className="mt-3 flex items-center text-xs font-bold text-primary group-hover:underline decoration-primary/50 underline-offset-4">
            Read Article
          </div>
        </div>
      </div>
    </motion.a>
  );
};

export default NewsCard;
