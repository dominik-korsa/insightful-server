import path from 'path';
import Fastify from "fastify";
import { checkInstagramUrl, requireEnv } from "./utils";
import { z } from "zod";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { mp4toMp3, transcribe } from "./video";

const checkVideoQuery = z.object({
  instagram_url: z.string(),
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
    if (!checkInstagramUrl(request.query.instagram_url)) {
      reply.code(400);
      return { error: 'The instagram_url param is not an Instagram reel URL' };
    }
    // TODO: Download the video

    const videoFile = path.join(__dirname, '../input.mp4');
    const mp3Blob = await mp4toMp3(videoFile);
    const transcribeResult = await transcribe(mp3Blob);
    console.log(transcribeResult.data);
    console.log(transcribeResult.requestId);

    return request.query.instagram_url;
  });

  await app.listen({
    host: '0.0.0.0',
    port: parseInt(requireEnv('SERVER_PORT')),
  });
}
