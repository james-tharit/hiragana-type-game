import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  createGameState,
  resetGame,
  resolveTypedWord as engineResolveTypedWord,
  triggerDuck as engineTriggerDuck,
  triggerJump as engineTriggerJump,
  updateGame,
  type GameConfig,
  type GameState,
  type WordEntry,
} from '../game/engine';

// ─── Fixed game resolution ────────────────────────────────────────────────────
// The canvas *buffer* is always GAME_W × GAME_H logical pixels (× DPR for
// retina sharpness). CSS scales the element to fill the container while
// preserving the aspect ratio, so the game coordinate system never changes.

const GAME_W = 800;
const GAME_H = 272;
const GROUND_Y = GAME_H - 48; // 224 px — 48 px of visual ground room below

// ─── Palette ──────────────────────────────────────────────────────────────────

const CLR = {
  ground: 'rgba(255, 255, 255, 0.1)',
  playerRun: '#ea580c',
  playerJump: '#fb923c',
  playerDuck: '#c2410c',
  cactus: '#15803d',
  bird: '#1d4ed8',
  label: '#f9fafb',
  score: '#4b5563',
  overlay: 'rgba(0, 0, 0, 0.58)',
  overlayTitle: '#f9fafb',
  overlayScore: '#d1d5db',
  overlayHint: '#6b7280',
} as const;

// ─── Drawing (module-level, no React deps, no allocations) ───────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawScene(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.clearRect(0, 0, GAME_W, GAME_H);

  // ── Ground line ────────────────────────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = CLR.ground;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(GAME_W, GROUND_Y);
  ctx.stroke();
  ctx.restore();

  // ── Player ─────────────────────────────────────────────────────────────────
  const { player } = state;
  ctx.save();
  ctx.fillStyle =
    player.state === 'jumping'
      ? CLR.playerJump
      : player.state === 'ducking'
        ? CLR.playerDuck
        : CLR.playerRun;
  roundRect(ctx, player.x, player.y, player.width, player.height, 6);
  ctx.fill();
  ctx.restore();

  // ── Obstacles ──────────────────────────────────────────────────────────────
  for (const obs of state.obstacles) {
    // Body
    ctx.save();
    ctx.fillStyle = obs.type === 'ground' ? CLR.cactus : CLR.bird;
    roundRect(ctx, obs.x, obs.y, obs.width, obs.height, 4);
    ctx.fill();
    ctx.restore();

    // Hiragana label centred above the obstacle
    ctx.save();
    ctx.font = "bold 20px 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = CLR.label;
    // Shadow ensures the kanji is legible against any background colour.
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 5;
    ctx.fillText(obs.wordTarget, obs.x + obs.width / 2, obs.y - 6);
    ctx.restore();
  }

  // ── Score (top-right) ──────────────────────────────────────────────────────
  ctx.save();
  ctx.font = "bold 13px 'Courier New', Courier, monospace";
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = CLR.score;
  ctx.fillText(`HI  ${String(state.score).padStart(5, '0')}`, GAME_W - 16, 14);
  ctx.restore();

  // ── Game-over overlay ──────────────────────────────────────────────────────
  if (!state.isOver) return;

  ctx.save();

  ctx.fillStyle = CLR.overlay;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  const cx = GAME_W / 2;
  const cy = GAME_H / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = "bold 30px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = CLR.overlayTitle;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText('GAME OVER', cx, cy - 22);

  ctx.font = "bold 15px 'Courier New', Courier, monospace";
  ctx.fillStyle = CLR.overlayScore;
  ctx.shadowBlur = 0;
  ctx.fillText(`SCORE  ${state.score}`, cx, cy + 10);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = CLR.overlayHint;
  ctx.fillText('Press Enter or tap to restart', cx, cy + 36);

  ctx.restore();
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface DinoGameCanvasHandle {
  /**
   * Primary integration point for `useTypingEngine`.
   *
   * Pass each completed romaji syllable from the typing engine's token
   * completion callback. The game looks up the nearest matching obstacle and
   * fires `triggerJump` (ground obstacle) or `triggerDuck` (air obstacle)
   * automatically.
   *
   * @returns `true` when a matching obstacle was found and an action fired.
   */
  resolveTypedWord: (romaji: string) => boolean;

  /** Directly trigger a jump. No-op when the player is not grounded. */
  triggerJump: () => void;

  /** Directly trigger a duck from any player state. */
  triggerDuck: () => void;

  /** Restart the game in-place after a game-over without unmounting. */
  restartGame: () => void;
}

export interface DinoGameCanvasProps {
  /**
   * Live kana pool used to label obstacles on spawn. Changes propagate via a
   * ref so the RAF loop never needs to restart when the user adjusts filters.
   */
  pool: readonly WordEntry[];

