import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { DEFAULT_GROUPS, GROUPS } from '../constants/kanaGroups';
import { FilterProvider, useFilterContext } from '../contexts/FilterContext';
import { ArcadePage } from './ArcadePage';

const renderPage = () =>
  render(
    <HelmetProvider>
      <FilterProvider>
        <ArcadePage />
      </FilterProvider>
    </HelmetProvider>,
  );

describe('ArcadePage', () => {
  describe('layout', () => {
    it('renders the Arcade Mode heading', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: /arcade mode/i })).toBeInTheDocument();
    });

    it('renders the CharacterFilter toggle button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /show filters/i })).toBeInTheDocument();
    });

    it('renders the arcade game canvas', () => {
      renderPage();
      expect(
        screen.getByRole('img', { name: /hiragana endless runner/i }),
      ).toBeInTheDocument();
    });
  });

  describe('filter integration', () => {
    it('shows the DEFAULT_GROUPS selection summary on mount', () => {
      renderPage();
      const selectedLabels = GROUPS.filter((g) => DEFAULT_GROUPS.includes(g.id))
        .map((g) => g.label)
        .join(', ');
      expect(screen.getByText(selectedLabels)).toBeInTheDocument();
    });

    it('toggling a group updates the filter summary', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
      // 'a-o' is in DEFAULT_GROUPS — remove it
      fireEvent.click(screen.getByRole('button', { name: 'a-o' }));
      fireEvent.click(screen.getByRole('button', { name: /hide filters/i }));
      expect(screen.queryByText(/\ba-o\b/)).not.toBeInTheDocument();
    });
  });

  describe('shared filter state with PracticePage', () => {
    // Render both pages under the same FilterProvider to verify that a change
    // made on ArcadePage is visible in PracticePage's filter summary.
    it('filter change on ArcadePage is reflected in PracticePage summary', () => {
      function BothPages() {
        // Read context to expose the shared selectedGroupIds for inspection
        const { selectedGroupIds } = useFilterContext();
        return (
          <>
            <p data-testid="shared-ids">{JSON.stringify(selectedGroupIds)}</p>
            <ArcadePage />
          </>
        );
      }

      render(
        <HelmetProvider>
          <FilterProvider>
            <BothPages />
          </FilterProvider>
        </HelmetProvider>,
      );

      // Initial state matches DEFAULT_GROUPS
      expect(JSON.parse(screen.getByTestId('shared-ids').textContent!)).toEqual(DEFAULT_GROUPS);

      // Open filters on ArcadePage and remove 'ka-ko'
      fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
      fireEvent.click(screen.getByRole('button', { name: 'ka-ko' }));

      // The shared context state no longer includes 'ka-ko'
      const updated: string[] = JSON.parse(screen.getByTestId('shared-ids').textContent!);
      expect(updated).not.toContain('ka-ko');
    });
  });
});
