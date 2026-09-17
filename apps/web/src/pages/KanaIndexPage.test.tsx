import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { KanaIndexPage } from './KanaIndexPage';
import { GROUPS } from '@wakana/core';

const renderPage = (initialPath = '/kana') =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <KanaIndexPage />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('KanaIndexPage', () => {
  it('renders the Hiragana Chart heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /hiragana chart/i })).toBeInTheDocument();
  });

  it('renders all three family section headings', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /monographs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /diacritics/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /digraphs/i })).toBeInTheDocument();
  });

  it('renders a link for every kana group', () => {
    renderPage();
    const links = screen.getAllByRole('link');
    const groupLabels = GROUPS.map((g) => g.label);
    // Every group label should appear in a link
    for (const label of groupLabels) {
      expect(links.some((l) => l.textContent?.includes(label))).toBe(true);
    }
  });

  it('each group link navigates to /group/:id', () => {
    renderPage();
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    const groupLinks = links.filter((l) => l.href.includes('/group/'));
    expect(groupLinks.length).toBe(GROUPS.length);

    const ids = GROUPS.map((g) => g.id);
    for (const link of groupLinks) {
      const segmentId = link.getAttribute('href')?.replace('/group/', '');
      expect(ids).toContain(segmentId);
    }
  });

  it('renders kana characters inside each group row', () => {
    renderPage();
    // Pick entries from the first group to verify they appear on the page
    const firstGroup = GROUPS[0];
    for (const entry of firstGroup.entries) {
      expect(screen.getByText(entry.kana)).toBeInTheDocument();
    }
  });

  it('renders the romaji label for each group', () => {
    renderPage();
    for (const group of GROUPS) {
      expect(screen.getByText(group.label)).toBeInTheDocument();
    }
  });
});
