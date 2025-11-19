import { Anime, MALNode, AnimeResponse } from '../types';

// BASE_URL points to the local Vite proxy configured in vite.config.ts
// This forwards /api requests to https://api.myanimelist.net/v2
// This is the most reliable way to bypass CORS during local development.
const BASE_URL = '/api';

// MyAnimeList Client ID
// We use the ID directly here to avoid runtime issues with import.meta.env in some environments.
const CLIENT_ID = '4754116bfff9ab39ef82041030a73df3';

const getHeaders = () => ({
    'X-MAL-CLIENT-ID': CLIENT_ID,
});

// Transform MAL Node to our App's Anime Interface
const transformMALNode = (node: MALNode): Anime => {
    return {
        id: node.id,
        title: node.title,
        imageUrl: node.main_picture?.large || node.main_picture?.medium || 'https://placehold.co/300x450/2d2b33/ffffff?text=No+Image',
        score: node.mean || 0,
        synopsis: node.synopsis || "No synopsis available.",
        episodes: node.num_episodes,
        status: node.status ? node.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : undefined,
        type: node.media_type ? node.media_type.toUpperCase() : undefined,
        genres: node.genres?.map(g => g.name) || [],
        studios: node.studios?.map(s => s.name) || [],
        year: node.start_season?.year,
        season: node.start_season?.season,
        rank: node.rank,
        popularity: 0, 
        members: 0
    };
};

const safeFetch = async (endpoint: string, params: string) => {
    if (!navigator.onLine) {
        throw new Error("No internet connection.");
    }

    // Using the local proxy URL
    const url = `${BASE_URL}${endpoint}?${params}`;
    
    try {
        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`MAL API Error (${response.status}):`, errorText);
            
            if (response.status === 401) throw new Error("Unauthorized - Client ID invalid");
            if (response.status === 403) throw new Error("Access Denied - CORS/Proxy issue");
            if (response.status === 429) throw new Error("Rate Limited - Please wait");
            
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    } catch (error: any) {
        console.error("Fetch failed:", error);
        throw error;
    }
};

export const searchAnime = async (query: string, page: number = 1): Promise<{ data: Anime[], hasNextPage: boolean, error?: string }> => {
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        const fields = 'id,title,main_picture,mean,synopsis,media_type,status,num_episodes,genres,start_season,studios,rank';
        const params = `q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fields=${fields}`;
        
        const json: AnimeResponse = await safeFetch('/anime', params);
        const animeList = json.data.map(item => transformMALNode(item.node));

        return {
            data: animeList,
            hasNextPage: !!json.paging?.next
        };

    } catch (error: any) {
        return { data: [], hasNextPage: false, error: error.message || "Network error" };
    }
};

export const getTopAnime = async (limit: number = 20, offset: number = 0): Promise<Anime[]> => {
    try {
        const fields = 'id,title,main_picture,mean,synopsis,media_type,status,num_episodes,genres,start_season,studios,rank';
        const params = `ranking_type=all&limit=${limit}&offset=${offset}&fields=${fields}`;

        const json: AnimeResponse = await safeFetch('/anime/ranking', params);
        return json.data.map(item => transformMALNode(item.node));

    } catch (error) {
        console.error("MAL API Top Anime Error:", error);
        return [];
    }
};

export const getSeasonalAnime = async (year: number, season: string, limit: number = 20): Promise<Anime[]> => {
     try {
        const fields = 'id,title,main_picture,mean,synopsis,media_type,status,num_episodes,genres,start_season';
        const params = `limit=${limit}&fields=${fields}`;
        
        const json: AnimeResponse = await safeFetch(`/anime/season/${year}/${season}`, params);
        return json.data.map(item => transformMALNode(item.node));
     } catch (error) {
         console.error("MAL API Seasonal Error:", error);
         return [];
     }
};