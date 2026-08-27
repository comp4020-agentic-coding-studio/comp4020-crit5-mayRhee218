# Crit 5 reflection

**What was the breakthrough that moved the work forward?**

The spec asked for "one rule of the game" to have a focused automated test,
and the obvious candidate — the random bonus/penalty fruit assignment — was
buried inside `main.js`, wired straight into canvas and DOM state. The
breakthrough was refusing to fake that requirement with a DOM-based proxy
test and instead pulling the assignment and scoring logic out into its own
dependency-free module, imported by both the browser and the test file. Once
the game's actual rule engine was something `vitest` could call directly,
"tested" stopped being aspirational. The same instinct paid off again later:
`pnpm check` passing fully didn't mean the game worked — driving the built
page with Playwright caught a CSS bug (a hidden overlay still intercepting
clicks) that no unit test was ever going to find, because it lived entirely
in the gap between "the code is correct" and "the page behaves correctly."

**What did this work change about who I want to be as a software developer?**

It sharpened a distinction I used to blur: a green check suite is evidence,
not proof. Both real bugs I found this week — the overlay swallowing clicks,
and a reveal screen that showed the wrong stage's fruit — only showed up when
I actually played the thing, after the tests were already green. I want to be
the kind of developer who treats "run it and look" as a required step, not an
optional victory lap, and who's willing to flag a conflict (the plan's own
tutorial text breaking a rule the repo already enforced) out loud instead of
quietly picking a side.
