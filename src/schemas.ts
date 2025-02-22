import { z } from 'zod';

// TODO: Choose types
export const SlideAssessment = z.enum([
  'opinion',
  'verified-fact',
  'unverified-fact',
  'false-information',
]);

export const Link = z.object({
  url: z.string(),
  title: z.string(),
});

export const Slide = z.object({
  timestampBeginMs: z.number().positive(),
  durationMs: z.number().positive(),
  // transcript: z.string(),
  comment: z.optional(z.string()),
  assessment: SlideAssessment,
  links: z.array(Link),
});

export const Movie = z.object({
  slides: z.array(Slide),
});
