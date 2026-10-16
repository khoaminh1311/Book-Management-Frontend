import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

// Disable native browser scroll restoration — React Router's <ScrollRestoration />
// handles this explicitly. Without this, Chromium's history.scrollRestoration='auto'
// fires during useBlocker's history.go(1) call and causes a visible scroll jerk.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
