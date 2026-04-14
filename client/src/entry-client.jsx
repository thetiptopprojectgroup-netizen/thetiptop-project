import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './styles/index.css';

const appTree = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

const container = document.getElementById('root');
if (container.firstElementChild != null) {
  hydrateRoot(container, appTree);
} else {
  createRoot(container).render(appTree);
}

/* PWA : service worker pour permettre l’installation (Chrome/Edge, HTTPS). */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
