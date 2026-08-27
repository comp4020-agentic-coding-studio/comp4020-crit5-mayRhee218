// Monkey Fruit Catch --- entry point. Wires the pure rules in game-rules.js to
// the canvas, HUD and overlays, and runs the game loop. No tutorial text
// anywhere (see PLAN.md's amendment): the start screen demonstrates the
// mechanic with an idle preview instead of describing it.
import {
  FRUITS,
  STAGE_COUNT,
  STAGE_DURATION_SECONDS,
  STAGE_SPEED_MULTIPLIERS,
  STAGE_SPAWN_INTERVAL_MULTIPLIERS,
  assignStageRoles,
  roleForFruit,
  scoreForRole,
} from "./game-rules.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const gameRoot = document.getElementById("game-root");
const hud = document.getElementById("hud");
const hudStage = document.getElementById("hud-stage");
const hudScore = document.getElementById("hud-score");
const hudTime = document.getElementById("hud-time");
const popupLayer = document.getElementById("popup-layer");

const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");

const stageIntroScreen = document.getElementById("stage-intro");
const stageIntroHeading = document.getElementById("stage-intro-heading");
const stageIntroBonus = document.getElementById("stage-intro-bonus");
const stageIntroPenalty = document.getElementById("stage-intro-penalty");
const beginStageBtn = document.getElementById("begin-stage-btn");

const stageResultScreen = document.getElementById("stage-result");
const stageResultHeading = document.getElementById("stage-result-heading");
const stageResultScore = document.getElementById("stage-result-score");
const stageResultTotal = document.getElementById("stage-result-total");
const nextStageBtn = document.getElementById("next-stage-btn");

const finalScreen = document.getElementById("final-result");
const finalScore = document.getElementById("final-score");
const finalBreakdown = document.getElementById("final-breakdown");
const finalExtra = document.getElementById("final-extra");
const playAgainBtn = document.getElementById("play-again-btn");

const touchLeft = document.getElementById("touch-left");
const touchRight = document.getElementById("touch-right");

const FRUIT_BY_KEY = new Map(FRUITS.map((f) => [f.key, f]));

// --- Tunable geometry / pacing (CSS-pixel units, matched to the canvas's
// displayed size --- see resizeCanvas). ------------------------------------
const PLAYER_WIDTH = 96;
const BASKET_HEIGHT = 40;
const BASKET_BOTTOM_MARGIN = 26;
const PLAYER_SPEED = 420; // px/s
const FRUIT_RADIUS = 24;
const BASE_FALL_SPEED = 120; // px/s, stage 1
const BASE_SPAWN_INTERVAL = 0.85; // seconds, stage 1
const MAX_DT = 0.05; // clamp so a backgrounded tab can't skip a stage's worth of time

// --- Mutable game state -----------------------------------------------------
const state = {
  mode: "start", // "start" | "playing" | "stage-result" | "final"
  stage: 1,
  score: 0,
  stageScores: [],
  fruitsCaught: 0,
  roles: assignStageRoles(),
  timeRemaining: STAGE_DURATION_SECONDS,
  spawnTimer: 0,
  spawnInterval: BASE_SPAWN_INTERVAL,
  fruits: [], // { key, x, y, caught }
  player: { x: 0 },
  pressedKeys: new Set(),
  idleT: 0,
};

let width = 0;
let height = 0;

function resizeCanvas() {
  const rect = gameRoot.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  width = rect.width;
  height = rect.height;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.player.x = width / 2;
}

if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(resizeCanvas).observe(gameRoot);
} else {
  window.addEventListener("resize", resizeCanvas);
}
resizeCanvas();

// --- Audio (Web Audio API tones --- no external assets, and the game plays
// fine if audio is blocked or unsupported). --------------------------------
let audioCtx = null;

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

function beep(freq, duration, type = "sine", peak = 0.2) {
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ac.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.02);
  } catch {
    // Audio is a nice-to-have; the game must still work without it.
  }
}

function playCatchSound(role) {
  if (role === "bonus") {
    beep(880, 0.16, "triangle", 0.2);
    setTimeout(() => beep(1320, 0.16, "triangle", 0.16), 60);
  } else if (role === "penalty") {
    beep(140, 0.35, "sawtooth", 0.25);
  } else {
    beep(520, 0.12, "sine", 0.15);
  }
}

function playChime(freqs) {
  freqs.forEach((f, i) => setTimeout(() => beep(f, 0.22, "triangle", 0.18), i * 130));
}

// --- Input -------------------------------------------------------------
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    state.pressedKeys.add(e.key);
  }
});
window.addEventListener("keyup", (e) => {
  state.pressedKeys.delete(e.key);
});
window.addEventListener("blur", () => state.pressedKeys.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) state.pressedKeys.clear();
});

function bindHold(el, key) {
  const press = (e) => {
    e.preventDefault();
    state.pressedKeys.add(key);
  };
  const release = () => state.pressedKeys.delete(key);
  el.addEventListener("pointerdown", press);
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  el.addEventListener("pointerleave", release);
}
bindHold(touchLeft, "ArrowLeft");
bindHold(touchRight, "ArrowRight");

