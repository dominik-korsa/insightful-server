import { z } from 'zod';

export const SlideAssessment = z.enum([
  'opinion',
  'verified-fact',
  'unverified-fact',
  'false-information',
  'misleading',
  'satire',
  'unclassified'
]);

export const Link = z.object({
  url: z.string(),
  title: z.string(),
});

export const SlideAnalysis = z.object({
  text_part: z.string(),
  category: SlideAssessment,
  explanation: z.string().max(40),
  word_indexes: z.tuple([z.number(), z.number()]),
  links: Link,
  suggestions: z.array(z.string()),
});
export type SlideAnalysis = z.infer<typeof SlideAnalysis>;

export const Slide = z.object({
  timestampBeginMs: z.number().positive(),
  durationMs: z.number().positive(),
  comment: z.optional(z.string()),
  assessment: SlideAssessment,
  links: z.array(Link),
  suggestions: z.array(z.string()),
});
export type Slide = z.infer<typeof Slide>;

export const Movie = z.object({
  slides: z.array(Slide),
});
export type Movie = z.infer<typeof Movie>
