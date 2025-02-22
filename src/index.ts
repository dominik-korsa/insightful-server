import 'dotenv/config';

import { fal, Result } from "@fal-ai/client";
import ffmpeg from 'fluent-ffmpeg';
import { Writable } from 'stream';
import path from 'path';
import { WhisperOutput } from '@fal-ai/client/endpoints';

async function mp4toMp3(inputPath: string): Promise<Blob> {
  const chunks: Buffer[] = [];

  const writableStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    }
  });

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .setDuration(10)
      .noVideo()
      .audioCodec('libmp3lame') // Use MP3 codec
      .on('end', () => { resolve(); })
      .on('error', (err: unknown) => reject(err))
      .outputFormat('mp3')
      .pipe(writableStream, { end: true });
  });

  return new Blob([Buffer.concat(chunks)], { type: 'audio/mpeg' });
}

function transcribe(mp3Blob: Blob): Promise<Result<WhisperOutput>> {
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

async function main() {
  console.log('Converting mp4 to mp3...');
  const mp3Blob = await mp4toMp3(path.join(__dirname, 'input.mp4'));
  console.log('Converted mp4 to mp3');
  const transcribeResult = await transcribe(mp3Blob);
  console.log(transcribeResult.data);
  console.log(transcribeResult.requestId);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
