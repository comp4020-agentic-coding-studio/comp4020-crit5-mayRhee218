# Build a Complete Fruit Catching Monkey Game

> **Amendment (crit-5 no-tutorial rule):** Section 11's start-screen "Brief
> instructions" text is dropped. This week's crit spec forbids any on-screen
> or off-screen instructions — the opening screen has to make the first move
> obvious through affordance alone (falling fruit, a visible monkey/basket, an
> idle nudge animation), and play teaches whatever comes next. The title and
> START GAME button stay; the instructional blurb doesn't.
>
> **Amendment (repo file names):** this repo's build pipeline expects
> `index.html`, `main.js`, `styles.css` (already wired into
> `scripts/build.ts`, `.oxlintrc.json`, `.stylelintrc.json`, `tsconfig.json`).
> The game is implemented in those three files rather than
> `script.js`/`style.css`.
>
> **Amendment (bonus/penalty reveal timing):** Section 18 allows revealing the
> bonus/penalty fruit "if there is a deliberate UI design reason to do so."
> Per direct request, the reveal moved from the post-stage result screen to a
> new stage-intro screen shown *before* each stage's fruit starts falling —
> the player still isn't told anything once play is underway, but now goes in
> knowing what to chase and what to dodge rather than finding out
> retroactively. The stage-result screen keeps the score breakdown only.

You are an expert game developer and frontend engineer. Build a complete, polished, playable browser game based on the following specification.

## 1. Game Concept

Create a 2D arcade-style fruit-catching game.

The player controls a **monkey character holding a basket** at the bottom of the screen.

The monkey can move horizontally from left to right using the keyboard:

* `←` Left Arrow: move left
* `→` Right Arrow: move right

Fruits continuously fall from the top of the screen, and the player must move the monkey's basket underneath the falling fruits to catch them.

The objective is to catch as many fruits as possible within the time limit and achieve the highest score.

---

## 2. Fruits

There are exactly five types of fruits:

1. 🍇 Grape
2. 🍎 Apple
3. 🍌 Banana
4. 🍊 Orange
5. 🍐 Pear

Use attractive, easily recognizable visual representations for each fruit. If image assets are not available, use high-quality emoji, SVG, CSS illustrations, or another lightweight visual solution.

---

## 3. Stage-Specific Random Scoring Rules

At the beginning of **every stage**, randomly assign special scoring properties to the five fruits.

For each stage:

* Exactly **one fruit type** becomes the **2× Score Fruit**.
* Exactly **one different fruit type** becomes the **-1000 Penalty Fruit**.
* The remaining three fruit types are **Normal Fruits**.

The assignments must be randomized independently for each stage.

### Scoring

When the player catches a fruit:

* **2× Score Fruit:** adds `1000` points.

  * This is equivalent to doubling the normal `500` point reward.
* **Normal Fruit:** adds `500` points.
* **-1000 Penalty Fruit:** subtracts `1000` points.

The player should receive immediate visual feedback when a fruit is caught, such as:

* `+1000`
* `+500`
* `-1000`

Make the penalty feedback visually distinct from positive scoring feedback.

---

## 4. Game Structure

The game has a total of **5 stages**.

Each stage lasts **30 seconds**.

### Stage progression

* Stage 1: slow fruit falling speed
* Stage 2: slightly faster
* Stage 3: medium-fast
* Stage 4: fast
* Stage 5: fastest

The difficulty should progressively increase from Stage 1 to Stage 5.

Do not simply make fruits move faster without limit. Choose reasonable speeds that remain playable while clearly becoming more difficult.

Suggested relative falling-speed progression:

* Stage 1: 1.0×
* Stage 2: 1.2×
* Stage 3: 1.4×
* Stage 4: 1.7×
* Stage 5: 2.0×

You may fine-tune these values to make the gameplay feel fun and balanced.

---

## 5. Fruit Spawning

Fruits should continuously spawn from random horizontal positions near the top of the screen.

Requirements:

* Fruit spawn positions should be randomized.
* Different fruit types should appear randomly.
* Multiple fruits may be falling simultaneously.
* Fruits should fall toward the bottom of the screen.
* The player catches a fruit when it collides with the monkey's basket.
* Fruits that reach the bottom without being caught should disappear.
* Avoid spawning fruits in a way that makes the game unfair or impossible.

