
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
        onKeyDown: vi.fn(),
    };

    describe('Focus', () => {
        it('shows focus overlay when not focused', () => {
            render(<TypingCanvas {...baseProps} />);
            // Blur the input zone
            const inputZone = screen.getByTestId('input-zone');
            fireEvent.blur(inputZone);
            expect(screen.getByText(/Click To Focus/i)).toBeInTheDocument();
        });
        it('focuses input when Click To Focus is clicked', () => {
            render(<TypingCanvas {...baseProps} />);
            const inputZone = screen.getByTestId('input-zone');
            fireEvent.blur(inputZone);
            const focusBtn = screen.getByText(/Click To Focus/i);
            fireEvent.click(focusBtn);
            // After click, input should be focused
            expect(inputZone).toHaveFocus();
        });
    })

});
