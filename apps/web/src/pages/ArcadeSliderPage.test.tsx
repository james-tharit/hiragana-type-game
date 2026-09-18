import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { GROUPS, ROUND_SIZE } from '@wakana/core';
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

const allEntries = GROUPS.flatMap((g) => g.entries);

function romajiFor(kana: string): string {
  const entry = allEntries.find((e) => e.kana === kana);
  expect(entry).toBeDefined();
  return entry!.romaji;
}

describe('ArcadeSliderPage', () => {
  it('advances the strip to the next kana after typing the current one correctly', async () => {
    const user = userEvent.setup();
    renderPage();

    const track = screen.getByTestId('kana-slider-track');
    const current = track.querySelector('[aria-current="true"]');
    expect(current).not.toBeNull();

    const romaji = romajiFor(current!.textContent!);

    await user.keyboard(romaji);

    expect(track.style.transform).toBe('translateX(-144px)');
    const nowCurrent = track.querySelector('[aria-current="true"]');
    expect(nowCurrent).toBe(track.children[1]);
  });

  it('marks the current kana wrong and does not advance on an invalid keystroke', async () => {
    const user = userEvent.setup();
    renderPage();

    const track = screen.getByTestId('kana-slider-track');
    const current = track.querySelector('[aria-current="true"]');
    expect(current).not.toBeNull();

    const romaji = romajiFor(current!.textContent!);

    const wrongKey = 'aeioukstnhmyrwgzdbpj'
      .split('')
      .find((letter) => !romaji.startsWith(letter));
    expect(wrongKey).toBeDefined();

    await user.keyboard(wrongKey!);

    expect(track.style.transform).toBe('translateX(-48px)');
    const stillCurrent = track.querySelector('[aria-current="true"]');
    expect(stillCurrent).toHaveAttribute('aria-invalid', 'true');
  });

  it('appends more kana instead of running out as the reader nears the end of the stream', async () => {
    const user = userEvent.setup();
    renderPage();

    const track = screen.getByTestId('kana-slider-track');
    expect(track.children).toHaveLength(ROUND_SIZE);

    for (let i = 0; i < 21; i += 1) {
      const current = track.querySelector('[aria-current="true"]');
      const romaji = romajiFor(current!.textContent!);
      await user.keyboard(romaji);
    }

    expect(track.children.length).toBeGreaterThan(ROUND_SIZE);
  });

  it('restarts the stream from a fresh round when the kana-group filter changes', async () => {
    const user = userEvent.setup();
    renderPage();

    const track = screen.getByTestId('kana-slider-track');
    const current = track.querySelector('[aria-current="true"]');
    const romaji = romajiFor(current!.textContent!);

    await user.keyboard(romaji);
    expect(track.style.transform).not.toBe('translateX(-48px)');

    await user.click(screen.getByRole('button', { name: 'Show filters' }));
    await user.click(screen.getByRole('button', { name: 'ka-ko' }));

    expect(track.style.transform).toBe('translateX(-48px)');
    const restartedCurrent = track.querySelector('[aria-current="true"]');
    expect(restartedCurrent).toBe(track.children[0]);
  });
});
