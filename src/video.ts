import {fal, Result} from "@fal-ai/client";
import ffmpeg from 'fluent-ffmpeg';
import {Readable, Writable} from 'stream';
import {WhisperOutput} from '@fal-ai/client/endpoints';
import {Movie, Slide, SlideAnalysis} from './schemas.js';
import {z} from 'zod';
import got from "got";
import path from "path";
import * as fs from "node:fs";
import { ElevenLabsClient } from "elevenlabs";
import { readableToBuffer } from "./utils.js";

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
      .on('end', () => {
        resolve();
      })
      .on('error', (err: unknown) => reject(err))
      .outputFormat('mp3')
      .pipe(writableStream, {end: true});
  });

  return new Blob([Buffer.concat(chunks)], {type: 'audio/mpeg'});
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

export async function downloadMp4(videoUrl: string) {
  const response = await got.get(videoUrl, { responseType: 'buffer' });

  return {
    buffer: response.body,
    contentType: response.headers['content-type'] || 'application/octet-stream',
  };
}

async function createPrompt(input_text: string): Promise<string> {
  const promptTemplate = await fs.promises.readFile(
    path.join(import.meta.dirname, '../assets/prompt.txt'), 'utf-8');
  return `${promptTemplate}\n"${input_text}"\nOutput JSON:`;
}

const TranscriptAnalysisResponse = z.object({
  segments: z.array(SlideAnalysis),
});

async function analyzeSlide(prompt: string): Promise<SlideAnalysis[]> {
  const result = await fal.subscribe("fal-ai/any-llm", {
    input: {
      model: "openai/gpt-4o",
      prompt: prompt
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    }
  });

  return TranscriptAnalysisResponse.parse(JSON.parse(result.data.output)).segments;
}

export async function processWhisperResult(whisperResult: WhisperOutput, generateVoiceover: boolean): Promise<Movie> {
  const input_text = whisperResult.text
  const prompt = await createPrompt(input_text);
  const analysis = await analyzeSlide(prompt);

  const chunks = whisperResult.chunks;
  if (chunks === undefined) {
    throw new Error("No word timings found");
  }

  const getTimestamp = (item: SlideAnalysis, id: number): number => {
    return Number(chunks[item.word_indexes[id]].timestamp[id]);
  }

  const slides: Slide[] = await Promise.all(analysis.map(async (item) => ({
    timestampBeginS: getTimestamp(item, 0),
    durationS: getTimestamp(item, 1) - getTimestamp(item, 0),
    assessment: item.assessment,
    explanation: item.explanation,
    links: item.links,
    suggestions: item.suggestions,
    transcript: item.text_part,
    voiceoverMp3: generateVoiceover && item.explanation !== null ? (await createTranscript(item.explanation)).toString('base64') : null,
  })));

  return { slides: slides };
}

export async function createTranscript(text: string): Promise<Buffer> {
  const client = new ElevenLabsClient();
  const readable = await client.textToSpeech.convertAsStream("9BWtsMINqrJLrRacOk9x", {
    text,
    model_id: 'eleven_flash_v2_5',
  });
  return readableToBuffer(readable);
}
