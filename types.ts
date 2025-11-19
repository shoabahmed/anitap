export enum AnimeStatus {
  Watching = 'Watching',
  Completed = 'Completed',
  PlanToWatch = 'Plan to Watch',
  Dropped = 'Dropped'
}

export type FilterPreset = 'Top Rated' | 'Trending' | 'Classics' | 'New Releases' | 'Movies';

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
  
  // Extended Details
  genres?: string[];
  studios?: string[];
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

export interface User {
  name: string;
  avatarUrl: string;
  isLoggedIn: boolean;
}

export type RootStackParamList = {
  Login: undefined;
  Discover: undefined;
  MyList: undefined;
  Detail: { animeId: number };
};