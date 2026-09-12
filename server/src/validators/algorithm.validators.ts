import { z } from "zod";

export const listAlgorithmsQuerySchema = z.object({
  type: z.enum(["OLL", "PLL", "F2L"]).optional(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  category: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
});

export type ListAlgorithmsQuery = z.infer<typeof listAlgorithmsQuerySchema>;
