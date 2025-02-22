import Fastify from "fastify";
import { checkTikTokUrl, requireEnv } from "./utils.js";
import { z } from "zod";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { downloadMp4, mp4toMp3, transcribe } from "./video.js";
import {Movie} from "./schemas.js";
import { getTikTokInfo } from './tiktok.js';
import { Readable } from 'stream';
import FastifyMultipart from '@fastify/multipart';
import FormData from 'form-data';
import fs from 'fs';
import { Result } from "@fal-ai/client";
import { WhisperOutput } from "@fal-ai/client/endpoints";
import path from "path";

const checkVideoQuery = z.object({
  video_url: z.string(),
});

export async function startServer() {
  const app = Fastify({
    logger: true
  }).withTypeProvider<ZodTypeProvider>();
  app.register(FastifyMultipart);
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
    const mp4Buffer = await downloadMp4(tikTokInfo.videoUrl);
    const mp3Blob = await mp4toMp3(Readable.from(mp4Buffer));
    const transcribeResult = await transcribe(mp3Blob);

    const movie: Movie = {
      slides: [],
    };

    const form = new FormData();
    form.append('data', JSON.stringify(movie), {
      contentType: 'application/json',
    });
    // form.append('video', mp4Buffer);

    reply.header("Content-Type", `multipart/form-data; boundary=${form.getBoundary()}`);
    reply.send(form.getBuffer());
  });

  await app.listen({
    host: '0.0.0.0',
    port: parseInt(requireEnv('SERVER_PORT')),
  });
}