The spawning rate should provide enough opportunities for the player to score while maintaining increasing difficulty.

---

## 6. Player Movement

The monkey should remain near the bottom of the screen.

Controls:

```text
←  Move left
→  Move right
```

Requirements:

* The monkey must not move outside the left or right boundaries of the game area.
* Movement should feel responsive.
* Holding an arrow key should continuously move the monkey.
* The basket should be clearly visible and positioned so that falling fruits can collide with it.
* The monkey should visually face or move toward the direction of movement if practical.

Also consider supporting smooth movement rather than moving only in discrete steps.

---

## 7. Timer

Each stage lasts exactly **30 seconds**.

Display a clearly visible countdown timer.

Example:

```text
TIME: 30
```

The timer should count down in real time:

```text
30 → 29 → 28 → ... → 1 → 0
```

When the timer reaches zero:

1. Stop spawning new fruits.
2. Finish the current stage.
3. Show the stage result.
4. Allow the player to proceed to the next stage.

---

## 8. Stage Transition

At the end of each stage, display a short stage-result screen or overlay.

Show:

* Current stage
* Score earned during the stage
* Total score
* The special fruit for that stage
* The penalty fruit for that stage

Then provide a button such as:

**NEXT STAGE**

The next stage should begin with a newly randomized special fruit and penalty fruit.

Do not automatically reveal the special fruit and penalty fruit before the player catches them unless there is a deliberate UI design reason to do so.

---

## 9. Final Result

After Stage 5 ends, display a final result screen.

Show:

* `GAME COMPLETE!`
* Final score
* Score earned in each stage
* Total number of fruits caught
* Highest-scoring stage

Include a prominent:

**PLAY AGAIN**

button.

Clicking PLAY AGAIN must completely reset the game:

* Score → 0
* Stage → 1
* Timer → 30
* Fruit count → 0
* New random scoring assignments
* All falling fruits cleared

---

## 10. User Interface

Create a colorful, fun arcade-game interface appropriate for the monkey and fruit theme.

The main game screen should clearly display:

```text
Stage: 1 / 5
Score: 2500
Time: 24
```

The game should have:

* A visually appealing sky/background
* Monkey character at the bottom
* Basket
* Falling fruits
* Score display
* Timer
* Stage indicator
* Start/restart controls
* Stage transition overlay
* Final result screen

Make the UI easy to understand without requiring instructions after the initial game start.

---

## 11. Start Screen

Before gameplay begins, show a title screen.

Example:

**🍌 MONKEY FRUIT CATCH 🍎**

Include a:

**START GAME**

button.

(No instructions blurb — see amendment above. The idle scene itself — a
visible monkey and basket under a lazily drifting fruit or two — has to make
the first move obvious.)

---

## 12. Game Feel and Visual Feedback

Make the game feel responsive and satisfying.

When a fruit is caught:

* Play a small visual effect.
* Display the points gained/lost near the basket.
* Briefly animate the score change if appropriate.

Consider adding:

* Small particle effects
* Fruit-catching animation
* Basket movement animation
* Subtle screen feedback for the penalty fruit
* Stage transition animation

Keep the effects lightweight so the game remains smooth.

---

## 13. Audio

If practical, add simple sound effects for:

* Catching a normal fruit
* Catching the bonus fruit
* Catching the penalty fruit
* Stage completion
* Game completion

If external audio assets are unavailable, use Web Audio API-generated simple sounds instead.

The game must still work correctly if audio is unavailable or disabled.

---

## 14. Responsive Design

The game should work on different screen sizes.

Prioritize:

* Desktop browsers
* Laptop screens
* Tablet-sized screens

The game area should maintain a sensible aspect ratio and scale appropriately.

Keyboard controls must work reliably on desktop.

If practical, also add optional touch controls for mobile/tablet users:

* Touch/hold left side → move left
* Touch/hold right side → move right

However, keyboard controls are the primary requirement.

---

## 15. Technical Requirements

Build this as a complete working browser game.

