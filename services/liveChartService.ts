
import { RecentEpisode } from '../types';

const RSS_URL = 'https://www.livechart.me/feeds/episodes';
// Using rss2json to convert XML to JSON and bypass CORS issues
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

export const getRecentEpisodes = async (): Promise<RecentEpisode[]> => {
    if (!navigator.onLine) return [];
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.status === 'ok') {
            return data.items.map((item: any) => {
                // LiveChart titles are usually "Anime Title #EpNum"
                // We use regex to separate them for cleaner UI
                const titleMatch = item.title.match(/(.+) #(\d+)$/);
                const animeTitle = titleMatch ? titleMatch[1] : item.title;
                const episodeNumber = titleMatch ? titleMatch[2] : '?';

                return {
                    id: item.guid || item.link,
                    animeTitle: animeTitle,
                    episodeNumber: episodeNumber,
                    url: item.link,
                    timestamp: item.pubDate, // rss2json formats this nicely usually
                    thumbnail: item.thumbnail || item.enclosure?.link || '', 
                };
            });
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch LiveChart RSS:", error);
        return [];
    }
};
