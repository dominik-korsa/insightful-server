import { fal, Result } from "@fal-ai/client";
import ffmpeg from 'fluent-ffmpeg';
import { Readable, Writable } from 'stream';
import { WhisperOutput } from '@fal-ai/client/endpoints';
import got from "got";

export async function mp4toMp3(input: string | Readable): Promise<Blob> {
  const chunks: Buffer[] = [];

  const writableStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    }
  });

  await new Promise<void>((resolve, reject) => {
    ffmpeg(input)
      .noVideo()
      .audioCodec('libmp3lame') // Use MP3 codec
      .on('end', () => { resolve(); })
      .on('error', (err: unknown) => reject(err))
      .outputFormat('mp3')
      .pipe(writableStream, { end: true });
  });

  return new Blob([Buffer.concat(chunks)], { type: 'audio/mpeg' });
}

export function transcribe(mp3Blob: Blob): Promise<Result<WhisperOutput>> {
  return fal.subscribe("fal-ai/whisper", {
    input: {
      audio_url: mp3Blob,
      task: "transcribe",
      chunk_level: "word",
      version: "3",
      batch_size: 64,
      num_speakers: undefined
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });
}

export async function downloadMp4(videoUrl: string): Promise<Buffer> {
  return await got.get(videoUrl).buffer();
}
