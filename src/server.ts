import Fastify from "fastify";
import {checkTikTokUrl, requireEnv} from "./utils.js";
import {z} from "zod";
import {serializerCompiler, validatorCompiler, ZodTypeProvider} from "fastify-type-provider-zod";
import {downloadMp4, mp4toMp3, processWhisperResult, transcribe} from "./video.js";
import {getTikTokInfo} from './tiktok.js';
import {Readable} from 'stream';
import FastifyMultipart from '@fastify/multipart';
import { Movie } from "./schemas.js";

const checkVideoQuery = z.object({
  video_url: z.string(),
  voiceover: z.enum(['true', 'false']).optional(),
});

const checkVideoResponse = z.object({
  movie: Movie,
  video: z.object({
    data: z.string(),
    contentType: z.string(),
  }),
});

export async function startServer() {
  const app = Fastify({
    logger: true
  }).withTypeProvider<ZodTypeProvider>();
  app.register(FastifyMultipart);
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.get('/check-video', {
    schema: {
      querystring: checkVideoQuery,
    },
  }, async (request, reply) => {
    if (!checkTikTokUrl(request.query.video_url)) {
      reply.code(400);
      return {error: 'The video_url param is not an TikTok URL'};
    }
    const tikTokInfo = await getTikTokInfo(request.query.video_url);
    const mp4 = await downloadMp4(tikTokInfo.videoUrl);
    const mp3Blob = await mp4toMp3(Readable.from(mp4.buffer));
    const transcribeResult = await transcribe(mp3Blob);
    const movie = await processWhisperResult(transcribeResult.data, request.query.voiceover === 'true');

    return checkVideoResponse.parse({
      movie,
      video: {
        data: mp4.buffer.toString('base64'),
        contentType: mp4.contentType,
      },
    });
  });

  await app.listen({
    host: '0.0.0.0',
    port: parseInt(requireEnv('SERVER_PORT')),
  });
}
