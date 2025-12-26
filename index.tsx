
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Shim for process.env to prevent ReferenceError in browser ESM environments
if (typeof window !== 'undefined' && !window.process) {
  // @ts-ignore
  window.process = { env: { API_KEY: '' } };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
