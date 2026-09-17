import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatsDisplay from './StatsDisplay';

const defaults = {
  progress: 3,
  total: 10,
  accuracy: 90,
  mistakeKeystrokes: 2,
  totalKeystrokes: 20,
  onRetry: vi.fn(),
};

describe('StatsDisplay', () => {
  describe('stats grid', () => {
    it('renders Progress, Accuracy, Mistakes and Keystrokes labels', () => {
      render(<StatsDisplay {...defaults} isFinished />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Mistakes')).toBeInTheDocument();
      expect(screen.getByText('Keystrokes')).toBeInTheDocument();
    });

    it('displays the progress and total values', () => {
      render(<StatsDisplay {...defaults} progress={5} total={15} isFinished />);
      expect(screen.getByText('5/15')).toBeInTheDocument();
    });

    it('displays the formatted accuracy', () => {
      render(<StatsDisplay {...defaults} accuracy={72.5} isFinished />);
      expect(screen.getByText('72.5%')).toBeInTheDocument();
    });

    it('displays mistake keystroke count', () => {
      render(<StatsDisplay {...defaults} mistakeKeystrokes={7} isFinished />);
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('displays total keystroke count', () => {
      render(<StatsDisplay {...defaults} totalKeystrokes={42} isFinished />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Retry button', () => {
    it('is visible when isFinished is true', () => {
      render(<StatsDisplay {...defaults} isFinished />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('is not rendered when isFinished is false', () => {
      render(<StatsDisplay {...defaults} isFinished={false} />);
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('is not rendered when isFinished is undefined', () => {
      render(<StatsDisplay {...defaults} />);
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('calls onRetry when clicked', () => {
      const onRetry = vi.fn();
      render(<StatsDisplay {...defaults} onRetry={onRetry} isFinished />);
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('confetti', () => {
    it('renders confetti when isFinished and accuracy > 80', () => {
      const { container } = render(
        <StatsDisplay {...defaults} accuracy={85} isFinished />,
      );
      // confetti container has aria-hidden="true"
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('does not render confetti when accuracy <= 80', () => {
      const { container } = render(
        <StatsDisplay {...defaults} accuracy={80} isFinished />,
      );
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('does not render confetti when not finished, even with high accuracy', () => {
      const { container } = render(
        <StatsDisplay {...defaults} accuracy={95} isFinished={false} />,
      );
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });
  });

  describe('accuracy color classes', () => {
    it('uses default ink color when not finished', () => {
      const { container } = render(
        <StatsDisplay {...defaults} accuracy={10} isFinished={false} />,
      );
      const accuracyValue = screen.getByText('10.0%');
      expect(accuracyValue.className).toContain('text-ink-100');
    });

    it('uses red color for accuracy < 15 when finished', () => {
      render(<StatsDisplay {...defaults} accuracy={10} isFinished />);
      const accuracyValue = screen.getByText('10.0%');
      expect(accuracyValue.className).toContain('text-red-400');
    });

    it('uses orange color for accuracy between 15 and 30 when finished', () => {
      render(<StatsDisplay {...defaults} accuracy={20} isFinished />);
      const accuracyValue = screen.getByText('20.0%');
      expect(accuracyValue.className).toContain('text-orange-400');
    });

    it('uses green color for accuracy > 80 when finished', () => {
      render(<StatsDisplay {...defaults} accuracy={90} isFinished />);
      const accuracyValue = screen.getByText('90.0%');
      expect(accuracyValue.className).toContain('text-green-400');
    });

    it('uses default ink color for accuracy between 30 and 80 when finished', () => {
      render(<StatsDisplay {...defaults} accuracy={50} isFinished />);
      const accuracyValue = screen.getByText('50.0%');
      expect(accuracyValue.className).toContain('text-ink-100');
    });
  });
});
