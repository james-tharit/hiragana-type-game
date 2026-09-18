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

    it('renders katakana form when script is katakana', () => {
        render(<KanaSlider tokens={tokens} script="katakana" index={0} />);
        expect(screen.getByText(displayFor('あ', 'katakana'))).toBeInTheDocument();
    });
});
