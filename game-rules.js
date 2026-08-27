// Pure game rules --- no DOM, no canvas, no timers --- so this stage's core
// rule (random bonus/penalty scoring) can be unit-tested directly, and so the
// rule is provably independent of how it happens to be rendered.

export const FRUITS = [
  { key: "grape", emoji: "🍇" },
  { key: "apple", emoji: "🍎" },
  { key: "banana", emoji: "🍌" },
  { key: "orange", emoji: "🍊" },
  { key: "pear", emoji: "🍐" },
];

export const STAGE_COUNT = 5;
export const STAGE_DURATION_SECONDS = 30;

// Relative fall-speed multiplier per stage (index 0 = stage 1).
export const STAGE_SPEED_MULTIPLIERS = [1, 1.2, 1.4, 1.7, 2];

// Spawn interval multiplier per stage --- lower means fruit arrives more
// often. Falls alongside the speed multiplier so difficulty ramps on both
// axes, per the brief's difficulty-balancing rule.
export const STAGE_SPAWN_INTERVAL_MULTIPLIERS = [1, 0.85, 0.72, 0.6, 0.5];

export const SCORE_BY_ROLE = { normal: 500, bonus: 1000, penalty: -1000 };

/**
 * Randomly assigns one bonus (2x) fruit and one different penalty (-1000)
 * fruit for a stage; the remaining three are normal. `random` is injectable
 * (defaults to Math.random) so tests can pin the outcome.
 */
export function assignStageRoles(random = Math.random) {
  const keys = FRUITS.map((f) => f.key);
  // Fisher-Yates shuffle, then take the first two as bonus/penalty --- this
  // guarantees they're always two *different* fruits without a retry loop.
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  const [bonus, penalty, ...normal] = keys;
  return { bonus, penalty, normal };
}

/** Which scoring role a fruit plays this stage. */
export function roleForFruit(roles, fruitKey) {
  if (fruitKey === roles.bonus) return "bonus";
  if (fruitKey === roles.penalty) return "penalty";
  return "normal";
}

/** The integer point delta for catching a fruit with the given role. */
export function scoreForRole(role) {
  return SCORE_BY_ROLE[role];
}
