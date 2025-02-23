import { Readable } from "node:stream";

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
const tikTokMobileRegex = /^https:\/\/vm\.tiktok\.com\/\w+\/?$/;
export function checkTikTokUrl(url: string) {
  return tikTokRegex.test(url) || tikTokMobileRegex.test(url);
}

export async function readableToBuffer(readableStream: Readable) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
