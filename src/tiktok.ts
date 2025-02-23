import {z} from "zod";
import got from 'got';

export interface TikTokInfo {
  postTitle: string;
  createdAt: string;
  videoUrl: string;
}

const TiklyDownResponse = z.object({
  title: z.string(),
  created_at: z.string(),
  video: z.object({
    watermark: z.string(),
    noWatermark: z.string(),
  }),
})

async function getTikTokInfoFromShortUrl(shortUrl: string): Promise<TikTokInfo> {
  const response = await fetch(shortUrl, { method: 'HEAD', redirect: 'follow' });
  const realUrl = response.url;

  const match = realUrl.match(/video\/(\d+)/);
  if (!match) {
    throw new Error('Invalid TikTok URL');
  }

  const videoId = match[1];
  const apiUrl = `https://www.tikwm.com/api/?url=https://www.tiktok.com/@user/video/${videoId}`;
  const apiResponse = await fetch(apiUrl);
  const data = await apiResponse.json();

  return {
    postTitle: data.data.title || 'Untitled Video',
    createdAt: new Date(data.data.create_time * 1000).toISOString(),
    videoUrl: data.data.play,
  };
}

export async function getTikTokInfo(videoUrl: string): Promise<TikTokInfo> {
  const tikTokMobileRegex = /^https:\/\/vm\.tiktok\.com\/\w+\/?$/;
  if (tikTokMobileRegex.test(videoUrl))
    return await getTikTokInfoFromShortUrl(videoUrl);

  const response = await got.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(videoUrl)}`).json();
  const data = TiklyDownResponse.parse(response);
  return {
    postTitle: data.title,
    createdAt: data.created_at,
    videoUrl: data.video.noWatermark,
  };
}
