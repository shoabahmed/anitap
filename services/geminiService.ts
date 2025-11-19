
import { Anime, Character, Episode, Relation, Studio } from "../types";

// We use Jikan API (Unofficial MyAnimeList API) to ensure:
// 1. Fast search results (no LLM generation latency)
// 2. Valid, persistent image URLs (no hallucinations)
// 3. Accurate metadata (episodes, score, status)

const BASE_URL = "https://api.jikan.moe/v4";

export interface SearchResult {
    data: Anime[];
    hasNextPage: boolean;
    error?: string;
}

export interface SearchFilters {
    genres?: number[];
    producers?: string; // Comma separated IDs
    status?: 'airing' | 'complete' | 'upcoming';
    type?: 'tv' | 'movie' | 'ova' | 'ona' | 'special';
    rating?: 'g' | 'pg' | 'pg13' | 'r17' | 'r+' | 'rx'; // Jikan ratings
    min_score?: number;
    max_score?: number;
    start_year?: number;
    end_year?: number;
    sfw?: boolean; // true = safe (default), false = allow nsfw
    order_by?: 'score' | 'popularity' | 'start_date' | 'title' | 'favorites' | 'episodes';
    sort?: 'asc' | 'desc';
}

export interface StudioData {
    mal_id: number;
    titles: { type: string, title: string }[];
    images: { jpg: { image_url: string } };
    favorites: number;
    established: string;
    about: string;
    count: number;
}

