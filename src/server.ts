import path from 'path';
import Fastify from "fastify";
import { checkInstagramUrl, checkTikTokUrl, requireEnv } from "./utils.js";
import { z } from "zod";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { downloadMp4, mp4toMp3, transcribe } from "./video.js";
import {Movie} from "./schemas.js";
import Tiktok from '@tobyg74/tiktok-api-dl';
import { getTikTokInfo } from './tiktok.js';
import got from 'got';

const checkVideoQuery = z.object({
  video_url: z.string(),
});

export async function startServer() {
  const app = Fastify({
    logger: true
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  console.log(checkVideoQuery);

  app.get('/check-video', {
    schema: {
      querystring: checkVideoQuery,
    },
  }, async (request, reply) => {
    if (!checkTikTokUrl(request.query.video_url)) {
      reply.code(400);
      return { error: 'The video_url param is not an TikTok URL' };
    }
    const tikTokInfo = await getTikTokInfo(request.query.video_url);
    const videoMp4 = downloadMp4(tikTokInfo.videoUrl);
    const mp3Blob = await mp4toMp3(videoMp4);
    const transcribeResult = await transcribe(mp3Blob);
    console.log(transcribeResult.data);
    console.log(transcribeResult.requestId);

    const movie: Movie = {
      slides: [],
    };

    return movie;
  });

  await app.listen({
    host: '0.0.0.0',
    port: parseInt(requireEnv('SERVER_PORT')),
  });
}
