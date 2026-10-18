import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import './ui/tokens.css';
registerSW({ immediate: true });
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
