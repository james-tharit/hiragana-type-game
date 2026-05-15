import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const renderApp = () => render(<MemoryRouter><App /></MemoryRouter>);

describe('Window Focus', () => {
  it('refocuses the typing input when a character key is pressed while unfocused', () => {
    renderApp();

    const inputZone = screen.getByTestId('input-zone');
    fireEvent.blur(inputZone);

    expect(screen.getByRole('button', { name: /click or press any key to focus/i })).toBeTruthy();

    fireEvent.keyDown(window, { key: 'a' });

    expect(inputZone).toHaveFocus();
  });
});
