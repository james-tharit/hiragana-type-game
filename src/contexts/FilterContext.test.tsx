import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { DEFAULT_GROUPS, GROUPS } from '../constants/kanaGroups';
import { FilterProvider, useFilterContext } from './FilterContext';

// ── Test consumer ────────────────────────────────────────────────────────────
// Renders the context values into the DOM and exposes buttons for each
// toggle function so we can drive them with fireEvent.

const FIRST_FAMILY = GROUPS[0].family;
const FIRST_FAMILY_IDS = GROUPS.filter((g) => g.family === FIRST_FAMILY).map((g) => g.id);

function Consumer() {
  const { selectedGroupIds, allGroupIds, toggleGroup, toggleAllGroups, toggleGroupFamily } =
    useFilterContext();

  return (
    <div>
      <p data-testid="selected">{JSON.stringify(selectedGroupIds)}</p>
      <p data-testid="all-count">{allGroupIds.length}</p>
      <button onClick={() => toggleGroup('ka-ko')}>toggle ka-ko</button>
      <button onClick={toggleAllGroups}>toggle all</button>
      <button onClick={() => toggleGroupFamily(FIRST_FAMILY_IDS)}>toggle first family</button>
    </div>
  );
}

const renderConsumer = () =>
  render(
    <FilterProvider>
      <Consumer />
    </FilterProvider>,
  );

const getSelected = (): string[] =>
  JSON.parse(screen.getByTestId('selected').textContent!);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('FilterContext', () => {
  describe('initial state', () => {
    it('initialises selectedGroupIds with DEFAULT_GROUPS', () => {
      renderConsumer();
      expect(getSelected()).toEqual(DEFAULT_GROUPS);
    });

    it('exposes allGroupIds matching the full GROUPS list', () => {
      renderConsumer();
      expect(Number(screen.getByTestId('all-count').textContent)).toBe(GROUPS.length);
    });
  });

  describe('toggleGroup', () => {
    it('removes a group that is already selected', () => {
      renderConsumer();
      expect(getSelected()).toContain('ka-ko');
      fireEvent.click(screen.getByRole('button', { name: 'toggle ka-ko' }));
      expect(getSelected()).not.toContain('ka-ko');
    });

    it('adds a group that is not selected', () => {
      renderConsumer();
      // Remove 'ka-ko', then add it back
      fireEvent.click(screen.getByRole('button', { name: 'toggle ka-ko' }));
      expect(getSelected()).not.toContain('ka-ko');
      fireEvent.click(screen.getByRole('button', { name: 'toggle ka-ko' }));
      expect(getSelected()).toContain('ka-ko');
    });
  });

  describe('toggleAllGroups', () => {
    it('selects all groups when the selection is partial', () => {
      renderConsumer();
      // DEFAULT_GROUPS is partial, so one click should select all
      fireEvent.click(screen.getByRole('button', { name: 'toggle all' }));
      expect(getSelected()).toHaveLength(GROUPS.length);
    });

    it('de-selects all groups when all are currently selected', () => {
      renderConsumer();
      fireEvent.click(screen.getByRole('button', { name: 'toggle all' })); // → all selected
      fireEvent.click(screen.getByRole('button', { name: 'toggle all' })); // → none selected
      expect(getSelected()).toHaveLength(0);
    });
  });

  describe('toggleGroupFamily', () => {
    it('selects all members of a family when none are selected', () => {
      renderConsumer();
      // Clear everything first
      fireEvent.click(screen.getByRole('button', { name: 'toggle all' })); // select all
      fireEvent.click(screen.getByRole('button', { name: 'toggle all' })); // de-select all
      fireEvent.click(screen.getByRole('button', { name: 'toggle first family' }));

      const selected = getSelected();
      for (const id of FIRST_FAMILY_IDS) {
        expect(selected).toContain(id);
      }
    });

    it('de-selects all members of a family when all are already selected', () => {
      renderConsumer();
      // Select everything so the whole family is in
      fireEvent.click(screen.getByRole('button', { name: 'toggle all' }));
      fireEvent.click(screen.getByRole('button', { name: 'toggle first family' }));

      const selected = getSelected();
      for (const id of FIRST_FAMILY_IDS) {
        expect(selected).not.toContain(id);
      }
    });

    it('does not produce duplicate IDs when adding a partially-selected family', () => {
      renderConsumer();
      // DEFAULT_GROUPS already contains some members of the first family;
      // toggling the family should not create duplicates.
      fireEvent.click(screen.getByRole('button', { name: 'toggle first family' }));
      const selected = getSelected();
      const unique = new Set(selected);
      expect(selected).toHaveLength(unique.size);
    });
  });

  describe('error boundary', () => {
    it('throws when useFilterContext is called outside FilterProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Consumer />)).toThrow(
        'useFilterContext must be used within FilterProvider',
      );
      spy.mockRestore();
    });
  });
});
