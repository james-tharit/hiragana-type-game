import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { GROUPS } from '@wakana/core';
import { FilterProvider } from '@wakana/core';
import { ArcadeSliderPage } from './ArcadeSliderPage';

const renderPage = () =>
  render(
    <HelmetProvider>
      <FilterProvider>
        <ArcadeSliderPage />
      </FilterProvider>
    </HelmetProvider>,
  );

describe('ArcadeSliderPage', () => {
  it('advances the strip to the next kana after typing the current one correctly', async () => {
    const user = userEvent.setup();
    renderPage();

    const track = screen.getByTestId('kana-slider-track');
    const current = track.querySelector('[aria-current="true"]');
    expect(current).not.toBeNull();

    const allEntries = GROUPS.flatMap((g) => g.entries);
    const entry = allEntries.find((e) => e.kana === current!.textContent);
    expect(entry).toBeDefined();

    await user.keyboard(entry!.romaji);

    expect(track.style.transform).toBe('translateX(-144px)');
    const nowCurrent = track.querySelector('[aria-current="true"]');
    expect(nowCurrent).toBe(track.children[1]);
  });
});
