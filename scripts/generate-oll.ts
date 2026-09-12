/**
 * Derives the 57 canonical OLL cases programmatically using the cube engine (case
 * definitions come from exhaustive orientation-pattern enumeration, independent of any
 * algorithm), finds and independently verifies an algorithm for each, and writes
 * data/algorithms/oll.json. Any case whose algorithm cannot be verified fails the
 * script rather than being written -- there is no fallback to unverified data.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateOllCases } from "@cube-coach/cube-engine/algorithms";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../data/algorithms/oll.json");

async function main(): Promise<void> {
  console.log("Generating OLL cases (this re-derives and re-verifies every algorithm; can take a few minutes)...");
  const cases = generateOllCases();

  if (cases.length !== 57) {
    throw new Error(`Expected exactly 57 OLL cases, got ${cases.length}.`);
  }

  const output = cases.map(({ caseCubie: _caseCubie, ...rest }) => rest);
  await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${output.length} verified OLL cases to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
