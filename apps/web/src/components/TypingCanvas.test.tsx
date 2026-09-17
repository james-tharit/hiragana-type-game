
import { render, screen, fireEvent, within } from '@testing-library/react';
import TypingCanvas from './TypingCanvas';
import type { Entry } from '@wakana/core';
import { toRubySegments } from '../data/furigana';
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
        targetRevealed: false,
        revealTarget: vi.fn(),
        script: 'hiragana' as const,
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

    describe('script rendering', () => {
        const tokens = [
            { kana: 'あ', romaji: 'a' },
            { kana: 'か', romaji: 'ka' },
        ] as Entry[];

        it('renders tokens in katakana when script is katakana', () => {
            render(<TypingCanvas {...baseProps} tokens={tokens} script="katakana" inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            expect(screen.getByText('ア')).toBeInTheDocument();
            expect(screen.getByText('カ')).toBeInTheDocument();
        });

        it('updates displayed tokens when script switches on an already-rendered canvas', () => {
            const { rerender } = render(<TypingCanvas {...baseProps} tokens={tokens} script="hiragana" inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            expect(screen.getByText('あ')).toBeInTheDocument();

            rerender(<TypingCanvas {...baseProps} tokens={tokens} script="katakana" inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            expect(screen.getByText('ア')).toBeInTheDocument();
            expect(screen.queryByText('あ')).not.toBeInTheDocument();
        });
    });

    describe('reveal hint', () => {
        it('shows the reveal button before any mistake has been made', () => {
            render(<TypingCanvas {...baseProps} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            expect(screen.getByRole('button', { name: /Reveal target/i })).toBeInTheDocument();
        });

        it('reveals the current mora when the reveal button is clicked', () => {
            render(<TypingCanvas {...baseProps} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} targetRevealed />);
            expect(screen.getByText('a')).toBeInTheDocument();
        });
    });

    describe('ruby segments', () => {
        const segments = toRubySegments([
            { text: '猫', reading: 'ねこ' },
            { text: 'が' },
            { text: '。' },
        ]);

        it('renders the kanji as ruby base with its reading in rt, and non-kanji plain', () => {
            const { container } = render(
                <TypingCanvas {...baseProps} segments={segments} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );

            const ruby = container.querySelector('ruby');
            expect(ruby).not.toBeNull();
            expect(ruby!.childNodes[0].textContent).toBe('猫');

            const rt = ruby!.querySelector('rt');
            expect(rt!.textContent).toBe('ねこ');

            const ga = screen.getByText('が');
            expect(ga.closest('ruby')).toBeNull();
        });

        it('colors reading chars by mora relative to index', () => {
            const { container } = render(
                <TypingCanvas {...baseProps} segments={segments} index={1} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            const rt = container.querySelector('rt')!;
            expect(within(rt).getByText('ね').className).toContain('text-bark');
            expect(within(rt).getByText('こ').className).toContain('text-moss');
        });

        it('marks the active mora as error when currentWrong', () => {
            const { container } = render(
                <TypingCanvas {...baseProps} segments={segments} index={1} currentWrong inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            const rt = container.querySelector('rt')!;
            expect(within(rt).getByText('こ').className).toContain('text-red-700');
        });

        it('never marks a null-mora char active', () => {
            render(
                <TypingCanvas {...baseProps} segments={segments} index={5} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            expect(screen.getByText('。').className).not.toContain('text-moss');
        });
    });
});
