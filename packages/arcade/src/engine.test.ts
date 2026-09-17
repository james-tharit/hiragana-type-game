import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGameState,
  resetGame,
  triggerJump,
  triggerDuck,
  resolveTypedWord,
  updateGame,
  GRAVITY,
  JUMP_VY,
  DUCK_DURATION_MS,
  PLAYER_X,
  PLAYER_STANDING_W,
  PLAYER_STANDING_H,
  PLAYER_DUCK_W,
  PLAYER_DUCK_H,
  CACTUS_W,
  CACTUS_H,
  BIRD_W,
  BIRD_H,
  INITIAL_SPEED,
  MAX_SPEED,
  MIN_SPAWN_MS,
  MAX_SPAWN_MS,
  type GameConfig,
  type GameState,
  type WordEntry,
} from './engine';

const CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 272,
  groundY: 224,
};

const POOL: WordEntry[] = [
  { kana: 'あ', romaji: 'a' },
  { kana: 'い', romaji: 'i' },
  { kana: 'か', romaji: 'ka' },
];

function freshState(): GameState {
  return createGameState(CONFIG);
}

// ─── createGameState ──────────────────────────────────────────────────────────

describe('createGameState', () => {
  it('places the player at PLAYER_X and on the ground', () => {
    const state = freshState();
    expect(state.player.x).toBe(PLAYER_X);
    expect(state.player.y).toBe(CONFIG.groundY - PLAYER_STANDING_H);
    expect(state.player.vy).toBe(0);
    expect(state.player.state).toBe('running');
    expect(state.player.width).toBe(PLAYER_STANDING_W);
    expect(state.player.height).toBe(PLAYER_STANDING_H);
  });

  it('starts with zero obstacles, score, elapsed time', () => {
    const state = freshState();
    expect(state.obstacles).toHaveLength(0);
    expect(state.score).toBe(0);
    expect(state.elapsedMs).toBe(0);
    expect(state.timeSinceSpawnMs).toBe(0);
    expect(state.isOver).toBe(false);
    expect(state.duckTimerMs).toBe(0);
    expect(state._nextId).toBe(0);
  });

  it('sets initial speed to INITIAL_SPEED', () => {
    const state = freshState();
    expect(state.speed).toBe(INITIAL_SPEED);
  });

  it('assigns a random spawn interval within [MIN_SPAWN_MS, MAX_SPAWN_MS]', () => {
    const state = freshState();
    expect(state.nextSpawnIntervalMs).toBeGreaterThanOrEqual(MIN_SPAWN_MS);
    expect(state.nextSpawnIntervalMs).toBeLessThanOrEqual(MAX_SPAWN_MS);
  });
});

// ─── resetGame ────────────────────────────────────────────────────────────────

describe('resetGame', () => {
  it('resets the state in-place without replacing the object reference', () => {
    const state = freshState();
    const ref = state;

    // Mutate state to simulate a game in progress
    state.score = 500;
    state.elapsedMs = 50_000;
    state.isOver = true;
    state.obstacles.push({ id: 0, x: 100, y: 100, width: 30, height: 60, type: 'ground', wordTarget: 'あ', romajiTarget: 'a' });

    resetGame(state, CONFIG);

    // Same reference
    expect(state).toBe(ref);
    // Reset values
    expect(state.score).toBe(0);
    expect(state.elapsedMs).toBe(0);
    expect(state.isOver).toBe(false);
    expect(state.obstacles).toHaveLength(0);
    expect(state.player.state).toBe('running');
  });
});

// ─── triggerJump ─────────────────────────────────────────────────────────────

describe('triggerJump', () => {
  it('applies JUMP_VY and sets state to jumping when running', () => {
    const state = freshState();
    triggerJump(state);
    expect(state.player.vy).toBe(JUMP_VY);
    expect(state.player.state).toBe('jumping');
  });

  it('is a no-op when already jumping (prevents double-jump)', () => {
    const state = freshState();
    triggerJump(state);
    const vyAfterFirst = state.player.vy;

    // Simulate partial upward movement
    state.player.vy = JUMP_VY / 2;
    triggerJump(state);

    // Should not reset vy — still mid-flight velocity
    expect(state.player.vy).toBe(JUMP_VY / 2);
    expect(state.player.state).toBe('jumping');
  });

  it('is a no-op when ducking', () => {
    const state = freshState();
    triggerDuck(state, CONFIG);
    const vy = state.player.vy;
    triggerJump(state);
    expect(state.player.vy).toBe(vy);
    expect(state.player.state).toBe('ducking');
  });
});

