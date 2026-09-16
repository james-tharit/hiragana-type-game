import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { GROUPS } from '../constants/kanaGroups';
import { AppRoutes } from '../routes/AppRoutes';
import CharacterFilter from './CharacterFilter';

const noop = () => {};

const renderApp = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/practice']}>
        <AppRoutes />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('Character filter selection logic', () => {
  it('selects and de-selects ka-ko', () => {
    renderApp();

    expect(screen.getByText('Selected:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show filters' }));

    const kaButton = screen.getByRole('button', { name: 'ka-ko' });

    expect(kaButton.className).toContain('bg-ink-100');

    fireEvent.click(kaButton);
    expect(kaButton.className).toContain('bg-white/5');

    fireEvent.click(kaButton);
    expect(kaButton.className).toContain('bg-ink-100');
  });

  it('selects and de-selects an entire group family', () => {
    renderApp();

    expect(screen.getByText('Selected:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show filters' }));

    const familyToggleButtons = screen.getAllByRole('button', { name: 'Select family' });
    const monographsToggleButton = familyToggleButtons[0];

    expect(monographsToggleButton.textContent).toBe('Select family');

    fireEvent.click(monographsToggleButton);
    expect(monographsToggleButton.textContent).toBe('De-select family');

    fireEvent.click(monographsToggleButton);
    expect(monographsToggleButton.textContent).toBe('Select family');
  });

  it('only injects characters from the selected family into the type area', () => {
    renderApp();

    expect(screen.getByText('Selected:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show filters' }));

    // Select all groups so every family button shows "De-select family"
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));

    // Family order from GROUPS: Monographs [0], Diacritics [1], Digraphs [2]
    // De-select Monographs then Diacritics, leaving only Digraphs active
    let deSelectButtons = screen.getAllByRole('button', { name: 'De-select family' });
    fireEvent.click(deSelectButtons[0]); // Monographs → deselected

    deSelectButtons = screen.getAllByRole('button', { name: 'De-select family' });
    fireEvent.click(deSelectButtons[0]); // Diacritics → deselected

    const digraphsKana = new Set(
      GROUPS.filter((g) => g.family === 'Digraphs').flatMap((g) => g.entries.map((e) => e.kana)),
    );

    // Kana tokens are <span> elements containing only hiragana characters
    const hiraganaPattern = /^[\u3041-\u3096]+$/;
    const allSpans = Array.from(document.querySelectorAll('span'));
    const kanaSpans = allSpans.filter((span) => hiraganaPattern.test(span.textContent ?? ''));

    expect(kanaSpans.length).toBeGreaterThan(0);
    for (const span of kanaSpans) {
      expect(digraphsKana.has(span.textContent!)).toBe(true);
    }
  });
});

describe('CharacterFilter script selector', () => {
  const renderFilter = (script: 'hiragana' | 'katakana', onScriptChange = noop) =>
    render(
      <CharacterFilter
        groups={GROUPS}
        selectedGroupIds={[]}
        targetKanaLength={0}
        onToggleGroup={noop}
        onToggleAllGroups={noop}
        onToggleGroupFamily={noop}
        script={script}
        onScriptChange={onScriptChange}
      />,
    );

  it('renders both script labels', () => {
    renderFilter('hiragana');
    expect(screen.getByRole('button', { name: 'Hiragana' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Katakana' })).toBeTruthy();
  });

  it('marks only the current script as pressed', () => {
    renderFilter('hiragana');
    expect(screen.getByRole('button', { name: 'Hiragana' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Katakana' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onScriptChange with the clicked script', () => {
    const onScriptChange = vi.fn();
    renderFilter('hiragana', onScriptChange);
    fireEvent.click(screen.getByRole('button', { name: 'Katakana' }));
    expect(onScriptChange).toHaveBeenCalledTimes(1);
    expect(onScriptChange).toHaveBeenCalledWith('katakana');
  });
});

