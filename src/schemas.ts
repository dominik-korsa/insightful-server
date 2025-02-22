import { z } from 'zod';

// TODO: Choose types
export const SlideAssessment = z.enum([
  'opinion',
  'verified-fact',
  'unverified-fact',
  'rhetorical-question',
]);

export const Slide = z.object({
  timestampBeginMs: z.number().positive(),
  durationMs: z.number().positive(),
  transcript: z.string(),
  comment: z.string(),
  assessment: SlideAssessment,
});

export const Movie = z.object({
  slides: z.array(Slide),
});
