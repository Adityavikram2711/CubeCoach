import { COLORS } from "@cube-coach/cube-engine";
import { z } from "zod";

export const solveCubeRequestSchema = z.object({
  cube: z.array(z.enum(COLORS)).length(54, "cube must contain exactly 54 facelets"),
});

export type SolveCubeRequest = z.infer<typeof solveCubeRequestSchema>;
