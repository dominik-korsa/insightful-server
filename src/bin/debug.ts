import 'dotenv/config';
import { downloadMp4, mp4toMp3, transcribe, processWhisperResult } from "../video.js";

import fs from 'fs';
import path from 'path';
import { WhisperOutput } from '@fal-ai/client/endpoints';

async function main() {
  const transcript = JSON.parse(await fs.promises.readFile(path.join(import.meta.dirname, '../../local/transcript.json'), 'utf-8')) as WhisperOutput;

  await processWhisperResult(transcript, false)
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
