/**
 * Seeds canonical algorithm/lesson/resource data from data/ into MongoDB.
 * Safe to run repeatedly (upserts by caseId, no duplicates created on re-run).
 *
 * Every record is validated against algorithmDocSchema (correct shape, and that its
 * algorithm string actually parses via the shared cube engine's parser) before any
 * write happens -- a single malformed record fails the whole run rather than partially
 * seeding, since data/algorithms/*.json is meant to contain only generator output that
 * has already passed full geometric verification (see shared/cube-engine/src/algorithms
 * and scripts/generate-{oll,pll,f2l}.ts).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COLORS, parseAlgorithm } from "@cube-coach/cube-engine";
import mongoose from "mongoose";
import { z } from "zod";
import { Algorithm } from "../server/src/models/algorithm.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");

const algorithmDocSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  name: z.string().min(1),
  category: z.string().min(1).optional(),
  setup: z.string().min(1).optional(),
  recognition: z.string().min(1),
  algorithm: z.string().min(1),
  alternatives: z.array(z.string()),
  fingerTricks: z.string().min(1),
  notes: z.string().min(1),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  videoUrl: z.string().url().optional(),
  scrambledState: z.array(z.enum(COLORS)).length(54),
});

async function loadJson<T>(relativePath: string): Promise<T> {
  const raw = await readFile(path.join(dataDir, relativePath), "utf-8");
  return JSON.parse(raw) as T;
}

function validateSet(type: "OLL" | "PLL" | "F2L", raw: unknown[]): Array<z.infer<typeof algorithmDocSchema> & { type: string }> {
  return raw.map((entry, index) => {
    const parsed = algorithmDocSchema.safeParse(entry);
    if (!parsed.success) {
      throw new Error(`${type}[${index}] failed schema validation: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
    }
    try {
      parseAlgorithm(parsed.data.algorithm);
    } catch (err) {
      throw new Error(`${type}[${index}] (${parsed.data.id}) has an algorithm that fails to parse: "${parsed.data.algorithm}" -- ${(err as Error).message}`);
    }
    return { ...parsed.data, type };
  });
}

async function main(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/cubecoach";

  const [ollRaw, pllRaw, f2lRaw] = await Promise.all([
    loadJson<unknown[]>("algorithms/oll.json"),
    loadJson<unknown[]>("algorithms/pll.json"),
    loadJson<unknown[]>("algorithms/f2l.json"),
  ]);

  console.log(`Loaded ${ollRaw.length} OLL, ${pllRaw.length} PLL, ${f2lRaw.length} F2L cases from data/algorithms.`);

  if (ollRaw.length === 0 && pllRaw.length === 0 && f2lRaw.length === 0) {
    console.log("No algorithm data to seed yet. Skipping database write.");
    return;
  }

  const validated = [...validateSet("OLL", ollRaw), ...validateSet("PLL", pllRaw), ...validateSet("F2L", f2lRaw)];
  console.log(`All ${validated.length} algorithm records passed schema + parser validation.`);

  await mongoose.connect(mongodbUri);
  console.log("Connected to MongoDB for seeding.");

  try {
    const operations = validated.map(({ id, ...rest }) => ({
      updateOne: {
        filter: { caseId: id },
        update: { $set: { caseId: id, ...rest } },
        upsert: true,
      },
    }));

    const result = await Algorithm.bulkWrite(operations, { ordered: true });
    console.log(`Seed complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated, ${validated.length} total records in sync.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exitCode = 1;
});