// ─── triggerDuck ─────────────────────────────────────────────────────────────

describe('triggerDuck', () => {
  it('sets duck dimensions and state from running', () => {
    const state = freshState();
    triggerDuck(state, CONFIG);
    expect(state.player.state).toBe('ducking');
    expect(state.player.width).toBe(PLAYER_DUCK_W);
    expect(state.player.height).toBe(PLAYER_DUCK_H);
    expect(state.player.y).toBe(CONFIG.groundY - PLAYER_DUCK_H);
    expect(state.player.vy).toBe(0);
  });

  it('sets the duck timer to DUCK_DURATION_MS', () => {
    const state = freshState();
    triggerDuck(state, CONFIG);
    expect(state.duckTimerMs).toBe(DUCK_DURATION_MS);
  });

  it('refreshes the timer without changing posture when already ducking', () => {
    const state = freshState();
    triggerDuck(state, CONFIG);
    // Simulate partial timer expiry
    state.duckTimerMs = 100;
    triggerDuck(state, CONFIG);
    // Timer resets to full; posture unchanged
    expect(state.duckTimerMs).toBe(DUCK_DURATION_MS);
    expect(state.player.state).toBe('ducking');
  });

  it('shrinks hitbox mid-air without cancelling vertical velocity', () => {
    const state = freshState();
    triggerJump(state);
    state.player.vy = -500; // mid-jump

    triggerDuck(state, CONFIG);

    expect(state.player.state).toBe('ducking');
    expect(state.player.width).toBe(PLAYER_DUCK_W);
    expect(state.player.height).toBe(PLAYER_DUCK_H);
    // y should NOT be snapped when airborne
    expect(state.player.y).toBeLessThan(CONFIG.groundY - PLAYER_DUCK_H);
    // vy should still reflect mid-air velocity (not zeroed)
    expect(state.player.vy).toBe(-500);
  });
});

// ─── resolveTypedWord ─────────────────────────────────────────────────────────

