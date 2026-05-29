// SISTEMA DE PARTICULAS JUGOSO PARA EFECTOS VISUALES

export class Particle {
  constructor(x, y, vx, vy, color, size, maxLife, gravity = 0, friction = 0.95, shape = 'square') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = maxLife;
    this.maxLife = maxLife;
    this.gravity = gravity;
    this.friction = friction;
    this.shape = shape; // 'square' para pixel art
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    
    this.x += this.vx;
    this.y += this.vy;
    
    this.life--;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    
    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dibujar como píxel cuadrado para look retro
      ctx.fillRect(
        Math.floor(this.x - this.size / 2), 
        Math.floor(this.y - this.size / 2), 
        Math.floor(this.size), 
        Math.floor(this.size)
      );
    }
    
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }

  clear() {
    this.particles = [];
  }

  // --- EFECTOS PREESTABLECIDOS ---

  // Polvo al correr/saltar (Grisáceo/Tierra, se eleva ligeramente)
  spawnDust(x, y, count = 4, dirX = 0) {
    for (let i = 0; i < count; i++) {
      const vx = -dirX * (Math.random() * 1.0 + 0.2) + (Math.random() - 0.5) * 0.5;
      const vy = -Math.random() * 0.8 - 0.2;
      const color = Math.random() > 0.5 ? '#dedede' : '#b0b0b0';
      const size = Math.random() * 3 + 2;
      const maxLife = Math.random() * 20 + 15;
      
      this.particles.push(
        new Particle(x, y, vx, vy, color, size, maxLife, -0.02, 0.96)
      );
    }
  }

  // Destello/Rastro de energía espiritual azul (Fuego de zorro)
  spawnSpiritualTrail(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 0.8;
      const vy = -Math.random() * 0.5 - 0.2;
      // Gama de azules espirituales neón
      const colors = ['#3ae3ff', '#3a83ff', '#aef7ff'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 4 + 2;
      const maxLife = Math.random() * 15 + 10;

      this.particles.push(
        new Particle(x, y, vx, vy, color, size, maxLife, -0.05, 0.94)
      );
    }
  }

  // Impacto de bala azul (Explosión brillante en cruz/círculo)
  spawnShootImpact(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const force = Math.random() * 2.0 + 1.5;
      const vx = Math.cos(angle) * force;
      const vy = Math.sin(angle) * force;
      const color = Math.random() > 0.3 ? '#3ae3ff' : '#ffffff';
      const size = Math.random() * 3 + 2;
      const maxLife = Math.random() * 18 + 12;

      this.particles.push(
        new Particle(x, y, vx, vy, color, size, maxLife, 0.05, 0.92)
      );
    }
  }

  // Sangre Zombie (Píxeles verdes y algunos rojos oscuros infectados)
  spawnZombieBlood(x, y, count = 12, forceDirX = 0) {
    for (let i = 0; i < count; i++) {
      const vx = forceDirX * (Math.random() * 2.0 + 1.0) + (Math.random() - 0.5) * 2.5;
      const vy = -Math.random() * 3.0 - 1.0;
      // Colores zombies: verdes pálidos, verdes oscuros, rojo infectado
      const colors = ['#4e8752', '#326035', '#782323', '#274729'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 3.5 + 1.5;
      const maxLife = Math.random() * 30 + 20;

      this.particles.push(
        new Particle(x, y, vx, vy, color, size, maxLife, 0.25, 0.97) // Afectado por gravedad fuerte
      );
    }
  }

  // Explosión de Ácido de escupidor
  spawnAcidSplash(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 3.0;
      const vy = -Math.random() * 2.0 - 0.5;
      const color = Math.random() > 0.4 ? '#87f542' : '#5cab1f'; // Verde ácido brillante
      const size = Math.random() * 3 + 1.5;
      const maxLife = Math.random() * 25 + 15;

      this.particles.push(
        new Particle(x, y, vx, vy, color, size, maxLife, 0.18, 0.95)
      );
    }
  }

  // Sparkles de oro al recolectar bellotas
  spawnGoldSparkle(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 1.2;
      const vy = -Math.random() * 1.5 - 0.5;
      const color = Math.random() > 0.3 ? '#ffd700' : '#fffbc7'; // Dorado / Blanco brillante
      const size = Math.random() * 3.5 + 2;
      const maxLife = Math.random() * 25 + 15;

      this.particles.push(
        new Particle(x, y, vx, vy, color, size, maxLife, -0.03, 0.94) // Flotan hacia arriba lentamente
      );
    }
  }

  // Polvo de impacto pesado de Boss (Roca golpeando suelo)
  spawnHeavyImpact(x, y, count = 15) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 4.0;
      const vy = -Math.random() * 3.0 - 0.5;
      const color = Math.random() > 0.4 ? '#7c6a58' : '#5c4e41'; // Gris tierra
      const size = Math.random() * 5 + 3;
      const maxLife = Math.random() * 35 + 25;

      this.particles.push(
        new Particle(x, y, vx, vy, color, size, maxLife, 0.15, 0.93)
      );
    }
  }

  // Salto en la pared (Wall Slide dust)
  spawnWallDust(x, y, count = 1, wallDirX = 1) {
    for (let i = 0; i < count; i++) {
      const vx = wallDirX * (Math.random() * 0.8 + 0.1);
      const vy = (Math.random() - 0.5) * 0.4 - 0.2;
      const color = '#dedede';
      const size = Math.random() * 2.5 + 1.5;
      const maxLife = Math.random() * 15 + 10;

      this.particles.push(
        new Particle(x, y, vx, vy, color, size, maxLife, -0.01, 0.95)
      );
    }
  }

  // Partículas ambientales continuas según el mundo actual (WOW Atmospheric FX)
  spawnAmbientParticles(theme, cameraX, viewWidth = 640, viewHeight = 360) {
    const t = Date.now();
    
    if (theme === 'desert' && Math.random() > 0.6) {
      // Arena soplando en tormenta desde la derecha hacia la izquierda
      const x = cameraX + viewWidth + 10;
      const y = Math.random() * viewHeight;
      const vx = -2.5 - Math.random() * 2.0;
      const vy = 0.2 + (Math.random() - 0.5) * 0.5;
      this.particles.push(
        new Particle(x, y, vx, vy, '#d97706', Math.random() * 2 + 1, 120, 0, 0.99)
      );
    } 
    else if (theme === 'ocean' && Math.random() > 0.5) {
      // Burbujas subiendo
      const x = cameraX + Math.random() * viewWidth;
      const y = viewHeight + 10;
      const vx = (Math.random() - 0.5) * 0.4;
      const vy = -0.8 - Math.random() * 0.8;
      this.particles.push(
        new Particle(x, y, vx, vy, '#aef7ffbb', Math.random() * 3 + 1.5, 180, -0.01, 0.98, 'circle')
      );
    } 
    else if (theme === 'volcano' && Math.random() > 0.4) {
      // Cenizas incandescentes flotantes
      const x = cameraX + Math.random() * viewWidth;
      const y = viewHeight + 10;
      const vx = Math.sin(t * 0.005 + x) * 0.3;
      const vy = -0.5 - Math.random() * 0.8;
      const color = Math.random() > 0.4 ? '#ea580c' : '#f97316'; // Lava
      this.particles.push(
        new Particle(x, y, vx, vy, color, Math.random() * 3.5 + 1.5, 140, -0.005, 0.98)
      );
    } 
    else if (theme === 'space' && Math.random() > 0.7) {
      // Polvo estelar cósmico cayendo
      const x = cameraX + Math.random() * viewWidth;
      const y = -10;
      const vx = (Math.random() - 0.5) * 0.2;
      const vy = 0.4 + Math.random() * 0.6;
      const colors = ['#3ae3ff', '#aef7ff', '#ffffff'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(
        new Particle(x, y, vx, vy, color, Math.random() * 2 + 1, 200, 0, 1.0)
      );
    }
    else if (theme === 'city' && Math.random() > 0.75) {
      // Humo e smog
      const x = cameraX - 10;
      const y = Math.random() * (viewHeight - 60);
      const vx = 0.8 + Math.random() * 1.0;
      const vy = (Math.random() - 0.5) * 0.2;
      this.particles.push(
        new Particle(x, y, vx, vy, '#64748b33', Math.random() * 8 + 4, 180, -0.002, 0.98)
      );
    }
    else if (theme === 'farm' && Math.random() > 0.7) {
      // Espigas de trigo doradas flotando
      const x = cameraX + Math.random() * viewWidth;
      const y = viewHeight - 32 - Math.random() * 120;
      const vx = 0.3 + Math.random() * 0.5;
      const vy = Math.sin(t * 0.003) * 0.1 - 0.1;
      this.particles.push(
        new Particle(x, y, vx, vy, '#fbbf24', Math.random() * 3 + 1, 150, 0, 0.97)
      );
    }
  }
}

export const PARTICLES = new ParticleSystem();
export default PARTICLES;
