export function requireEnv(name: string) {
  if (process.env[name] === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return process.env[name];
}

const regex = /^https:\/\/(www\.)?instagram\.com\/share\/reel\/([a-zA-Z0-9-_]+)$/;
export function checkInstagramUrl(url: string) {
  return regex.test(url);
}
