import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Mechanically-checkable slice of this week's spec (crits/05-game). Deploy-live
// and process-evidence are already covered by CI and check-evidence.ts, so they
// aren't repeated here. Three lines are judged live at the crit, not here,
// because they don't exist until the mechanic does:
//   - "it can be lost ... play ends somewhere" and "one rule has a focused
//     automated test" — write that test yourself once you've picked the
//     mechanic; it belongs next to this file as another `describe` block, not
//     invented generically here.
//   - "a stranger can pick it up and reach an ending inside five minutes" —
//     only your pod playing it cold can tell you that.
//   - "one change came from playing rather than reading the code" — cite it in
//     PROCESS.md.
// The two checks below are heuristic proxies for "it teaches itself" and
// "playable by more than a mouse" — necessary, not sufficient; they can't
// catch a tutorial written as prose in a way that dodges the banned words, or
// a control that's focusable but still unusable.
const DIST = resolve("dist");

function files(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const shipped = files();
const pages = shipped
  .filter((path) => path.endsWith(".html"))
  .map((path) => new JSDOM(readFileSync(path, "utf8")).window.document);

const NO_TUTORIAL_PATTERN = /how (to|do you) play|instructions?|tutorial|controls?:|click here to start|press .* to play/i;

describe("crit 5: a game", () => {
  it("has no on-screen tutorial text or how-to-play modal", () => {
    for (const doc of pages) {
      const text = doc.body?.textContent ?? "";
      expect(
        NO_TUTORIAL_PATTERN.test(text),
        `${doc.title || "a page"} contains instructional text --- the opening screen has to teach by affordance, not words`,
      ).toBe(false);
    }
  });

  it("gives the player at least one focusable control, so it's playable by keyboard as well as mouse or touch", () => {
    const playable = pages.some(
      (doc) => doc.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])').length > 0,
    );
    expect(
      playable,
      "no focusable control found on any page --- a stranger with only a keyboard couldn't play this",
    ).toBe(true);
  });
});