  /**
   * Fired exactly once per collision, with the player's final score.
   * Useful for showing a React "game over" stats panel alongside the canvas.
   */
  onGameOver?: (score: number) => void;

  /** Optional Tailwind / CSS class names applied to the `<canvas>` element. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DinoGameCanvas = forwardRef<DinoGameCanvasHandle, DinoGameCanvasProps>(
  function DinoGameCanvas({ pool, onGameOver, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // These refs let the RAF loop always read the latest prop values without
    // restarting the loop (and resetting game state) on every prop change.
    const poolRef = useRef<readonly WordEntry[]>(pool);
    const onGameOverRef = useRef<((score: number) => void) | undefined>(onGameOver);

    // Stable handles to mutable game objects — safe to read from imperative
    // handlers and the RAF loop alike.
    const stateRef = useRef<GameState | null>(null);
    const configRef = useRef<GameConfig | null>(null);

    // Keep live refs in sync with React props each render.
    useEffect(() => {
      poolRef.current = pool;
    }, [pool]);

    useEffect(() => {
      onGameOverRef.current = onGameOver;
    }, [onGameOver]);

    // ── Imperative handle ──────────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        resolveTypedWord(romaji) {
          const s = stateRef.current;
          const c = configRef.current;
          if (!s || !c || s.isOver) return false;
          return engineResolveTypedWord(s, c, romaji);
        },

        triggerJump() {
          const s = stateRef.current;
          if (!s || s.isOver) return;
          engineTriggerJump(s);
        },

        triggerDuck() {
          const s = stateRef.current;
          const c = configRef.current;
          if (!s || !c || s.isOver) return;
          engineTriggerDuck(s, c);
        },

        restartGame() {
          const s = stateRef.current;
          const c = configRef.current;
          if (!s || !c) return;
          resetGame(s, c);
        },
      }),
      [],
    );

    // ── Game loop — mounts once, lives for the component's lifetime ────────
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scale the canvas *buffer* by DPR so strokes and text are sharp on
      // retina/HiDPI displays. All game-logic coordinates remain in the
      // GAME_W × GAME_H logical space; ctx.scale handles the mapping.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = GAME_W * dpr;
      canvas.height = GAME_H * dpr;
      ctx.scale(dpr, dpr);

      const config: GameConfig = {
        canvasWidth: GAME_W,
        canvasHeight: GAME_H,
        groundY: GROUND_Y,
      };
      configRef.current = config;

      const state = createGameState(config);
      stateRef.current = state;

      // Guard: fire onGameOver exactly once per collision episode.
      // Resets automatically when the player restarts (isOver flips to false).
      let gameOverFired = false;
      let prevIsOver = false;

      let lastTs: number | null = null;
      let rafId: number;

      const loop = (ts: number) => {
        const deltaMs = lastTs === null ? 16.67 : ts - lastTs;
        lastTs = ts;

        // Detect the isOver: true → false transition (= game restarted).
        if (!state.isOver && prevIsOver) {
          gameOverFired = false;
        }
        prevIsOver = state.isOver;

        if (!state.isOver) {
          const result = updateGame(state, config, poolRef.current, deltaMs);

          if (result.collided && !gameOverFired) {
            gameOverFired = true;
            onGameOverRef.current?.(state.score);
          }
        }

        drawScene(ctx, state);

        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);

      // Restart on Enter key while the game-over overlay is shown.
      // We listen on `window` so the canvas doesn't need focus.
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && state.isOver) {
          e.preventDefault();
          resetGame(state, config);
        }
      };

      // Restart on click/tap directly on the canvas.
      const handleCanvasClick = () => {
        if (state.isOver) resetGame(state, config);
      };

      window.addEventListener('keydown', handleKeyDown);
      canvas.addEventListener('click', handleCanvasClick);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('keydown', handleKeyDown);
        canvas.removeEventListener('click', handleCanvasClick);
        // Null the refs so any in-flight imperative calls are safely no-ops.
        stateRef.current = null;
        configRef.current = null;
      };
    }, []); // ← intentionally empty: loop starts once and cleans up on unmount

    return (
      <canvas
        ref={canvasRef}
        className={className}
        // CSS: fill container width; aspect-ratio maintains proportional height
        // so the parent doesn't need an explicit height.
        // The canvas *buffer* is GAME_W*dpr × GAME_H*dpr; CSS stretches it to
        // fill this box uniformly.
        style={{
          display: 'block',
          width: '100%',
          aspectRatio: `${GAME_W} / ${GAME_H}`,
        }}
        aria-label="Hiragana endless runner — type kana to jump and duck"
        role="img"
      />
    );
  },
);
