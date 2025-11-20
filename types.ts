import type { User as SupabaseUser } from '@supabase/supabase-js';

export enum AnimeStatus {
  Watching = 'Watching',
  Completed = 'Completed',
  PlanToWatch = 'Plan to Watch',
  Dropped = 'Dropped'
}

export type FilterPreset = 'Top Rated' | 'Trending' | 'Classics' | 'New Releases' | 'Movies';

export interface Studio {
  id: number;
  name: string;
}

export interface Anime {
  id: number;
  title: string;
  imageUrl: string;
  score: number;
  synopsis: string;
  episodes?: number;
  status?: string; // Status of the anime airing itself
  userStatus?: AnimeStatus; // User's list status
  userScore?: number; // User's rating
  userProgress?: number; // Episode progress
  lastUpdated?: number;
  list_id?: number; // Primary key from our database table
  
  // Extended Details
  genres?: string[];
  studios?: Studio[]; // Changed from string[] to Studio[]
  rank?: number;
  popularity?: number;
  members?: number;
  source?: string;
  duration?: string;
  rating?: string; // Age rating
  season?: string;
  year?: number;
  type?: string;
  trailerUrl?: string;
  background?: string; // Background/Summary info
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  content: string;
  source: string;
}

export interface Episode {
  mal_id: number;
  title: string;
  episode: string | number;
  url: string;
  aired: string;
  score: number;
  filler: boolean;
  recap: boolean;
}

export interface Character {
  id: number;
  name: string;
  role: string;
  imageUrl: string;
  voiceActor?: {
    name: string;
    language: string;
    imageUrl: string;
  };
}

export interface Relation {
  relation: string;
  entry: {
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }[];
}

// Re-typing User to use Supabase's user object.
export type User = SupabaseUser;

export type AuthView = 'signIn' | 'signUp' | 'forgotPassword' | 'magicLink';

export type RootStackParamList = {
  Discover: undefined;
  MyList: undefined;
  Detail: { animeId: number };
};

export interface RecentEpisode {
  id: string;
  animeTitle: string;
  episodeNumber: string;
  url: string;
  timestamp: string;
  thumbnail: string;
}

export interface MALNode {
  id: number;
  title: string;
  main_picture?: {
    medium?: string;
    large?: string;
  };
  mean?: number;
  synopsis?: string;
  media_type?: string;
  status?: string;
  num_episodes?: number;
  start_season?: {
    year: number;
    season: string;
  };
  genres?: {
    id: number;
    name: string;
  }[];
  studios?: {
    id: number;
    name: string;
  }[];
  rank?: number;
}

export interface AnimeResponse {
  data: {
    node: MALNode;
  }[];
  paging?: {
    next?: string;
  };
}

// --- AniList Types ---

export interface AniListMedia {
  id: number;
  idMal?: number; // Critical for Jikan compatibility
  title: {
    english: string;
    romaji: string;
  };
  coverImage: {
    extraLarge: string;
  };
  averageScore: number;
  description: string;
  episodes?: number;
}

export interface AniListResponse {
  data: {
    Page: {
      media: AniListMedia[];
    }
  }
}