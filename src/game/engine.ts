/**
 * src/game/engine.ts
 *
 * Pure TypeScript game engine for the Hiragana Endless Runner.
 * Zero React dependencies — safe to call inside a requestAnimationFrame loop.
 *
 * Design goals
 * ────────────
 * • Zero-allocation hot path: `updateGame` mutates state in place every frame.
 * • Physics is delta-time based so the simulation is frame-rate independent.
 * • Integration seam: `resolveTypedWord` is the single entry-point for the
 *   typing engine; it looks up the nearest matching obstacle and fires the
 *   correct action automatically.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Downward acceleration (px/s²). */
export const GRAVITY = 2_200;

/** Upward velocity applied on jump (px/s, negative = up in canvas coords). */
export const JUMP_VY = -800;

/** How long the player stays ducked after triggerDuck() fires (ms). */
export const DUCK_DURATION_MS = 750;

/** Player's fixed horizontal screen position (px). */
export const PLAYER_X = 80;

// Player hitbox dimensions for each posture.
export const PLAYER_STANDING_W = 44;
export const PLAYER_STANDING_H = 64;
export const PLAYER_DUCK_W = 60;
export const PLAYER_DUCK_H = 36;

// Obstacle hitbox dimensions.
export const CACTUS_W = 30;
export const CACTUS_H = 60;
export const BIRD_W = 46;
export const BIRD_H = 28;

/**
 * Vertical gap (px) between the bird's bottom edge and the top of a ducking
 * player. Keeps the dodge window generous but not trivial.
 */
const BIRD_CLEAR_GAP = 4;

/** Starting obstacle travel speed (px/s). */
export const INITIAL_SPEED = 280;

/** Speed added per second of survival (px/s per second). */
export const SPEED_RAMP_PER_SEC = 8;

/** Hard ceiling for obstacle speed (px/s). */
export const MAX_SPEED = 700;

/** Shortest possible gap between two obstacle spawns (ms). */
export const MIN_SPAWN_MS = 1_000;

/** Longest possible gap between two obstacle spawns (ms). */
export const MAX_SPAWN_MS = 2_600;

/**
 * Per-side AABB inset (px) applied to both player and obstacle boxes before
 * the overlap test — acts as a leniency / forgiveness margin.
 */
const HITBOX_INSET = 4;

// ─── Public types ─────────────────────────────────────────────────────────────

export type PlayerState = 'running' | 'jumping' | 'ducking';

export interface Player {
  x: number;
  /** Top-left Y in canvas coordinates (y increases downward). */
  y: number;
  /** Vertical velocity (px/s). Negative values move the player upward. */
  vy: number;
  width: number;
  height: number;
  state: PlayerState;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'air';
  /** Hiragana string rendered above the obstacle on the canvas. */
  wordTarget: string;
  /** Romaji string matched against completed keystrokes from the typing engine. */
  romajiTarget: string;
}

/** Immutable configuration derived from the canvas element at startup. */
export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  /** Y coordinate of the ground surface in canvas units. */
  groundY: number;
}

export interface GameState {
  player: Player;
  obstacles: Obstacle[];
  /** Integer score — increments by 1 for every 100 ms survived. */
  score: number;
  /** Current obstacle travel speed (px/s). Increases over time. */
  speed: number;
  isOver: boolean;
  /** Cumulative elapsed time since game start (ms). Drives score and speed. */
  elapsedMs: number;
  timeSinceSpawnMs: number;
  nextSpawnIntervalMs: number;
  /** Remaining ms before the duck posture auto-releases to running. */
  duckTimerMs: number;
  /** @internal Monotonically increasing obstacle ID. */
  _nextId: number;
}

export interface GameUpdateResult {
  /** True when a player–obstacle collision was detected this frame. */
  collided: boolean;
}

/**
 * Subset of the Entry type from kanaGroups.ts.
 * Typed locally so the engine has no import dependency on that module.
 */
