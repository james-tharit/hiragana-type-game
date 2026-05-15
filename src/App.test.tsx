import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GROUPS } from './constants/kanaGroups';
import App from './App';

const renderApp = () => render(<MemoryRouter><App /></MemoryRouter>);

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
