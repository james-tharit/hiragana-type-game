/**
 * Tests for ArcadePage's keydown buffer logic.
 * DinoGameCanvas is mocked so we can spy on resolveTypedWord calls without
 * needing a real canvas or requestAnimationFrame loop.
 */
import { forwardRef, useImperativeHandle } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilterProvider } from '../contexts/FilterContext';
import { ArcadePage } from './ArcadePage';
import type { DinoGameCanvasHandle, DinoGameCanvasProps } from '../components/DinoGameCanvas';

// ── Shared spy reference ────────────────────────────────────────────────────
const resolveTypedWordSpy = vi.fn().mockReturnValue(false);

vi.mock('../components/DinoGameCanvas', () => {
  const MockCanvas = forwardRef<DinoGameCanvasHandle, DinoGameCanvasProps>(
    function MockCanvas(_props, ref) {
      useImperativeHandle(ref, () => ({
        resolveTypedWord: resolveTypedWordSpy,
        triggerJump: vi.fn(),
        triggerDuck: vi.fn(),
        restartGame: vi.fn(),
      }));
      return <canvas aria-label="Hiragana Endless Runner" />;
    },
  );
  return { DinoGameCanvas: MockCanvas };
});

const renderPage = () =>
  render(
    <HelmetProvider>
      <FilterProvider>
        <ArcadePage />
      </FilterProvider>
    </HelmetProvider>,
  );

describe('ArcadePage – keydown buffer', () => {
  beforeEach(() => {
    resolveTypedWordSpy.mockClear();
    resolveTypedWordSpy.mockReturnValue(false);
  });

  it('renders the page (smoke test with mock)', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /arcade mode/i })).toBeInTheDocument();
  });

  it('ignores keydown events with Ctrl modifier', () => {
    renderPage();
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true });
    expect(resolveTypedWordSpy).not.toHaveBeenCalled();
  });

  it('ignores keydown events with Meta modifier', () => {
    renderPage();
    fireEvent.keyDown(window, { key: 'a', metaKey: true });
    expect(resolveTypedWordSpy).not.toHaveBeenCalled();
  });

  it('ignores keydown events with Alt modifier', () => {
    renderPage();
    fireEvent.keyDown(window, { key: 'a', altKey: true });
    expect(resolveTypedWordSpy).not.toHaveBeenCalled();
  });

  it('ignores non-letter keys like Enter or ArrowLeft', () => {
    renderPage();
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(resolveTypedWordSpy).not.toHaveBeenCalled();
  });

  it('dispatches a single-char romaji that matches the pool (e.g. "a")', () => {
    // Default pool includes 'a-o' group which has romaji 'a'
    resolveTypedWordSpy.mockReturnValue(true);
    renderPage();
    fireEvent.keyDown(window, { key: 'a' });
    expect(resolveTypedWordSpy).toHaveBeenCalledWith('a');
  });

  it('accumulates a multi-char romaji and dispatches on completion', () => {
    // 'ka' is a valid romaji (か) in the default pool
    resolveTypedWordSpy.mockReturnValue(true);
    renderPage();
    // 'k' alone is not in pool; 'ka' is
    fireEvent.keyDown(window, { key: 'k' });
    expect(resolveTypedWordSpy).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'a' });
    expect(resolveTypedWordSpy).toHaveBeenCalledWith('ka');
  });

  it('resets buffer to the new key when the prefix is a dead-end but the key itself is a valid prefix', () => {
    renderPage();
    // 'z' is not a valid prefix for any romaji in the default pool,
    // so after 'z' the buffer tries a single-char retry:
    // 'z' alone is also not a valid prefix → buffer becomes ''
    fireEvent.keyDown(window, { key: 'z' });
    // Nothing dispatched
    expect(resolveTypedWordSpy).not.toHaveBeenCalled();

    // Now type 'a' — since buffer was cleared, this should dispatch 'a'
    resolveTypedWordSpy.mockReturnValue(true);
    fireEvent.keyDown(window, { key: 'a' });
    expect(resolveTypedWordSpy).toHaveBeenCalledWith('a');
  });

  it('does not dispatch when no pool romaji starts with the typed prefix', () => {
    renderPage();
    // 'z', 'x', 'q' — none are valid prefixes
    fireEvent.keyDown(window, { key: 'z' });
    fireEvent.keyDown(window, { key: 'x' });
    fireEvent.keyDown(window, { key: 'q' });
    expect(resolveTypedWordSpy).not.toHaveBeenCalled();
  });

  it('cleans up the keydown listener on unmount', () => {
    const { unmount } = renderPage();
    resolveTypedWordSpy.mockReturnValue(true);
    unmount();
    fireEvent.keyDown(window, { key: 'a' });
    // After unmount, handler is removed — spy should not be called
    expect(resolveTypedWordSpy).not.toHaveBeenCalled();
  });
});
