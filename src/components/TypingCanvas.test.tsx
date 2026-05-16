
import { render, screen, fireEvent } from '@testing-library/react';
import TypingCanvas from './TypingCanvas';
import type { Entry } from '../constants/kanaGroups';
import React from 'react';
import { vi, describe, it, expect } from 'vitest';

describe('TypingCanvas', () => {
    const baseProps = {
        tokens: [
            { kana: 'あ', romaji: 'a' },
            { kana: 'い', romaji: 'i' },
        ] as Entry[],
        index: 0,
        buffer: '',
        composedKana: '',
        currentWrong: false,
        isFinished: false,
        accuracy: 100,
        hasFailedOnce: false,
        targetRevealed: false,
        revealTarget: vi.fn(),
    };

    function FocusHarness() {
        const [isFocused, setIsFocused] = React.useState(true);
        const inputZoneRef = React.useRef<HTMLDivElement>(null);

        return (
            <TypingCanvas
                {...baseProps}
                inputZoneRef={inputZoneRef}
                isFocused={isFocused}
                setIsFocused={setIsFocused}
            />
        );
    }

    describe('Focus', () => {
        it('shows focus overlay when not focused', () => {
            render(<FocusHarness />);
            // Blur the input zone
            const inputZone = screen.getByTestId('input-zone');
            fireEvent.blur(inputZone);
            expect(screen.getByRole('button', { name: /Click or Press Any Key To Focus/i })).toBeInTheDocument();
        });
        it('focuses input when Click To Focus is clicked', () => {
            render(<FocusHarness />);
            const inputZone = screen.getByTestId('input-zone');
            fireEvent.blur(inputZone);
            const focusBtn = screen.getByRole('button', { name: /Click or Press Any Key To Focus/i });
            fireEvent.click(focusBtn);
            // After click, input should be focused
            expect(inputZone).toHaveFocus();
        });
    })

});