export interface WordEntry {
  kana: string;
  romaji: string;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/** Returns a fresh, ready-to-play GameState. */
export function createGameState(config: GameConfig): GameState {
  return {
    player: {
      x: PLAYER_X,
      y: config.groundY - PLAYER_STANDING_H,
      vy: 0,
      width: PLAYER_STANDING_W,
      height: PLAYER_STANDING_H,
      state: 'running',
    },
    obstacles: [],
    score: 0,
    speed: INITIAL_SPEED,
    isOver: false,
    elapsedMs: 0,
    timeSinceSpawnMs: 0,
    nextSpawnIntervalMs: randBetween(MIN_SPAWN_MS, MAX_SPAWN_MS),
    duckTimerMs: 0,
    _nextId: 0,
  };
}

/**
 * Resets `state` back to its initial values without replacing the object
 * reference — keeps any refs held by the React component valid.
 */
export function resetGame(state: GameState, config: GameConfig): void {
  const fresh = createGameState(config);
  Object.assign(state, fresh);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function randBetween(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Standard AABB overlap test.
 * Edge-touching (shared boundary) is NOT counted as a collision.
 */
function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * Picks a word from the pool, chooses a random obstacle type, and appends a
 * new Obstacle to state.obstacles. Mutates state.
 */
function spawnObstacle(
  state: GameState,
  config: GameConfig,
  pool: readonly WordEntry[],
): void {
  if (pool.length === 0) return;

  const word = pickRandom(pool);
  const type: 'ground' | 'air' = Math.random() < 0.5 ? 'ground' : 'air';

  let x: number, y: number, width: number, height: number;

  if (type === 'ground') {
    width = CACTUS_W;
    height = CACTUS_H;
    x = config.canvasWidth + 16;
    y = config.groundY - height;
  } else {
    width = BIRD_W;
    height = BIRD_H;
    x = config.canvasWidth + 16;
    // Position the bird just above where a ducking player's head would be,
    // so a standing player is hit but a ducking player slips underneath.
    const duckingPlayerTop = config.groundY - PLAYER_DUCK_H;
    y = duckingPlayerTop - height - BIRD_CLEAR_GAP;
  }

  state.obstacles.push({
    id: state._nextId++,
    x,
    y,
    width,
    height,
    type,
    wordTarget: word.kana,
    romajiTarget: word.romaji,
  });
}

// ─── Action triggers ──────────────────────────────────────────────────────────

/**
 * Fires an upward jump impulse.
 * No-ops when the player is already airborne (jumping) or ducking.
 * Guards against double-jumps.
 */
export function triggerJump(state: GameState): void {
  if (state.player.state !== 'running') return;
  state.player.vy = JUMP_VY;
  state.player.state = 'jumping';
}

/**
 * Puts the player into a ducking posture.
 *
 * Behaviour by current state:
 * - 'running'  → snap to duck dimensions on the ground, start the timer.
 * - 'jumping'  → shrink hitbox immediately (duck mid-air); gravity continues
 *                in updateGame. Timer starts when the player lands.
 * - 'ducking'  → timer is refreshed; no other change.
 */
export function triggerDuck(state: GameState, config: GameConfig): void {
  const { player } = state;

  // Always refresh the timer so rapidly approaching birds extend the duck.
  state.duckTimerMs = DUCK_DURATION_MS;

  if (player.state === 'ducking') return;

  const isAirborne = player.state === 'jumping';
  player.state = 'ducking';
  player.width = PLAYER_DUCK_W;
  player.height = PLAYER_DUCK_H;

  if (!isAirborne) {
    // Ground duck: snap the bottom edge to the ground surface.
    player.y = config.groundY - PLAYER_DUCK_H;
    player.vy = 0;
  }
  // Air duck: hitbox shrinks in place; updateGame continues applying gravity.
}

/**
 * Primary integration point for the typing engine.
 *
 * Call this whenever the typing engine signals that a full romaji syllable has
 * been completed. This function:
 *  1. Finds the *nearest* (leftmost x) obstacle whose `romajiTarget` matches.
 *  2. Fires `triggerJump` for ground obstacles or `triggerDuck` for air ones.
 *  3. Returns `true` if an action was dispatched, `false` if no match was found.
 *
 * Picking the nearest match prevents a queued word from accidentally skipping
 * past the closest threat to interact with a far-away obstacle.
 */
export function resolveTypedWord(
  state: GameState,
  config: GameConfig,
  completedRomaji: string,
): boolean {
  let nearest: Obstacle | undefined;

  for (const obs of state.obstacles) {
    if (obs.romajiTarget === completedRomaji) {
      if (!nearest || obs.x < nearest.x) {
        nearest = obs;
      }
    }
  }

  if (!nearest) return false;

  if (nearest.type === 'ground') {
    triggerJump(state);
  } else {
    triggerDuck(state, config);
  }

  return true;
}

// ─── Core update loop ─────────────────────────────────────────────────────────

/**
 * Advances the entire game simulation by `deltaMs` milliseconds.
 *
 * **Zero-allocation design**: every operation mutates `state` in place.
 * The only allocation is the obstacle array filter for off-screen cleanup,
 * which operates on a small array (≤ ~8 elements) and is negligible at 60 fps.
 *
 * Call order within each frame:
 *   1. Score and speed ramp
 *   2. Player vertical physics (gravity + landing)
 *   3. Duck-timer countdown (grounded only)
 *   4. Obstacle translation and off-screen pruning
 *   5. Obstacle spawning
 *   6. AABB collision detection
 *
 * @param state    Mutable game state (created with `createGameState`).
 * @param config   Immutable canvas and physics configuration.
 * @param pool     Available kana entries used when labelling new obstacles.
 * @param deltaMs  Milliseconds elapsed since the previous frame.
 * @returns        Check `.collided` to trigger game-over UI in the component.
 */
export function updateGame(
  state: GameState,
  config: GameConfig,
  pool: readonly WordEntry[],
  deltaMs: number,
): GameUpdateResult {
  if (state.isOver) return { collided: false };

  // Cap the delta to 100 ms so a tab-switch / debugger pause doesn't
  // send the player through the ground or teleport obstacles off-screen.
  const dt = Math.min(deltaMs, 100) / 1_000; // seconds

  // ── 1. Score & speed ramp ───────────────────────────────────────────────────
  state.elapsedMs += deltaMs;
  state.score = Math.floor(state.elapsedMs / 100);
  state.speed = Math.min(
    INITIAL_SPEED + (state.elapsedMs / 1_000) * SPEED_RAMP_PER_SEC,
    MAX_SPEED,
  );

  // ── 2. Player vertical physics ──────────────────────────────────────────────
  const { player } = state;

  // `groundedY` is the Y at which the player's top-left sits when the bottom
  // edge rests exactly on the ground surface. Recomputed each frame because
  // player.height changes between standing and ducking.
  const groundedY = config.groundY - player.height;

  // Include `player.state === 'jumping'` so physics activates on the very first
  // frame after triggerJump(), when player.y is still exactly equal to groundedY
  // (strict less-than would be false and the upward velocity would never apply).
  if (player.y < groundedY || player.state === 'jumping') {
    // Airborne: gravity applies regardless of posture (covers mid-air ducks).
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    if (player.y >= groundedY) {
      // Landing.
      player.y = groundedY;
      player.vy = 0;

      if (player.state === 'jumping') {
        // Normal landing from a jump → return to standing run.
        player.state = 'running';
        player.width = PLAYER_STANDING_W;
        player.height = PLAYER_STANDING_H;
        player.y = config.groundY - PLAYER_STANDING_H;
      }
      // If landing while 'ducking' (typed duck word mid-air), keep duck
      // dimensions; the timer below will handle the return to running.
    }
  }

  // ── 3. Duck-timer (only ticks when the player is grounded) ─────────────────
  // Tolerance of 1 px prevents floating-point near-misses from stalling the timer.
  const isGrounded = player.y >= groundedY - 1;

  if (player.state === 'ducking' && isGrounded) {
    state.duckTimerMs -= deltaMs;

    if (state.duckTimerMs <= 0) {
      state.duckTimerMs = 0;
      player.state = 'running';
      player.width = PLAYER_STANDING_W;
      player.height = PLAYER_STANDING_H;
      player.y = config.groundY - PLAYER_STANDING_H;
    }
  }

  // ── 4. Obstacle movement & off-screen pruning ───────────────────────────────
  const pxThisFrame = state.speed * dt;

  // Traverse backwards so we can splice without index corruption.
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    state.obstacles[i].x -= pxThisFrame;
    if (state.obstacles[i].x + state.obstacles[i].width <= 0) {
      state.obstacles.splice(i, 1);
    }
  }

  // ── 5. Spawning ─────────────────────────────────────────────────────────────
  state.timeSinceSpawnMs += deltaMs;

  if (state.timeSinceSpawnMs >= state.nextSpawnIntervalMs) {
    spawnObstacle(state, config, pool);
    state.timeSinceSpawnMs = 0;

    // Compress the spawn interval proportionally as speed increases,
    // flooring at MIN_SPAWN_MS so the screen never becomes unplayable.
    const speedRatio = INITIAL_SPEED / state.speed;
    state.nextSpawnIntervalMs = Math.max(
      MIN_SPAWN_MS,
      randBetween(MIN_SPAWN_MS, MAX_SPAWN_MS) * speedRatio,
    );
  }

  // ── 6. AABB collision detection ─────────────────────────────────────────────
  for (const obs of state.obstacles) {
    if (
      rectsOverlap(
        player.x + HITBOX_INSET,
        player.y + HITBOX_INSET,
        player.width - HITBOX_INSET * 2,
        player.height - HITBOX_INSET * 2,
        obs.x + HITBOX_INSET,
        obs.y + HITBOX_INSET,
        obs.width - HITBOX_INSET * 2,
        obs.height - HITBOX_INSET * 2,
      )
    ) {
      state.isOver = true;
      return { collided: true };
    }
  }

  return { collided: false };
}
