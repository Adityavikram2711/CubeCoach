/**
 * Derives F2L case definitions programmatically using the cube engine and verifies
 * every generated algorithm against actual cube state before writing
 * data/algorithms/f2l.json.
 *
 * SCOPE NOTE: this produces the 24 cases where the target corner and edge are both
 * still in the top layer, unpaired (3 corner orientations x 4 relative edge positions x
 * 2 edge orientations). The traditional speedcubing "41 F2L cases" sheet also includes
 * cases where a piece is already sitting in a slot and must be extracted first; since
 * that 41-case split is a curated convention rather than something derivable from the
 * cube's structure, and inventing a taxonomy for it risks presenting guessed case
 * definitions as verified fact, this generator is scoped to the mathematically
 * well-defined subset. See the Phase 7 report's Known Issues section.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateF2lCases } from "@cube-coach/cube-engine/algorithms";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../data/algorithms/f2l.json");

async function main(): Promise<void> {
  console.log("Generating F2L cases...");
  const cases = generateF2lCases();

  if (cases.length !== 24) {
    throw new Error(`Expected exactly 24 F2L cases, got ${cases.length}.`);
  }

  const output = cases.map(({ caseCubie: _caseCubie, ...rest }) => rest);
  await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${output.length} verified F2L cases to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