// --- Screen management ---------------------------------------------------
function showOverlay(el) {
  el.hidden = false;
}
function hideOverlay(el) {
  el.hidden = true;
}

function setMode(mode) {
  state.mode = mode;
  hideOverlay(startScreen);
  hideOverlay(stageIntroScreen);
  hideOverlay(stageResultScreen);
  hideOverlay(finalScreen);
  hud.hidden = mode !== "playing";
  if (mode === "start") showOverlay(startScreen);
  if (mode === "stage-intro") showOverlay(stageIntroScreen);
  if (mode === "stage-result") showOverlay(stageResultScreen);
  if (mode === "final") showOverlay(finalScreen);
}

// --- Stage lifecycle -------------------------------------------------------
function currentSpeedMultiplier() {
  return STAGE_SPEED_MULTIPLIERS[state.stage - 1];
}
function currentSpawnMultiplier() {
  return STAGE_SPAWN_INTERVAL_MULTIPLIERS[state.stage - 1];
}

// Assigns the upcoming stage's fruit roles and shows them before any fruit
// falls, so "before that stage starts" is a real reveal rather than a
// mid-stage hint --- the player still isn't told anything once play begins.
function prepareStage(stageNumber) {
  state.stage = stageNumber;
  state.roles = assignStageRoles();
  const bonusFruit = FRUIT_BY_KEY.get(state.roles.bonus);
  const penaltyFruit = FRUIT_BY_KEY.get(state.roles.penalty);
  stageIntroHeading.textContent = `STAGE ${stageNumber} / ${STAGE_COUNT}`;
  stageIntroBonus.textContent = `${bonusFruit.emoji} ${capitalize(bonusFruit.key)}`;
  stageIntroPenalty.textContent = `${penaltyFruit.emoji} ${capitalize(penaltyFruit.key)}`;
  setMode("stage-intro");
}

function startStage(stageNumber) {
  state.stage = stageNumber;
  state.timeRemaining = STAGE_DURATION_SECONDS;
  state.fruits = [];
  state.spawnTimer = 0;
  state.spawnInterval = BASE_SPAWN_INTERVAL * currentSpawnMultiplier();
  state.stageScores[stageNumber - 1] = 0;
  state.player.x = width / 2;
  setMode("playing");
}

function resetGame() {
  state.score = 0;
  state.stageScores = [];
  state.fruitsCaught = 0;
  state.fruits = [];
}

// Ends the current stage: stops spawning, and either shows the stage-result
// overlay (stages 1-4) or the final result (stage 5 --- there is no "next").
function endStage() {
  state.fruits = [];
  if (state.stage < STAGE_COUNT) {
    stageResultHeading.textContent = `STAGE ${state.stage} COMPLETE`;
    stageResultScore.textContent = formatScore(state.stageScores[state.stage - 1]);
    stageResultTotal.textContent = formatScore(state.score);
    setMode("stage-result");
  } else {
    const best = state.stageScores.reduce(
      (bestIndex, s, i) => (s > state.stageScores[bestIndex] ? i : bestIndex),
      0,
    );
    finalScore.textContent = formatScore(state.score);
    finalBreakdown.innerHTML = state.stageScores
      .map((s, i) => `<div><dt>Stage ${i + 1}</dt><dd>${formatScore(s)}</dd></div>`)
      .join("");
    finalExtra.textContent =
      `Fruits caught: ${state.fruitsCaught} --- best stage: Stage ${best + 1}`;
    playChime([523, 659, 784, 1046]);
    setMode("final");
  }
}

