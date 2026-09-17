
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
        toplineVisible: false,
        toggleTopline: vi.fn(),
        onRestart: vi.fn(),
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

    describe('practice topline', () => {
        it('renders a ruby per token with romaji as rt when topline is visible', () => {
            const { container } = render(
                <TypingCanvas {...baseProps} toplineVisible inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            const rubies = container.querySelectorAll('ruby');
            expect(rubies.length).toBe(2);
            expect(rubies[0].querySelector('rt')!.textContent).toBe('a');
            expect(rubies[1].querySelector('rt')!.textContent).toBe('i');
        });

        it('renders no ruby at all when topline is hidden', () => {
            const { container } = render(
                <TypingCanvas {...baseProps} toplineVisible={false} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            expect(container.querySelector('ruby')).toBeNull();
        });
    });

    describe('action row', () => {
        it('calls onRestart when Restart is clicked', () => {
            const onRestart = vi.fn();
            render(<TypingCanvas {...baseProps} onRestart={onRestart} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            fireEvent.click(screen.getByRole('button', { name: /Restart/i }));
            expect(onRestart).toHaveBeenCalled();
        });

        it('calls toggleTopline when the reading button is clicked', () => {
            const toggleTopline = vi.fn();
            render(<TypingCanvas {...baseProps} toggleTopline={toggleTopline} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            fireEvent.click(screen.getByRole('button', { name: /Show reading/i }));
            expect(toggleTopline).toHaveBeenCalled();
        });

        it('labels the button Show reading when topline is hidden', () => {
            render(<TypingCanvas {...baseProps} toplineVisible={false} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            expect(screen.getByRole('button', { name: /Show reading/i })).toBeInTheDocument();
        });

        it('labels the button Hide reading when topline is visible', () => {
            render(<TypingCanvas {...baseProps} toplineVisible inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            expect(screen.getByRole('button', { name: /Hide reading/i })).toBeInTheDocument();
        });

        it('never renders a Reveal target button or a Target readout', () => {
            const { rerender } = render(<TypingCanvas {...baseProps} toplineVisible={false} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            expect(screen.queryByRole('button', { name: /Reveal target/i })).not.toBeInTheDocument();
            expect(screen.queryByText(/Target:/i)).not.toBeInTheDocument();

            rerender(<TypingCanvas {...baseProps} toplineVisible inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />);
            expect(screen.queryByRole('button', { name: /Reveal target/i })).not.toBeInTheDocument();
            expect(screen.queryByText(/Target:/i)).not.toBeInTheDocument();
        });
    });

    describe('ruby segments (topline visible)', () => {
        const segments = toRubySegments([
            { text: '猫', reading: 'ねこ' },
            { text: 'が' },
            { text: '。' },
        ]);

        it('renders the kanji as ruby base with its reading in rt, and non-kanji plain', () => {
            const { container } = render(
                <TypingCanvas {...baseProps} segments={segments} toplineVisible inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
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
                <TypingCanvas {...baseProps} segments={segments} index={1} toplineVisible inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            const rt = container.querySelector('rt')!;
            expect(within(rt).getByText('ね').className).toContain('text-bark');
            expect(within(rt).getByText('こ').className).toContain('text-moss');
        });

        it('marks the active mora as error when currentWrong', () => {
            const { container } = render(
                <TypingCanvas {...baseProps} segments={segments} index={1} currentWrong toplineVisible inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            const rt = container.querySelector('rt')!;
            expect(within(rt).getByText('こ').className).toContain('text-red-700');
        });

        it('never marks a null-mora char active', () => {
            render(
                <TypingCanvas {...baseProps} segments={segments} index={5} toplineVisible inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            expect(screen.getByText('。').className).not.toContain('text-moss');
        });
    });

    describe('ruby segments (topline hidden)', () => {
        const segments = toRubySegments([
            { text: '猫', reading: 'ねこ' },
            { text: 'が' },
            { text: '。' },
        ]);

        it('renders no rt anywhere', () => {
            const { container } = render(
                <TypingCanvas {...baseProps} segments={segments} toplineVisible={false} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            expect(container.querySelector('rt')).toBeNull();
        });

        it('colours a fully-typed segment base as done', () => {
            // ね=mora0, こ=mora1, が=mora2 — index 2 means 猫(ねこ) is fully typed.
            render(
                <TypingCanvas {...baseProps} segments={segments} index={2} toplineVisible={false} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            expect(screen.getByText('猫').className).toContain('text-bark');
        });

        it('colours the segment holding the current mora as active', () => {
            render(
                <TypingCanvas {...baseProps} segments={segments} index={2} toplineVisible={false} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            expect(screen.getByText('が').className).toContain('text-moss');
        });

        it('colours the active segment as error when currentWrong', () => {
            render(
                <TypingCanvas {...baseProps} segments={segments} index={2} currentWrong toplineVisible={false} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            expect(screen.getByText('が').className).toContain('text-red-700');
        });

        it('keeps a punctuation-only segment pending regardless of index', () => {
            render(
                <TypingCanvas {...baseProps} segments={segments} index={5} toplineVisible={false} inputZoneRef={{ current: null }} isFocused setIsFocused={vi.fn()} />,
            );
            expect(screen.getByText('。').className).toContain('text-sage');
        });
    });
});
