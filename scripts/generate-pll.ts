/**
 * Derives the 21 canonical PLL cases (hand-specified structural permutations plus
 * programmatically-found combined cycles, deduplicated by AUF orbit -- see
 * shared/cube-engine/src/algorithms/generatePllCases.ts for the full rationale), finds
 * and independently verifies a fully-solving algorithm for each, and writes
 * data/algorithms/pll.json.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatePllCases } from "@cube-coach/cube-engine/algorithms";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../data/algorithms/pll.json");

async function main(): Promise<void> {
  console.log("Generating PLL cases...");
  const cases = generatePllCases();

  if (cases.length !== 21) {
    throw new Error(`Expected exactly 21 PLL cases, got ${cases.length}.`);
  }

  const output = cases.map(({ caseCubie: _caseCubie, ...rest }) => rest);
  await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${output.length} verified PLL cases to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
