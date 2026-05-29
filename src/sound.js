// AUDIO CHIPTUNE RETRO USANDO WEB AUDIO API

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicPlaying = false;
    this.bgmInterval = null;
    this.masterGain = null;

    // Canción retro: notas del bajo y de la melodía (frecuencias en Hz)
    // Escala menor natural de La (A minor)
    this.bassline = [110, 110, 110, 110, 98, 98, 98, 98, 87, 87, 87, 87, 98, 98, 98, 98]; // A2, G2, F2, G2
    this.melody = [
      440, 494, 523, 587, 659, 0, 587, 523,
      392, 440, 494, 523, 587, 0, 523, 494,
      349, 392, 440, 494, 523, 0, 494, 440,
      392, 349, 392, 494, 440, 0, 0, 0
    ];
    this.currentStep = 0;
    this.tempo = 150; // BPM
  }

  init() {
    if (this.ctx) return;
    
    // Crear contexto de audio de forma segura
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime); // Controlar volumen general
    this.masterGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.25, this.ctx.currentTime);
    }
    return this.muted;
  }

  // --- EFECTOS DE SONIDO (SFX) ---

  // Sonido de Salto (Deslizamiento de frecuencia hacia arriba)
  playJump() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square'; // Sonido clásico de 8 bits
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15); // Sube rápido

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15); // Se desvanece

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Sonido de Disparo Ninja (Laser corto rápido)
  playShoot() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; // Un poco más suave que square
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12); // Cae en picada

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Sonido de Impacto a Zombie (Ruido metálico metálico corto)
  playHit() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.setValueAtTime(150, t + 0.04);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Sonido de daño al jugador (Ruido áspero)
  playHurt() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.25); // Desciende áspero

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Zombie gruñendo / escupiendo
  playZombieGrowl() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.3);

    // Añadir modulación de baja frecuencia para efecto gárgara
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    modulator.frequency.value = 35; // 35Hz gárgara
    modGain.gain.value = 25;

    modulator.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    modulator.start(t);
    osc.start(t);

    modulator.stop(t + 0.31);
    osc.stop(t + 0.31);
  }

  // Sonido de Recolectar Bellota/Moneda (Arpeggio rápido brillante)
  playCollect() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine'; // Sonido dulce cristalino
    osc.frequency.setValueAtTime(523.25, t); // C5 (Do)
    osc.frequency.setValueAtTime(659.25, t + 0.08); // E5 (Mi)
    osc.frequency.setValueAtTime(783.99, t + 0.16); // G5 (Sol)
    osc.frequency.setValueAtTime(1046.50, t + 0.24); // C6 (Do)

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.setValueAtTime(0.15, t + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Sonido al completar una Oleada (Arpeggio triunfal)
  playWaveComplete() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Acorde Do Mayor
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + index * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.21);
    });
  }

  // Sonido de Fin de Juego (Lúgubre y descendente)
  playGameOver() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.5);
    osc.frequency.linearRampToValueAtTime(30, t + 1.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.21);
  }

  // --- MÚSICA CHIPTUNE DE FONDO (BGM) ---

  startMusic() {
    this.init();
    this.resume();
    if (this.muted || this.musicPlaying || !this.ctx) return;

    this.musicPlaying = true;
    
    const stepDuration = 60 / this.tempo / 2; // Corcheas (1/8 notes)
    let nextNoteTime = this.ctx.currentTime;

    const playNextStep = () => {
      if (!this.musicPlaying || this.muted) return;

      const t = nextNoteTime;
      const step = this.currentStep;

      // 1. Play Bass Note (Canal de bajos - Onda de Pulso/Cuadrada)
      const bassIndex = Math.floor(step / 2) % this.bassline.length;
      const bassFreq = this.bassline[bassIndex];
      if (bassFreq > 0 && step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassGain.gain.setValueAtTime(0.08, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.8);

        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);

        bassOsc.start(t);
        bassOsc.stop(t + stepDuration * 1.9);
      }

      // 2. Play Melody Note (Canal de melodía - Onda cuadrada dulce)
      const melodyFreq = this.melody[step % this.melody.length];
      // Tocar en pasos alternos para dar dinamismo a la melodía
      if (melodyFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(melodyFreq, t);

        // Pequeño vibrato retro a la melodía
        const vibrato = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();
        vibrato.frequency.value = 6; // 6Hz vibrato
        vibratoGain.gain.value = 4; // Intensidad del vibrato
        vibrato.connect(vibratoGain);
        vibratoGain.connect(leadOsc.frequency);

        leadGain.gain.setValueAtTime(0.04, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 0.9);

        leadOsc.connect(leadGain);
        leadGain.connect(this.masterGain);

        vibrato.start(t);
        leadOsc.start(t);

        vibrato.stop(t + stepDuration);
        leadOsc.stop(t + stepDuration);
      }

      // Avanzar paso en la melodía
      this.currentStep = (this.currentStep + 1) % this.melody.length;
      nextNoteTime += stepDuration;

      // Programar la siguiente llamada justo antes de que termine esta
      const delay = (nextNoteTime - this.ctx.currentTime) * 1000 - 15;
      this.bgmInterval = setTimeout(playNextStep, Math.max(0, delay));
    };

    playNextStep();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const SOUND = new SoundSystem();
export default SOUND;
