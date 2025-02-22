import 'dotenv/config';

import { startServer } from './server';

async function main() {
  await startServer();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
