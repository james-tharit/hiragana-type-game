import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { AppRoutes } from './AppRoutes';
import { GROUPS } from '@wakana/core';

function renderAt(initialPath: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRoutes />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('AppRoutes', () => {
  describe('RootLayout', () => {
    it('renders the CommonNav on every page', () => {
      renderAt('/practice');
      // CommonNav renders a nav element (or navigation landmark)
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('route "/" → /practice redirect', () => {
    it('redirects root to practice page', () => {
      renderAt('/');
      expect(screen.getByRole('heading', { name: /practice mode/i })).toBeInTheDocument();
    });
  });

  describe('route "/practice"', () => {
    it('renders the Practice page', () => {
      renderAt('/practice');
      expect(screen.getByRole('heading', { name: /practice mode/i })).toBeInTheDocument();
    });
  });

  describe('route "/arcade"', () => {
    it('renders the Arcade page', () => {
      renderAt('/arcade');
      expect(screen.getByRole('heading', { name: /arcade mode/i })).toBeInTheDocument();
    });
  });

  describe('route "/arcade/slider"', () => {
    it('renders the Kana Slider page', () => {
      renderAt('/arcade/slider');
      expect(screen.getByRole('heading', { name: /kana slider/i })).toBeInTheDocument();
    });
  });

  describe('arcade mode tabs', () => {
    it('renders both mode links on /arcade', () => {
      renderAt('/arcade');
      expect(screen.getByRole('link', { name: /t-rex runner/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /kana slider/i })).toBeInTheDocument();
    });

    it('marks the T-Rex link current on /arcade', () => {
      renderAt('/arcade');
      expect(screen.getByRole('link', { name: /t-rex runner/i })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: /kana slider/i })).not.toHaveAttribute('aria-current', 'page');
    });

    it('marks the Kana Slider link current on /arcade/slider', () => {
      renderAt('/arcade/slider');
      expect(screen.getByRole('link', { name: /kana slider/i })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: /t-rex runner/i })).not.toHaveAttribute('aria-current', 'page');
    });
  });

  describe('route "/kana"', () => {
    it('renders the Kana Index page', () => {
      renderAt('/kana');
      expect(screen.getByRole('heading', { name: /hiragana chart/i })).toBeInTheDocument();
    });
  });

  describe('route "/about"', () => {
    it('renders the About page heading', () => {
      renderAt('/about');
      expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
    });

    it('renders a link back to practice', () => {
      renderAt('/about');
      expect(screen.getByRole('link', { name: /back to practice/i })).toBeInTheDocument();
    });

    it('attributes sentence data to Tatoeba with a link to tatoeba.org', () => {
      renderAt('/about');
      expect(screen.getByText(/tatoeba/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /tatoeba/i })).toHaveAttribute(
        'href',
        'https://tatoeba.org',
      );
    });
  });

  describe('route "/sentences"', () => {
    it('renders the Sentence Practice page', () => {
      renderAt('/sentences');
      expect(screen.getByRole('heading', { name: /sentence practice/i })).toBeInTheDocument();
    });
  });

  describe('route "/group/:id"', () => {
    it('renders the Practice page for a valid group id', () => {
      const validId = GROUPS[0].id;
      renderAt(`/group/${validId}`);
      expect(screen.getByRole('heading', { name: /practice mode/i })).toBeInTheDocument();
    });

    it('redirects to /practice for an unknown group id', () => {
      renderAt('/group/this-does-not-exist');
      expect(screen.getByRole('heading', { name: /practice mode/i })).toBeInTheDocument();
    });
  });

  describe('wildcard route', () => {
    it('redirects unknown paths to /practice', () => {
      renderAt('/some/unknown/path');
      expect(screen.getByRole('heading', { name: /practice mode/i })).toBeInTheDocument();
    });
  });
});