Prefer a simple architecture that is easy to understand and maintain.

Use:

* HTML
* CSS
* JavaScript

You may use Canvas API if it makes the game implementation cleaner.

Avoid unnecessary external dependencies.

If you use a framework or library, explain why it is necessary.

The game should run locally without requiring a backend server.

---

## 16. Game Logic Requirements

Implement the game using a proper game loop.

The game loop should handle:

* Player movement
* Fruit spawning
* Fruit movement
* Collision detection
* Fruit removal
* Score calculation
* Timer updates
* Stage progression
* Rendering
* Animations

Make sure collision detection between the basket and falling fruits is reliable.

Prevent a single fruit from being counted multiple times.

---

## 17. Randomization Rules

At the start of every stage:

1. Randomly select one fruit as the 2× Score Fruit.
2. Randomly select one DIFFERENT fruit as the -1000 Penalty Fruit.
3. Assign the remaining three fruits as normal +500 fruits.

For example:

```text
Stage 1
Bonus: Banana
Penalty: Apple
Normal: Grape, Orange, Pear
```

Stage 2 must independently randomize the assignments again.

The same bonus/penalty combination may technically occur again by chance, but the game should perform a fresh random selection for every stage.

---

## 18. Important Gameplay Rule

The player should **not be explicitly told which fruit is the bonus fruit or penalty fruit during normal gameplay**.

The player should discover the scoring properties through gameplay.

However, after the stage ends, the result screen may reveal:

```text
Bonus Fruit: 🍌 Banana
Penalty Fruit: 🍎 Apple
```

This creates an element of surprise and strategy.

---

## 19. Score Handling

Use an integer score.

Starting score:

```text
0
```

Scoring:

```text
Normal fruit = +500
Bonus fruit = +1000
Penalty fruit = -1000
```

The score may become negative if the player catches too many penalty fruits.

Do not allow numerical bugs, NaN values, or floating-point scoring issues.

---

## 20. Difficulty Balancing

The game should feel progressively harder.

Increase difficulty primarily through:

* Falling speed
* Spawn frequency
* Number of simultaneous falling fruits

However, maintain fair gameplay.

Stage 1 should be comfortable for a new player.

Stage 5 should be challenging even for a skilled player.

---

## 21. Code Quality

Write clean, organized, maintainable code.

Separate concerns where reasonable:

* Game state
* Player
* Fruit
* Collision detection
* Scoring
* Stage management
* UI
* Input handling
* Rendering

Use descriptive variable and function names.

Add comments for important game logic, especially:

* Stage randomization
* Collision detection
* Scoring
* Stage transitions
* Timer management

---

## 22. Edge Cases

Make sure the following cases work correctly:

* The player presses both left and right simultaneously.
* The player holds an arrow key.
* The player reaches the edge of the screen.
* A fruit reaches the bottom.
* A fruit is caught exactly at the bottom edge.
* The timer reaches zero while fruits are still falling.
* The player catches multiple fruits in rapid succession.
* The score becomes negative.
* The player restarts after completing the game.
* The player restarts during a stage.
* Browser window is resized.
* The game loses and regains browser focus.

---

## 23. Deliverables

Create all necessary files for the complete game.

At minimum, provide (see file-naming amendment above):

```text
index.html
styles.css
main.js
```

If you use additional assets or files, include them as necessary.

The final result must be immediately playable in a modern browser.

---

## 24. Final Instruction

Do not merely describe how to build the game.

**Actually implement the complete game.**

Before finishing:

1. Review all game mechanics.
2. Verify that all five fruits are implemented.
3. Verify the random bonus and penalty assignment for every stage.
4. Verify the 500 / 1000 / -1000 scoring system.
5. Verify that each stage lasts 30 seconds.
6. Verify that there are exactly 5 stages.
7. Verify that falling speed increases from Stage 1 to Stage 5.
8. Verify that ← and → controls work correctly.
9. Verify collision detection.
10. Verify the restart functionality.
11. Fix any obvious bugs or gameplay issues.
12. Make the final game polished, visually appealing, and fun to play.

If you are operating in an environment where you can create and run files, create the files and test the game rather than only providing code snippets.
