import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { FRUITS, assignStageRoles, roleForFruit, scoreForRole } from "../game-rules.js";

// Mechanically-checkable slice of this week's spec (crits/05-game). Deploy-live
// and process-evidence are already covered by CI and check-evidence.ts, so they
// aren't repeated here. Two lines are judged live at the crit, not here:
//   - "a stranger can pick it up and reach an ending inside five minutes" —
//     only your pod playing it cold can tell you that.
//   - "one change came from playing rather than reading the code" — cite it in
//     PROCESS.md.
// "it can be lost ... play ends somewhere" is satisfied structurally: the game
// always ends in a finish after stage 5 (see main.js's endStage), and a wrong
// move (catching the penalty fruit) is always possible and always costs
// points — the "one rule ... focused automated test" line below on the
// bonus/penalty rule that makes that wrong move possible.
// The two DOM checks below are heuristic proxies for "it teaches itself" and
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

  // The focused automated test the spec asks for: the one rule that makes a
  // wrong move possible (catching the -1000 penalty fruit) and rewarding
  // (catching the 2x bonus fruit).
  it("assigns exactly one bonus and one different penalty fruit each stage, scored at 2x and -1000", () => {
    for (let trial = 0; trial < 50; trial++) {
      const roles = assignStageRoles();
      expect(roles.bonus).not.toBe(roles.penalty);
      expect(FRUITS.map((f) => f.key)).toContain(roles.bonus);
      expect(FRUITS.map((f) => f.key)).toContain(roles.penalty);
      expect(roles.normal).toHaveLength(3);
      expect(new Set([roles.bonus, roles.penalty, ...roles.normal]).size).toBe(5);
    }

    const roles = assignStageRoles();
    expect(scoreForRole(roleForFruit(roles, roles.bonus))).toBe(1000);
    expect(scoreForRole(roleForFruit(roles, roles.penalty))).toBe(-1000);
    expect(scoreForRole(roleForFruit(roles, roles.normal[0]))).toBe(500);
    expect(scoreForRole("bonus")).toBe(scoreForRole("normal") * 2);
  });

  it("draws bonus and penalty independently each call, not from a fixed pair", () => {
    // With a real RNG this is probabilistic, not exhaustive --- it's here to
    // catch a hard-coded or non-reshuffled assignment, not to prove fairness.
    const seen = new Set<string>();
    for (let trial = 0; trial < 30; trial++) {
      const roles = assignStageRoles();
      seen.add(`${roles.bonus}/${roles.penalty}`);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
