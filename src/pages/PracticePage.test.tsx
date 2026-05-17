import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { DEFAULT_GROUPS, GROUPS } from '../constants/kanaGroups';
import { FilterProvider } from '../contexts/FilterContext';
import { PracticePage } from './PracticePage';

const renderPage = () =>
  render(
    <HelmetProvider>
      <FilterProvider>
        <PracticePage />
      </FilterProvider>
    </HelmetProvider>,
  );

describe('PracticePage', () => {
  describe('layout', () => {
    it('renders the Practice Mode heading', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: /practice mode/i })).toBeInTheDocument();
    });

    it('renders the CharacterFilter toggle button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /show filters/i })).toBeInTheDocument();
    });

    it('renders the typing input zone', () => {
      renderPage();
      expect(screen.getByTestId('input-zone')).toBeInTheDocument();
    });

    it('renders the Restart button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    });
  });

  describe('filter integration', () => {
    it('shows the DEFAULT_GROUPS selection summary on mount', () => {
      renderPage();
      // The collapsed filter shows "Selected: <labels>"
      const selectedLabels = GROUPS.filter((g) => DEFAULT_GROUPS.includes(g.id))
        .map((g) => g.label)
        .join(', ');
      expect(screen.getByText(selectedLabels)).toBeInTheDocument();
    });

    it('reflects context state — toggling a group updates the filter summary', () => {
      renderPage();
      // Open the filter panel
      fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
      // 'ka-ko' is in DEFAULT_GROUPS, so its button is active; clicking removes it
      fireEvent.click(screen.getByRole('button', { name: 'ka-ko' }));
      // Collapse again and read the summary
      fireEvent.click(screen.getByRole('button', { name: /hide filters/i }));
      expect(screen.queryByText(/ka-ko/)).not.toBeInTheDocument();
    });
  });

  describe('new round', () => {
    it('clicking Restart keeps the input zone mounted', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /restart/i }));
      expect(screen.getByTestId('input-zone')).toBeInTheDocument();
    });

    it('pressing Escape also starts a fresh round', () => {
      renderPage();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByTestId('input-zone')).toBeInTheDocument();
    });
  });

  describe('window focus behaviour', () => {
    it('refocuses the input zone when a character key is pressed while unfocused', () => {
      renderPage();
      const inputZone = screen.getByTestId('input-zone');
      fireEvent.blur(inputZone);
      fireEvent.keyDown(window, { key: 'a' });
      expect(inputZone).toHaveFocus();
    });
  });
});
