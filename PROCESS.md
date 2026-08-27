# Process overview

## What I built

Monkey Fruit Catch: a Canvas-based arcade game where you steer a monkey's
basket left/right to catch five kinds of falling fruit across five 30-second
stages. Each stage picks one fruit as a 2x bonus and a different one as a
-1000 penalty at random, revealed on a stage-intro screen right before that
stage's fruit starts falling, then never mentioned again until the score
breakdown at the end. Difficulty ramps stage to stage via faster fall speed
and a shorter spawn interval; the run ends with a final breakdown and a
one-click restart.

## The moments that mattered

1. **The plan's own start-screen text broke a rule the repo already
   enforced.** PLAN.md's spec called for an on-screen "Move the monkey with
   ← and →" blurb, but `spec/crit-5.test.ts`'s `NO_TUTORIAL_PATTERN` check
   (already in the repo before the game existed) explicitly bans exactly that
   kind of text — this crit's spec requires the opening screen to teach by
   affordance, not words. Rather than silently keep the blurb (failing the
   test) or silently drop it (quietly overriding the plan), I flagged the
   conflict and got an explicit call before writing any game code, then
   recorded it as an amendment at the top of PLAN.md rather than editing the
   brief's own words. The shipped start screen has no instructional text —
   only an idle monkey/fruit animation — and the no-tutorial test passes
   against the built page.
   [`bb67e08`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mayRhee218/commit/bb67e08)

2. **The one rule the spec wants a focused test for had nothing to import.**
   The bonus/2x and penalty/-1000 role assignment lived entirely inside
   `main.js`'s closures, tangled up with canvas and DOM state — there was no
   way to unit-test it without either re-implementing the logic in the test
   (proving nothing) or faking it through a DOM proxy. Instead of doing
   either, I pulled `assignStageRoles`/`roleForFruit`/`scoreForRole` out into
   a dependency-free `game-rules.js` module, switched `main.js`/`index.html`
   to an ES-module script so the browser and `vitest` import the exact same
   file, and added `allowJs`/`checkJs` to `tsconfig.json` so `tsc` could
   still type-check the test against it. `pnpm check` now runs real
   assertions on the actual algorithm (exactly one bonus and one different
   penalty per stage, 2x/-1000 scoring, re-shuffled every call) instead of a
   DOM heuristic.
   [`0179875`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mayRhee218/commit/0179875)

3. **`pnpm check` was fully green and the game still didn't work.** Driving
   the built page with Playwright — not just running the test suite — the
   very first click on START GAME hung. Playwright's own timeout log named
   the cause: `#final-result`, which carries the `hidden` attribute, was
   still intercepting pointer events. `.overlay { display: flex }` and the
   browser's default `[hidden] { display: none }` have equal specificity, and
   the author stylesheet wins the tie, so every overlay was laid out and
   click-active regardless of `hidden`. I added `.overlay[hidden] { display:
   none; }` rather than reaching for `!important` or restructuring the
   markup, then re-ran the same Playwright script end to end (start screen →
   catch fruit → stage-1 result → next stage) with zero console errors before
   trusting it again.
   [`c8893cf`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mayRhee218/commit/c8893cf)

4. **Playing it surfaced a design mistake the tests couldn't catch.** After
   actually playing a full stage, the bonus/penalty reveal on the
   stage-result screen turned out to be useless — it named the fruit that had
   mattered for the stage that had *just ended*, not the one about to start:

   > The bonus/penalty fruits are currently appearing at the end of the stage
   > instead of at the beginning. Please show the bonus/penalty fruits for
   > each stage before that stage starts.

   I moved role assignment out of `startStage` into a new `prepareStage`
   step and added a stage-intro overlay that reveals the stage's fruit roles
   before any fruit falls, trimming the post-stage screen back to the score
   only — rather than showing the reveal in both places, which would have
   been redundant, or silently ignoring PLAN.md section 18's default
   "don't reveal during play" guidance (its own text carves out an exception
   "if there is a deliberate UI design reason to do so", which this is: the
   player still learns nothing new once a stage is underway). Re-verified
   with Playwright: START GAME now lands on a "STAGE 1 / 5" screen naming
   both fruits before "START STAGE" begins the timer.
   [`636c86e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mayRhee218/commit/636c86e)
