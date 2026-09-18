import { render, screen } from '@testing-library/react';
import KanaSlider from './KanaSlider';
import { displayFor } from '@wakana/core';
import type { Entry } from '@wakana/core';
import { describe, it, expect } from 'vitest';

describe('KanaSlider', () => {
    const tokens: Entry[] = [
        { kana: 'あ', romaji: 'a' },
        { kana: 'い', romaji: 'i' },
        { kana: 'う', romaji: 'u' },
    ];

    it('renders every token kana', () => {
        render(<KanaSlider tokens={tokens} script="hiragana" index={0} />);
        tokens.forEach((token) => {
            expect(screen.getByText(token.kana)).toBeInTheDocument();
        });
    });

    it('marks only the slot at index as current', () => {
        render(<KanaSlider tokens={tokens} script="hiragana" index={2} />);
        expect(screen.getByText('う')).toHaveAttribute('aria-current', 'true');
        expect(screen.getByText('あ')).not.toHaveAttribute('aria-current');
        expect(screen.getByText('い')).not.toHaveAttribute('aria-current');
    });

    it('translates the track so the current slot sits at centre', () => {
        const { rerender } = render(<KanaSlider tokens={tokens} script="hiragana" index={2} />);
        expect(screen.getByTestId('kana-slider-track').style.transform).toBe('translateX(-240px)');

        rerender(<KanaSlider tokens={tokens} script="hiragana" index={0} />);
        expect(screen.getByTestId('kana-slider-track').style.transform).toBe('translateX(-48px)');
    });

    it('marks the current slot invalid and red when currentWrong is true', () => {
        render(<KanaSlider tokens={tokens} script="hiragana" index={0} currentWrong />);
        expect(screen.getByText('あ')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('あ')).toHaveClass('text-red-700');
    });

    it('does not mark the current slot invalid when currentWrong is false', () => {
        render(<KanaSlider tokens={tokens} script="hiragana" index={0} currentWrong={false} />);
        expect(screen.getByText('あ')).not.toHaveAttribute('aria-invalid');
    });

    // The track shifts by a px constant, so the slots must be sized in px too.
    // As rem (w-24) the two agree only at a 16px default font size, and the
    // focused kana drifts out of the frame everywhere else.
    it('sizes each slot in px so the slot width and the track shift agree', () => {
        render(<KanaSlider tokens={tokens} script="hiragana" index={2} />);

        const track = screen.getByTestId('kana-slider-track');
        const slotWidth = Number.parseFloat((track.children[0] as HTMLElement).style.width);
        const shift = Number.parseFloat(track.style.transform.replace(/[^\d.]/g, ''));

        expect((track.children[0] as HTMLElement).style.width).toBe(`${slotWidth}px`);
        expect(shift).toBe(2 * slotWidth + slotWidth / 2);
    });

    it('renders katakana form when script is katakana', () => {
        render(<KanaSlider tokens={tokens} script="katakana" index={0} />);
        expect(screen.getByText(displayFor('あ', 'katakana'))).toBeInTheDocument();
    });
});
