import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommonNav } from './CommonNav';

const renderNav = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CommonNav />
    </MemoryRouter>,
  );

describe('CommonNav', () => {
  it('renders the brand name', () => {
    renderNav();
    expect(screen.getByText('Wakana Type')).toBeInTheDocument();
  });

  it('renders Practice, Arcade, Sentences, and About links', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Arcade' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sentences' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
  });

  it('links the Sentences tab to /sentences', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Sentences' })).toHaveAttribute('href', '/sentences');
  });

  it('links point to the correct hrefs', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Practice' })).toHaveAttribute('href', '/practice');
    expect(screen.getByRole('link', { name: 'Arcade' })).toHaveAttribute('href', '/arcade');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });

  it('highlights the Practice link when on /practice', () => {
    renderNav('/practice');
    const link = screen.getByRole('link', { name: 'Practice' });
    expect(link.className).toContain('bg-moss');
    expect(link.className).toContain('text-cream');
  });

  it('highlights the Arcade link when on /arcade', () => {
    renderNav('/arcade');
    const link = screen.getByRole('link', { name: 'Arcade' });
    expect(link.className).toContain('bg-moss');
    expect(link.className).toContain('text-cream');
  });

  it('does not highlight Practice when on /arcade', () => {
    renderNav('/arcade');
    const link = screen.getByRole('link', { name: 'Practice' });
    expect(link.className).not.toContain('bg-moss');
  });

  it('does not highlight either mode tab when on /about', () => {
    renderNav('/about');
    expect(screen.getByRole('link', { name: 'Practice' }).className).not.toContain('bg-moss');
    expect(screen.getByRole('link', { name: 'Arcade' }).className).not.toContain('bg-moss');
  });
});
