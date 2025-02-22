import { fal, Result } from "@fal-ai/client";
import ffmpeg from 'fluent-ffmpeg';
import { Readable, Writable } from 'stream';
import { WhisperOutput } from '@fal-ai/client/endpoints';
import { readFileSync } from 'fs';
import { SlideAnalysis, Slide } from './schemas.js';
import { z } from 'zod';
import got from "got";
import path from "path";
import * as fs from "node:fs";

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
      .setDuration(30)
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
    return got.get(videoUrl).buffer();
}

async function createPrompt(input_text: string): Promise<string> {
  const promptTemplate = await fs.promises.readFile(
      path.join(import.meta.dirname, '../assets/prompt.txt'), 'utf-8');
  return `${promptTemplate}\n"${input_text}"\nOutput JSON:`;
}

async function analyzeSlide(prompt: string): Promise<z.infer<typeof SlideAnalysis> | null> {
  try {
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

    console.log("Result data: ", result.data.output);

    const parsedResult = SlideAnalysis.safeParse(result.data.output);
    if (!parsedResult.success) {
      console.error("Validation error:", parsedResult.error);
      return null;
    }

    return parsedResult.data;
  } catch (error) {
    console.error("Error analyzing slide:", error);
    return null;
  }
}

export async function processWhisperResult(whisperResult: Result<WhisperOutput>): Promise<z.infer<typeof Slide> | null> {
  const input_text = whisperResult.data.text
  const prompt = await createPrompt(input_text);
  console.log(prompt)
  const analysis = await analyzeSlide(prompt);
  console.log(analysis)
  if (!analysis) return null;

  const { word_indexes } = analysis;
  const startIdx = word_indexes[0];
  const endIdx = word_indexes[1];

  const wordTimings = whisperResult.data.chunks;
  if (!wordTimings || wordTimings.length === 0) return null;

  const timestampBeginMs = Number(wordTimings[startIdx]?.timestamp[0]);
  const timestampEndMs = Number(wordTimings[endIdx]?.timestamp[1]);
  const durationMs = timestampEndMs - timestampBeginMs;

  // Merge analysis into Slide format
  const slide: z.infer<typeof Slide> = {
    timestampBeginMs,
    durationMs,
    comment: undefined, // Optional, can be added later
    assessment: analysis.category,
    links: Array.isArray(analysis.links) ? analysis.links : [analysis.links],
    suggestions: analysis.suggestions,
  };

  console.log("Generated Slide:", slide);
  return slide;
}

