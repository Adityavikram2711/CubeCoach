import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest.config.ts doesn't set test.globals, so React Testing Library's automatic
// afterEach(cleanup) never registers itself -- without this, DOM from one test's
// render() call leaks into the next test in the same file, causing spurious
// "multiple elements found" failures.
afterEach(() => {
  cleanup();
});
