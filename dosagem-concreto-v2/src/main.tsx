import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { getUsuario } from './data/authAdapter';
import './ui/tokens.css';
async function iniciar() {
  const usuario = await getUsuario();
  if (!usuario) {
    sessionStorage.setItem('dosagem-retorno', location.pathname + location.hash);
    location.replace('/auth/login/');
    return;
  }
  if (usuario.trocarSenha) {
    location.replace('/auth/trocar-senha/');
    return;
  }
  registerSW({ immediate: true });
  createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
}
void iniciar();