function formatScore(n) {
  return n > 0 ? `+${n}` : `${n}`;
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

startBtn.addEventListener("click", () => {
  ensureAudio()?.resume?.();
  resetGame();
  prepareStage(1);
});
beginStageBtn.addEventListener("click", () => startStage(state.stage));
nextStageBtn.addEventListener("click", () => prepareStage(state.stage + 1));
playAgainBtn.addEventListener("click", () => {
  resetGame();
  prepareStage(1);
});

// --- Popups ----------------------------------------------------------------
function spawnPopup(delta, x, y) {
  const el = document.createElement("div");
  el.className = `popup ${delta > 0 ? "popup-positive" : "popup-negative"}`;
  el.textContent = formatScore(delta);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.addEventListener("animationend", () => el.remove());
  popupLayer.appendChild(el);
}

// --- Spawning & collision ----------------------------------------------
function spawnFruit() {
  const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  state.fruits.push({
    key: fruit.key,
    x: FRUIT_RADIUS + Math.random() * (width - FRUIT_RADIUS * 2),
    y: -FRUIT_RADIUS,
    caught: false,
  });
}

function basketRect() {
  const top = height - BASKET_BOTTOM_MARGIN - BASKET_HEIGHT;
  return {
    left: state.player.x - PLAYER_WIDTH / 2,
    right: state.player.x + PLAYER_WIDTH / 2,
    top,
    bottom: top + BASKET_HEIGHT,
  };
}

// Axis-aligned overlap between a fruit's bounding box and the basket rect ---
// checked every frame, so a fruit caught exactly at the bottom edge is caught
// the instant the two boxes touch, not sampled at fixed points.
function collides(fruit, basket) {
  const left = fruit.x - FRUIT_RADIUS;
  const right = fruit.x + FRUIT_RADIUS;
  const top = fruit.y - FRUIT_RADIUS;
  const bottom = fruit.y + FRUIT_RADIUS;
  return left < basket.right && right > basket.left && top < basket.bottom && bottom > basket.top;
}

function updatePlaying(dt) {
  const dx = (state.pressedKeys.has("ArrowRight") ? 1 : 0) - (state.pressedKeys.has("ArrowLeft") ? 1 : 0);
  state.player.x += dx * PLAYER_SPEED * dt;
  state.player.x = Math.min(width - PLAYER_WIDTH / 2, Math.max(PLAYER_WIDTH / 2, state.player.x));

  state.timeRemaining -= dt;
  if (state.timeRemaining <= 0) {
    state.timeRemaining = 0;
    updateHud();
    endStage();
    return;
  }

  state.spawnTimer += dt;
  while (state.spawnTimer >= state.spawnInterval) {
    state.spawnTimer -= state.spawnInterval;
    spawnFruit();
  }

  const fallSpeed = BASE_FALL_SPEED * currentSpeedMultiplier();
  const basket = basketRect();
  for (const fruit of state.fruits) {
    fruit.y += fallSpeed * dt;
    // A caught fruit is marked immediately and filtered out below, so it can
    // never score twice even if collision is (re-)checked before removal.
    if (!fruit.caught && collides(fruit, basket)) {
      fruit.caught = true;
      const role = roleForFruit(state.roles, fruit.key);
      const delta = scoreForRole(role);
      state.score += delta;
      state.stageScores[state.stage - 1] += delta;
      state.fruitsCaught += 1;
      spawnPopup(delta, fruit.x, basket.top - 10);
      playCatchSound(role);
    }
  }
  state.fruits = state.fruits.filter((f) => !f.caught && f.y - FRUIT_RADIUS < height);

  updateHud();
}

function updateHud() {
  hudStage.textContent = `Stage: ${state.stage} / ${STAGE_COUNT}`;
  hudScore.textContent = `Score: ${state.score}`;
  hudTime.textContent = `Time: ${Math.ceil(state.timeRemaining)}`;
}

// --- Idle preview (start screen) --------------------------------------
// No instructions: the opening screen shows the monkey swaying under a
// lazily drifting fruit so the first move is demonstrated, not described.
function updateIdle(dt) {
  state.idleT += dt;
  state.player.x = width / 2 + Math.sin(state.idleT * 0.9) * (width * 0.22);

  state.spawnTimer += dt;
  if (state.spawnTimer >= 1.6) {
    state.spawnTimer = 0;
    if (state.fruits.length < 2) spawnFruit();
  }
  const fallSpeed = BASE_FALL_SPEED * 0.5;
  for (const fruit of state.fruits) fruit.y += fallSpeed * dt;
  state.fruits = state.fruits.filter((f) => f.y - FRUIT_RADIUS < height);
}

// --- Rendering ---------------------------------------------------------
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#8fd6ff");
  sky.addColorStop(1, "#e8fff2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 244, 176, 0.9)";
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.15, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3fae5c";
  ctx.fillRect(0, height - 18, width, 18);
}

function drawFruit(fruit) {
  ctx.font = `${FRUIT_RADIUS * 1.7}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(FRUIT_BY_KEY.get(fruit.key).emoji, fruit.x, fruit.y);
}

function drawPlayer() {
  const basket = basketRect();
  ctx.font = `${PLAYER_WIDTH * 0.55}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("🐒", state.player.x, basket.top + 4);

  ctx.fillStyle = "#a3672f";
  ctx.strokeStyle = "#6b3f12";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(basket.left, basket.top);
  ctx.quadraticCurveTo(state.player.x, basket.bottom + 12, basket.right, basket.top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(107, 63, 18, 0.5)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    const x = basket.left + (basket.right - basket.left) * (i / 4);
    ctx.beginPath();
    ctx.moveTo(x, basket.top + 3);
    ctx.lineTo(x, basket.bottom + 8);
    ctx.stroke();
  }
}

function render() {
  ctx.clearRect(0, 0, width, height);
  drawBackground();
  for (const fruit of state.fruits) drawFruit(fruit);
  drawPlayer();
}

// --- Main loop ---------------------------------------------------------
let lastTime = null;

function frame(now) {
  const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, MAX_DT);
  lastTime = now;

  if (state.mode === "playing") updatePlaying(dt);
  else if (state.mode === "start") updateIdle(dt);

  render();
  requestAnimationFrame(frame);
}

setMode("start");
requestAnimationFrame(frame);
