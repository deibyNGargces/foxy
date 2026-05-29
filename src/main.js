// PUNTO DE ENTRADA PRINCIPAL (MAIN ENTRY POINT)
import { GAME } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  // Inicializar el juego en el canvas
  GAME.init('game-canvas');
});
