import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom does not implement HTMLCanvasElement.getContext — stub it so tests that
// render canvas-based components don't throw "Not implemented" errors.
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  canvas: {},
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  drawImage: vi.fn(),
  setTransform: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  createPattern: vi.fn().mockReturnValue(null),
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
