
import { NewsItem } from '../types';

const DEFAULT_RSS_URL = 'https://www.animenewsnetwork.com/news/rss.xml';
const RSS2JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json';

export const fetchNews = async (rssUrl: string = DEFAULT_RSS_URL): Promise<NewsItem[]> => {
  if (!navigator.onLine) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const params = new URLSearchParams();
    params.append('rss_url', rssUrl);
    params.append('api_key', ''); 
    
    const response = await fetch(`${RSS2JSON_ENDPOINT}?${params.toString()}`, {
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`News API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      return [];
    }

    return data.items.map((item: any) => {
      // Attempt to find an image in description if thumbnail is missing
      let thumbnail = item.thumbnail;
      if (!thumbnail || thumbnail === "") {
        const imgMatch = item.description?.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
          thumbnail = imgMatch[1];
        }
      }
      
      // Fallback image if still missing
      if (!thumbnail) {
        thumbnail = 'https://placehold.co/600x400/1e1c22/ffffff?text=News';
      }

      return {
        title: item.title || "Untitled News",
        link: item.link || "#",
        pubDate: item.pubDate || new Date().toISOString(), 
        thumbnail: thumbnail,
        content: item.content || item.description || '',
        source: data.feed?.title || 'Anime News'
      };
    });

  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
};