// Comprehensive Genre Mapping (MyAnimeList IDs)
export const GENRE_LIST = [
    // --- MAINSTREAM GENRES ---
    { id: 1, name: 'Action', group: 'Mainstream' },
    { id: 2, name: 'Adventure', group: 'Mainstream' },
    { id: 4, name: 'Comedy', group: 'Mainstream' },
    { id: 8, name: 'Drama', group: 'Mainstream' },
    { id: 10, name: 'Fantasy', group: 'Mainstream' },
    { id: 22, name: 'Romance', group: 'Mainstream' },
    { id: 24, name: 'Sci-Fi', group: 'Mainstream' },
    { id: 36, name: 'Slice of Life', group: 'Mainstream' },
    { id: 30, name: 'Sports', group: 'Mainstream' },
    { id: 37, name: 'Supernatural', group: 'Mainstream' },
    { id: 7, name: 'Mystery', group: 'Mainstream' },
    { id: 14, name: 'Horror', group: 'Mainstream' },
    { id: 40, name: 'Psychological', group: 'Mainstream' },
    { id: 41, name: 'Suspense', group: 'Mainstream' }, // Maps to Thriller often
    { id: 9, name: 'Ecchi', group: 'Mainstream' },
    { id: 46, name: 'Award Winning', group: 'Mainstream' },
    { id: 5, name: 'Avant Garde', group: 'Mainstream' },

    // --- THEMES & SUB-GENRES ---
    { id: 18, name: 'Mecha', group: 'Themes' },
    { id: 50, name: 'Cyberpunk', group: 'Themes' }, // Maps to generic Sci-Fi theme or specific if available
    { id: 19, name: 'Music', group: 'Themes' },
    { id: 60, name: 'Idol', group: 'Themes' }, // Visual Arts / Idol
    { id: 23, name: 'School', group: 'Themes' },
    { id: 13, name: 'Historical', group: 'Themes' },
    { id: 38, name: 'Military', group: 'Themes' },
    { id: 21, name: 'Samurai', group: 'Themes' },
    { id: 17, name: 'Martial Arts', group: 'Themes' },
    { id: 32, name: 'Vampire', group: 'Themes' },
    { id: 6, name: 'Mythology', group: 'Themes' }, // Demons/Gods
    { id: 29, name: 'Space', group: 'Themes' },
    { id: 31, name: 'Super Power', group: 'Themes' },
    { id: 11, name: 'Strategy Game', group: 'Themes' }, // Game
    { id: 62, name: 'Isekai', group: 'Themes' },
    { id: 78, name: 'Time Travel', group: 'Themes' },
    { id: 72, name: 'Reincarnation', group: 'Themes' },
    { id: 73, name: 'Reverse Harem', group: 'Themes' },
    { id: 35, name: 'Harem', group: 'Themes' },
    { id: 39, name: 'Detective', group: 'Themes' }, // Police
    { id: 68, name: 'Organized Crime', group: 'Themes' },
    { id: 48, name: 'Workplace', group: 'Themes' },
    { id: 63, name: 'Iyashikei', group: 'Themes' }, // Healing
    { id: 76, name: 'Survival', group: 'Themes' },
    { id: 58, name: 'Gore', group: 'Themes' },
    { id: 20, name: 'Parody', group: 'Themes' },

    // --- DEMOGRAPHICS ---
    { id: 27, name: 'Shounen', group: 'Demographics' },
    { id: 42, name: 'Seinen', group: 'Demographics' },
    { id: 25, name: 'Shoujo', group: 'Demographics' },
    { id: 43, name: 'Josei', group: 'Demographics' },
    { id: 15, name: 'Kids', group: 'Demographics' },

    // --- EXPLICIT / 18+ (Valid Jikan IDs) ---
    { id: 12, name: 'Hentai', group: 'Explicit' },
    { id: 49, name: 'Erotica', group: 'Explicit' },
    { id: 28, name: 'Boys Love', group: 'Explicit' }, // Yaoi
    { id: 26, name: 'Girls Love', group: 'Explicit' }, // Yuri
    { id: 33, name: 'Yaoi', group: 'Explicit' }, // Legacy tag
    { id: 34, name: 'Yuri', group: 'Explicit' }, // Legacy tag
];

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const searchAnime = async (query: string, page: number = 1, filters?: SearchFilters): Promise<SearchResult> => {
  if (!navigator.onLine) {
    return { data: [], hasNextPage: false, error: "No internet connection." };
  }

  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('page', page.toString());
    params.append('limit', '24');
    
    if (filters?.sfw !== false) {
        params.append('sfw', 'true'); 
    }

    if (filters) {
        if (filters.producers) params.append('producers', filters.producers);
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('type', filters.type);
        if (filters.rating) params.append('rating', filters.rating);
        if (filters.min_score && filters.min_score > 0) params.append('min_score', filters.min_score.toString());
        if (filters.max_score && filters.max_score < 10) params.append('max_score', filters.max_score.toString());
        if (filters.start_year) params.append('start_date', `${filters.start_year}-01-01`);
        if (filters.end_year) params.append('end_date', `${filters.end_year}-12-31`);
        if (filters.genres && filters.genres.length > 0) params.append('genres', filters.genres.join(','));

        if (filters.order_by) {
            params.append('order_by', filters.order_by);
            params.append('sort', filters.sort || 'desc');
        } else if (query.length > 0) {
            // Default search relevance
        } else if (filters.producers) {
             // If just producer view, sort by popularity by default
             params.append('order_by', 'members');
             params.append('sort', 'desc');
        } else {
             // Default for browsing
             params.append('order_by', 'popularity');
             params.append('sort', 'asc'); 
        }
    }

    const response = await fetch(`${BASE_URL}/anime?${params.toString()}`);
    
    if (response.status === 429) return { data: [], hasNextPage: false, error: "Too many requests. Please wait a moment." };
    if (response.status >= 500) return { data: [], hasNextPage: false, error: "Jikan API is currently unavailable." };
    if (!response.ok) return { data: [], hasNextPage: false, error: `Error ${response.status}` };
    
    const data = await response.json();
    const animeList = (data.data || []).map(transformJikanAnime);
    const hasNextPage = data.pagination?.has_next_page || false;

    return { data: animeList, hasNextPage };

  } catch (error) {
    return { data: [], hasNextPage: false, error: "Network error." };
  }
};

