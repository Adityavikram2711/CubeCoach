import { z } from "zod";

export const recordPracticeSchema = z.object({
  success: z.boolean(),
});

export type RecordPracticeRequest = z.infer<typeof recordPracticeSchema>;
