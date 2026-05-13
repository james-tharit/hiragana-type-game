import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AppRoutes } from './routes/AppRoutes';

export function createApp() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
        <Analytics />
      </BrowserRouter>
    </HelmetProvider>
  );
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const app = <StrictMode>{createApp()}</StrictMode>;

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}