export const getStudioById = async (id: number): Promise<StudioData | null> => {
    if (!navigator.onLine) return null;
    try {
        await wait(300);
        const response = await fetch(`${BASE_URL}/producers/${id}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.data;
    } catch (e) {
        console.error("Studio fetch failed", e);
        return null;
    }
};

export const getTopAnime = async (page: number = 1): Promise<Anime[]> => {
    if (!navigator.onLine) return [];
    try {
        const response = await fetch(`${BASE_URL}/top/anime?page=${page}&limit=24&filter=bypopularity`);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.data || []).map(transformJikanAnime);
    } catch (e) {
        return [];
    }
};

export const getTrendingAnime = async (): Promise<Anime[]> => {
    if (!navigator.onLine) return [];
    try {
        const response = await fetch(`${BASE_URL}/top/anime?filter=airing&limit=10`);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.data || []).map(transformJikanAnime);
    } catch (e) {
        return [];
    }
};

export const getAnimeFullDetails = async (id: number): Promise<Anime | null> => {
    if (!navigator.onLine) return null;
    try {
        await wait(450); // Delay to help with Jikan rate limits
        const response = await fetch(`${BASE_URL}/anime/${id}/full`);
        if (!response.ok) return null;
        const data = await response.json();
        return transformJikanAnime(data.data);
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const getAnimeEpisodes = async (id: number): Promise<Episode[]> => {
    if (!navigator.onLine) return [];
    try {
        await wait(450);
        // We request page 1 explicitly
        const response = await fetch(`${BASE_URL}/anime/${id}/episodes?page=1`);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.data || []).map((item: any) => ({
            mal_id: item.mal_id,
            title: item.title,
            episode: item.episode || item.mal_id, // fallback
            url: item.url,
            aired: item.aired ? new Date(item.aired).toLocaleDateString() : '',
            score: item.score,
            filler: item.filler,
            recap: item.recap
        }));
    } catch (e) {
        return [];
    }
};

export const getAnimeCharacters = async (id: number): Promise<Character[]> => {
    if (!navigator.onLine) return [];
    try {
        await wait(450);
        const response = await fetch(`${BASE_URL}/anime/${id}/characters`);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.data || []).slice(0, 15).map((item: any) => {
            // Try to find Japanese voice actor
            const va = item.voice_actors?.find((v: any) => v.language === "Japanese") || item.voice_actors?.[0];
            return {
                id: item.character.mal_id,
                name: item.character.name,
                role: item.role,
                imageUrl: item.character.images?.webp?.image_url || '',
                voiceActor: va ? {
                    name: va.person.name,
                    language: va.language,
                    imageUrl: va.person.images?.jpg?.image_url
                } : undefined
            };
        });
    } catch (e) {
        return [];
    }
};

export const getAnimeRelations = async (id: number): Promise<Relation[]> => {
    if (!navigator.onLine) return [];
    try {
        await wait(450);
        const response = await fetch(`${BASE_URL}/anime/${id}/relations`);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.data || []).map((item: any) => ({
            relation: item.relation,
            entry: item.entry
        }));
    } catch (e) {
        return [];
    }
};

export const getAnimeRecommendationsById = async (id: number): Promise<Anime[]> => {
    if (!navigator.onLine) return [];
    try {
        await wait(450);
        const response = await fetch(`${BASE_URL}/anime/${id}/recommendations`);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.data || []).slice(0, 10).map((item: any) => transformJikanAnime(item.entry));
    } catch (e) {
        return [];
    }
};

export const getAnimeRecommendations = async (): Promise<Anime[]> => {
    if (!navigator.onLine) return [];
    try {
        const response = await fetch(`${BASE_URL}/top/anime?filter=airing&limit=20`);
        if (!response.ok) return [];
        const data = await response.json();
        return (data.data || []).map(transformJikanAnime);
    } catch (e) {
        return [];
    }
}

const transformJikanAnime = (item: any): Anime => {
    return {
        id: item.mal_id,
        title: item.title_english || item.title,
        imageUrl: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || '',
        score: item.score || 0,
        synopsis: item.synopsis ? item.synopsis.replace('[Written by MAL Rewrite]', '').trim() : "No synopsis available.",
        episodes: item.episodes,
        status: item.status,
        
        // Extended
        genres: item.genres?.map((g: any) => g.name) || [],
        studios: item.studios?.map((s: any) => ({ id: s.mal_id, name: s.name })) || [],
        rank: item.rank,
        popularity: item.popularity,
        members: item.members,
        source: item.source,
        duration: item.duration,
        rating: item.rating,
        season: item.season,
        year: item.year,
        type: item.type,
        trailerUrl: item.trailer?.embed_url,
        userStatus: undefined
    };
};