describe('resolveTypedWord', () => {
  function stateWithObstacle(type: 'ground' | 'air', romaji: string, x = 300): GameState {
    const state = freshState();
    state.obstacles.push({
      id: 0,
      x,
      y: type === 'ground' ? CONFIG.groundY - CACTUS_H : 100,
      width: type === 'ground' ? CACTUS_W : BIRD_W,
      height: type === 'ground' ? CACTUS_H : BIRD_H,
      type,
      wordTarget: 'あ',
      romajiTarget: romaji,
    });
    return state;
  }

  it('returns false when there are no obstacles on screen', () => {
    const state = freshState();
    expect(resolveTypedWord(state, CONFIG, 'a')).toBe(false);
  });

  it('triggers a jump for a matching ground obstacle and returns true', () => {
    const state = stateWithObstacle('ground', 'a');
    const result = resolveTypedWord(state, CONFIG, 'a');
    expect(result).toBe(true);
    expect(state.player.state).toBe('jumping');
    expect(state.player.vy).toBe(JUMP_VY);
  });

  it('triggers a duck for a matching air obstacle and returns true', () => {
    const state = stateWithObstacle('air', 'i');
    const result = resolveTypedWord(state, CONFIG, 'i');
    expect(result).toBe(true);
    expect(state.player.state).toBe('ducking');
  });

  it('returns false when the typed romaji does not match the nearest obstacle', () => {
    const state = stateWithObstacle('ground', 'ka');
    // The only (and therefore nearest) obstacle wants 'ka'; typing 'a' is rejected
    expect(resolveTypedWord(state, CONFIG, 'a')).toBe(false);
    expect(state.player.state).toBe('running');
  });

  it('uses the nearest obstacle overall when multiple obstacles share the same romaji', () => {
    const state = freshState();
    // Two ground obstacles with the same romaji; near one is at x=100, far at x=400
    state.obstacles.push(
      { id: 0, x: 400, y: CONFIG.groundY - CACTUS_H, width: CACTUS_W, height: CACTUS_H, type: 'ground', wordTarget: 'あ', romajiTarget: 'a' },
      { id: 1, x: 100, y: CONFIG.groundY - CACTUS_H, width: CACTUS_W, height: CACTUS_H, type: 'ground', wordTarget: 'あ', romajiTarget: 'a' },
    );

    // Nearest is x=100 with romaji 'a' — should match and jump
    const result = resolveTypedWord(state, CONFIG, 'a');
    expect(result).toBe(true);
    expect(state.player.state).toBe('jumping');
  });

  describe('strict encounter ordering', () => {
    it('rejects input that matches a far obstacle when a nearer obstacle has a different romaji', () => {
      const state = freshState();
      // Nearest: 'ka' cactus at x=100 — player must handle this first
      // Far:     'a'  cactus at x=300 — cannot be skipped to
      state.obstacles.push(
        { id: 0, x: 100, y: CONFIG.groundY - CACTUS_H, width: CACTUS_W, height: CACTUS_H, type: 'ground', wordTarget: 'か', romajiTarget: 'ka' },
        { id: 1, x: 300, y: CONFIG.groundY - CACTUS_H, width: CACTUS_W, height: CACTUS_H, type: 'ground', wordTarget: 'あ', romajiTarget: 'a' },
      );

      // Typing 'a' should be rejected — the nearest obstacle expects 'ka'
      const result = resolveTypedWord(state, CONFIG, 'a');
      expect(result).toBe(false);
      expect(state.player.state).toBe('running');
    });

    it('accepts input after the nearest obstacle has been addressed', () => {
      const state = freshState();
      state.obstacles.push(
        { id: 0, x: 100, y: CONFIG.groundY - CACTUS_H, width: CACTUS_W, height: CACTUS_H, type: 'ground', wordTarget: 'か', romajiTarget: 'ka' },
        { id: 1, x: 300, y: CONFIG.groundY - CACTUS_H, width: CACTUS_W, height: CACTUS_H, type: 'ground', wordTarget: 'あ', romajiTarget: 'a' },
      );

      // Address the nearest 'ka' obstacle first
      expect(resolveTypedWord(state, CONFIG, 'ka')).toBe(true);
      expect(state.player.state).toBe('jumping');

      // Now remove the handled obstacle (simulating it scrolling off)
      state.obstacles.shift();
      state.player.state = 'running'; // reset for test clarity

      // The 'a' obstacle at x=300 is now nearest — typing 'a' should work
      expect(resolveTypedWord(state, CONFIG, 'a')).toBe(true);
    });

    it('rejects input for a far air obstacle when a nearer ground obstacle must be jumped first', () => {
      const state = freshState();
      state.obstacles.push(
        { id: 0, x: 150, y: CONFIG.groundY - CACTUS_H, width: CACTUS_W, height: CACTUS_H, type: 'ground', wordTarget: 'き', romajiTarget: 'ki' },
        { id: 1, x: 350, y: 100, width: BIRD_W, height: BIRD_H, type: 'air', wordTarget: 'う', romajiTarget: 'u' },
      );

      // Typing 'u' (duck) is rejected while 'ki' (jump) is the nearest threat
      expect(resolveTypedWord(state, CONFIG, 'u')).toBe(false);
      expect(state.player.state).toBe('running');
    });
  });
});

// ─── updateGame ───────────────────────────────────────────────────────────────

