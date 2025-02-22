import 'dotenv/config';

import path from 'path';
import { mp4toMp3, transcribe } from './video';

async function main() {
  console.log('Converting mp4 to mp3...');
  const mp3Blob = await mp4toMp3(path.join(__dirname, '../input.mp4'));
  console.log('Converted mp4 to mp3');
  const transcribeResult = await transcribe(mp3Blob);
  console.log(transcribeResult.data);
  console.log(transcribeResult.requestId);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
