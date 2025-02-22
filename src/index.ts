import 'dotenv/config';

import { startServer } from './server.js';

async function main() {
  await startServer();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
