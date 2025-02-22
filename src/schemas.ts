import { z } from 'zod';

/// Schema for a sentence or part of a sentence transcription
export const SentenceSchema = z.object({
  /// The text of the sentence
  text: z.string(),
  /// The start time of the sentence in seconds
  startTime: z.number(),
  /// The end time of the sentence in seconds
  endTime: z.number(),
});
  