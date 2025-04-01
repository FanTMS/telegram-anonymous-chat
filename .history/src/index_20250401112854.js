import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { isBrowser } from './utils/browserUtils';

// Проверяем, находимся ли мы в браузерной среде
if (isBrowser()) {
  const container = document.getElementById('root');
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
