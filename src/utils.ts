export function requireEnv(name: string) {
  if (process.env[name] === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return process.env[name];
}

const instagramRegex = /^https:\/\/(www\.)?instagram\.com\/share\/reel\/([a-zA-Z0-9-_]+)$/;
export function checkInstagramUrl(url: string) {
  return instagramRegex.test(url);
}

const tikTokRegex = /^https:\/\/(www\.)?tiktok\.com\/.+$/;
export function checkTikTokUrl(url: string) {
  return tikTokRegex.test(url);
}
