
import { Anime, AniListResponse } from '../types';

const ANILIST_API = 'https://graphql.anilist.co';

const TRENDING_QUERY = `
query ($page: Int, $perPage: Int) {
  Page (page: $page, perPage: $perPage) {
    media (sort: TRENDING_DESC, type: ANIME) {
      id
      idMal
      title {
        english
        romaji
      }
      coverImage {
        extraLarge
      }
      averageScore
      episodes
      description
    }
  }
}
`;

// Helper to process response
const processAniListResponse = (json: AniListResponse): Anime[] => {
    if (!json.data?.Page?.media) return [];

    return json.data.Page.media
      .filter(item => item && item.idMal) 
      .map((item) => ({
        id: item.idMal!, 
        title: item.title?.english || item.title?.romaji || "Unknown Title",
        imageUrl: item.coverImage?.extraLarge || 'https://placehold.co/300x450/2d2b33/ffffff?text=No+Image',
        score: item.averageScore ? parseFloat((item.averageScore / 10).toFixed(1)) : 0,
        synopsis: item.description ? item.description.replace(/<[^>]*>?/gm, '') : "No synopsis available.",
        episodes: item.episodes || 0,
        status: 'Trending', 
        genres: [], 
      }));
};

export const getRecommendedAnime = async (): Promise<Anime[]> => {
  if (!navigator.onLine) return [];

  // Randomization: Generate a random page number between 1 and 5
  const page = Math.floor(Math.random() * 5) + 1;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: TRENDING_QUERY, variables: { page: page, perPage: 20 } }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`AniList API Error: ${response.statusText}`);
    const json: AniListResponse = await response.json();
    return processAniListResponse(json);

  } catch (error) {
    console.error("AniList Fetch Error:", error);
    return [];
  }
};

// New deterministic function for Trending Page
export const getTrendingAnime = async (page: number = 1): Promise<Anime[]> => {
    if (!navigator.onLine) return [];
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
  
    try {
      const response = await fetch(ANILIST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: TRENDING_QUERY, variables: { page: page, perPage: 20 } }),
        signal: controller.signal
      });
  
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`AniList API Error: ${response.statusText}`);
      const json: AniListResponse = await response.json();
      return processAniListResponse(json);
  
    } catch (error) {
      console.error("AniList Trending Fetch Error:", error);
      return [];
    }
  };
