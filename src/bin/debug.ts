import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { WhisperOutput } from '@fal-ai/client/endpoints';

async function main() {
  const transcript = JSON.parse(await fs.promises.readFile(path.join(import.meta.dirname, '../../local/transcript.json'), 'utf-8')) as WhisperOutput;
  console.log(transcript);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
