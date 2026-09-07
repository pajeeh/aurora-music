import type { Track } from "./types";

type SearchItem = {
  id: { videoId?: string };
  snippet: { title: string; channelTitle: string; thumbnails: { high?: { url: string }; medium?: { url: string } } };
};

export async function searchYouTube(query: string, token?: string | null): Promise<Track[] | null> {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
  if (!key && !token) return null;
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: "10",
    maxResults: "18",
    regionCode: "BR",
    relevanceLanguage: "pt",
    q: query,
    ...(token ? {} : { key: key! })
  });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) });
  if (response.status === 401) throw new Error("Sua conexão expirou. Conecte sua conta novamente.");
  if (!response.ok) throw new Error("Não foi possível buscar no YouTube agora.");
  const data = await response.json() as { items: SearchItem[] };
  return data.items.filter(item => item.id.videoId).map((item, index) => ({
    id: item.id.videoId!,
    title: decodeHtml(item.snippet.title),
    artist: decodeHtml(item.snippet.channelTitle),
    album: "YouTube",
    duration: "—",
    artwork: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? "",
    accent: ["#7c5cff", "#29c7ac", "#ff7657", "#e75d93"][index % 4]
  }));
}

function decodeHtml(value: string) {
  const element = document.createElement("textarea");
  element.innerHTML = value;
  return element.value;
}