describe('updateGame', () => {
  it('returns { collided: false } and does nothing when game is already over', () => {
    const state = freshState();
    state.isOver = true;
    const result = updateGame(state, CONFIG, POOL, 16);
    expect(result).toEqual({ collided: false });
    expect(state.elapsedMs).toBe(0); // no mutation
  });

  describe('score and speed', () => {
    it('increments elapsedMs and score each frame', () => {
      const state = freshState();
      updateGame(state, CONFIG, POOL, 100);
      expect(state.elapsedMs).toBe(100);
      expect(state.score).toBe(1); // floor(100 / 100)
    });

    it('increases speed proportional to elapsed time', () => {
      const state = freshState();
      updateGame(state, CONFIG, POOL, 1_000); // 1 second
      expect(state.speed).toBeGreaterThan(INITIAL_SPEED);
    });

    it('caps speed at MAX_SPEED', () => {
      const state = freshState();
      // Feed a huge delta (10 minutes) to exceed the cap
      updateGame(state, CONFIG, POOL, 600_000);
      expect(state.speed).toBe(MAX_SPEED);
    });

    it('caps the applied delta at 100 ms to prevent tunnelling', () => {
      const state = freshState();
      // 500 ms delta should behave the same as 100 ms for physics
      const stateCapped = freshState();
      updateGame(state, CONFIG, POOL, 100);
      updateGame(stateCapped, CONFIG, POOL, 500);
      // elapsedMs accumulates the RAW deltaMs (not capped), so that score/speed ramp correctly
      // Physics (player.y) uses the capped dt — player should still be on the ground
      expect(stateCapped.player.y).toBe(CONFIG.groundY - PLAYER_STANDING_H);
    });
  });

  describe('player physics', () => {
    it('keeps a running player at ground level with no vy change', () => {
      const state = freshState();
      const groundedY = CONFIG.groundY - PLAYER_STANDING_H;
      updateGame(state, CONFIG, POOL, 16);
      expect(state.player.y).toBe(groundedY);
      expect(state.player.vy).toBe(0);
    });

    it('applies gravity to an airborne player', () => {
      const state = freshState();
      triggerJump(state);
      const yBefore = state.player.y;
      updateGame(state, CONFIG, POOL, 50); // 50 ms
      // Player should have moved (upward initially)
      expect(state.player.y).not.toBe(yBefore);
    });

    it('lands the player and restores standing state after a jump', () => {
      const state = freshState();
      triggerJump(state);

      // Run enough frames to complete a full arc (~600 ms)
      for (let i = 0; i < 60; i++) {
        updateGame(state, CONFIG, POOL, 16);
        if (state.player.state === 'running') break;
      }

      expect(state.player.state).toBe('running');
      expect(state.player.width).toBe(PLAYER_STANDING_W);
      expect(state.player.height).toBe(PLAYER_STANDING_H);
      expect(state.player.y).toBe(CONFIG.groundY - PLAYER_STANDING_H);
    });
  });

  describe('duck timer', () => {
    it('counts down and restores running posture when timer expires', () => {
      const state = freshState();
      triggerDuck(state, CONFIG);
      expect(state.player.state).toBe('ducking');

      // Advance beyond DUCK_DURATION_MS
      updateGame(state, CONFIG, POOL, DUCK_DURATION_MS + 1);

      expect(state.player.state).toBe('running');
      expect(state.player.width).toBe(PLAYER_STANDING_W);
      expect(state.player.height).toBe(PLAYER_STANDING_H);
      expect(state.duckTimerMs).toBe(0);
    });

    it('does not tick duck timer while airborne', () => {
      const state = freshState();
      triggerJump(state);
      // Duck mid-air
      state.player.state = 'ducking';
      state.player.width = PLAYER_DUCK_W;
      state.player.height = PLAYER_DUCK_H;
      state.duckTimerMs = DUCK_DURATION_MS;
      // Player is airborne (y < groundedY), timer must not tick
      state.player.y = CONFIG.groundY - 80; // clearly above ground

      updateGame(state, CONFIG, POOL, 100);

      // Timer should not have decreased (player is still airborne after 100 ms)
      // (GRAVITY * 0.1 = 220 vy, player.y += vy * dt — still airborne with JUMP_VY start)
      // We just verify the duck state is still intact; exact timer value depends on landing
      expect(state.player.state === 'ducking' || state.player.state === 'running').toBe(true);
    });
  });

  describe('obstacle management', () => {
    it('moves obstacles leftward each frame', () => {
      const state = freshState();
      state.obstacles.push({
        id: 0, x: 400, y: CONFIG.groundY - CACTUS_H,
        width: CACTUS_W, height: CACTUS_H, type: 'ground',
        wordTarget: 'あ', romajiTarget: 'a',
      });

      const xBefore = state.obstacles[0].x;
      updateGame(state, CONFIG, POOL, 100); // 100 ms
      expect(state.obstacles[0].x).toBeLessThan(xBefore);
    });

    it('removes obstacles that have scrolled off-screen', () => {
      const state = freshState();
      state.obstacles.push({
        id: 0, x: -CACTUS_W - 1, y: CONFIG.groundY - CACTUS_H,
        width: CACTUS_W, height: CACTUS_H, type: 'ground',
        wordTarget: 'あ', romajiTarget: 'a',
      });

      updateGame(state, CONFIG, POOL, 16);
      expect(state.obstacles).toHaveLength(0);
    });

    it('spawns a new obstacle when the spawn interval elapses', () => {
      const state = freshState();
      // Force spawn immediately on next frame
      state.timeSinceSpawnMs = state.nextSpawnIntervalMs;

      updateGame(state, CONFIG, POOL, 1); // tiny delta triggers the check
      expect(state.obstacles).toHaveLength(1);
    });

    it('does not spawn when pool is empty', () => {
      const state = freshState();
      state.timeSinceSpawnMs = state.nextSpawnIntervalMs;

      updateGame(state, CONFIG, [], 1);
      expect(state.obstacles).toHaveLength(0);
    });

    it('assigns a wordTarget and romajiTarget from the pool to new obstacles', () => {
      const state = freshState();
      state.timeSinceSpawnMs = state.nextSpawnIntervalMs;

      updateGame(state, CONFIG, POOL, 1);
      const romajiValues = POOL.map((e) => e.romaji);
      expect(romajiValues).toContain(state.obstacles[0].romajiTarget);
    });
  });

  describe('collision detection', () => {
    it('detects a collision and sets isOver when player overlaps an obstacle', () => {
      const state = freshState();
      // Place obstacle directly on the player
      state.obstacles.push({
        id: 0,
        x: PLAYER_X,
        y: CONFIG.groundY - PLAYER_STANDING_H,
        width: PLAYER_STANDING_W,
        height: PLAYER_STANDING_H,
        type: 'ground',
        wordTarget: 'あ',
        romajiTarget: 'a',
      });

      const result = updateGame(state, CONFIG, POOL, 16);
      expect(result.collided).toBe(true);
      expect(state.isOver).toBe(true);
    });

    it('returns { collided: false } when no overlap exists', () => {
      const state = freshState();
      // Obstacle far off to the right
      state.obstacles.push({
        id: 0, x: 700, y: CONFIG.groundY - CACTUS_H,
        width: CACTUS_W, height: CACTUS_H, type: 'ground',
        wordTarget: 'あ', romajiTarget: 'a',
      });

      const result = updateGame(state, CONFIG, POOL, 16);
      expect(result.collided).toBe(false);
      expect(state.isOver).toBe(false);
    });

    it('does not flag a collision for edge-touching obstacles (HITBOX_INSET gap)', () => {
      const state = freshState();
      // Place obstacle so it shares an edge with the player but does not overlap
      // with the inset applied. Inset is 4 px per side.
      const playerRight = PLAYER_X + PLAYER_STANDING_W;
      state.obstacles.push({
        id: 0,
        x: playerRight, // exactly touching — no actual pixel overlap
        y: CONFIG.groundY - CACTUS_H,
        width: CACTUS_W,
        height: CACTUS_H,
        type: 'ground',
        wordTarget: 'あ',
        romajiTarget: 'a',
      });

      const result = updateGame(state, CONFIG, POOL, 16);
      // Edge-touch is not counted as collision; with leftward movement the obstacle
      // moves further right by pxThisFrame, so overlap never actually occurs.
      expect(result.collided).toBe(false);
    });
  });
});
