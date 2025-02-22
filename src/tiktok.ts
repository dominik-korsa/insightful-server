import { z } from "zod";
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

export async function getTikTokInfo(videoUrl: string): Promise<TikTokInfo> {
  const response = await got.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(videoUrl)}`).json();
  const data = TiklyDownResponse.parse(response);
  return {
    postTitle: data.title,
    createdAt: data.created_at,
    videoUrl: data.video.noWatermark,
  };
}
