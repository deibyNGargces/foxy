// ENGINES DE PROYECTILES Y HECHIZOS MÍSTICOS
import { CONFIG } from './config.js';
import { PARTICLES, Particle } from './particles.js';

export class Projectile {
  constructor(x, y, vx, vy, type = 'player', damage = 15) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // 'player', 'acid', 'rock', 'rock_debris', 'zombie_bullet', 'goblin_bomb', 'goblin_fire_debris'
    this.damage = damage;
    this.alive = true;
    this.gravity = 0;
    this.friction = 1.0;
    
    // Configurar según tipo
    if (this.type === 'player') {
      this.width = CONFIG.PROJECTILE.SIZE;
      this.height = CONFIG.PROJECTILE.SIZE;
      this.color = CONFIG.PROJECTILE.COLOR;
    } else if (this.type === 'acid') {
      this.width = CONFIG.ZOMBIES.SPITTER.SPIT_SIZE;
      this.height = CONFIG.ZOMBIES.SPITTER.SPIT_SIZE;
      this.color = '#87f542'; // Verde ácido
      this.gravity = 0.05; // Cae levemente
    } else if (this.type === 'rock') {
      this.width = 16;
      this.height = 16;
      this.color = '#7c6a58'; // Gris piedra
      this.gravity = 0.2; // Afectado fuertemente por gravedad
    } else if (this.type === 'rock_debris') {
      this.width = 6;
      this.height = 6;
      this.color = '#5c4e41';
      this.gravity = 0.25;
      this.friction = 0.98;
    } else if (this.type === 'zombie_bullet') {
      this.width = 5;
      this.height = 5;
      this.color = '#22c55e'; // Verde plasma brillante
      this.gravity = 0;
    } else if (this.type === 'goblin_bomb') {
      this.width = 12;
      this.height = 12;
      this.color = '#f97316'; // Naranja fuego
      this.gravity = 0.12; // Cae en parábola
    } else if (this.type === 'goblin_fire_debris') {
      this.width = 4;
      this.height = 4;
      this.color = '#ef4444'; // Rojo chispa
      this.gravity = 0.2;
      this.friction = 0.96;
    }
  }

  update(map) {
    // Aplicar física
    this.vy += this.gravity;
    this.vx *= this.friction;
    
    this.x += this.vx;
    this.y += this.vy;

    // Rastro de partículas dinámico
    if (this.type === 'player') {
      PARTICLES.spawnSpiritualTrail(this.x, this.y, 1);
    } else if (this.type === 'acid') {
      if (Math.random() > 0.4) {
        PARTICLES.particles.push(
          new Particle(
            this.x, this.y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, '#5cab1f', 2, 10, 0.02
          )
        );
      }
    } else if (this.type === 'zombie_bullet') {
      // Rastro de plasma verde
      if (Math.random() > 0.3) {
        PARTICLES.particles.push(
          new Particle(
            this.x, this.y, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, '#87f542', 2, 8, 0
          )
        );
      }
    } else if (this.type === 'goblin_bomb') {
      // Rastro de chispas de fuego naranja y amarillo
      if (Math.random() > 0.2) {
        const fireColor = Math.random() > 0.4 ? '#f97316' : '#eab308';
        PARTICLES.particles.push(
          new Particle(
            this.x, this.y, (Math.random() - 0.5) * 0.8, -Math.random() * 0.5, fireColor, Math.random() * 3 + 1, 15, 0.01
          )
        );
      }
    }

    // Verificar colisiones con los límites lógicos de pantalla
    const limitX = map ? map.width : CONFIG.VIEW_WIDTH;
    if (
      this.x < 0 || 
      this.x > limitX || 
      this.y < -100 || 
      this.y > CONFIG.VIEW_HEIGHT + 20
    ) {
      this.alive = false;
      return;
    }

    // Colisión con los bloques sólidos del mapa
    if (map && map.isSolidAt(this.x, this.y)) {
      this.onHitSolid();
    }
  }

  onHitSolid() {
    this.alive = false;
    
    // Efecto visual al impactar suelo/pared
    if (this.type === 'player') {
      PARTICLES.spawnShootImpact(this.x, this.y, 5);
    } else if (this.type === 'acid') {
      PARTICLES.spawnAcidSplash(this.x, this.y, 6);
    } else if (this.type === 'zombie_bullet') {
      PARTICLES.spawnAcidSplash(this.x, this.y, 4); // Chispas verdes
    } else if (this.type === 'rock') {
      PARTICLES.spawnHeavyImpact(this.x, this.y, 10);
      this.breakRock();
    } else if (this.type === 'goblin_bomb') {
      PARTICLES.spawnHeavyImpact(this.x, this.y, 12);
      this.breakGoblinBomb();
    }
  }

  breakRock() {
    // Crear 3 pedazos de roca en parábola
    this.rockDebris = [];
    const forceY = -3.0;
    const angles = [-1.5, 0, 1.5]; // Izquierda, arriba, derecha
    angles.forEach(ang => {
      const deb = new Projectile(
        this.x, 
        this.y - 4, 
        ang + (Math.random() - 0.5) * 0.5, 
        forceY - Math.random() * 1.5, 
        'rock_debris', 
        this.damage * 0.4
      );
      this.rockDebris.push(deb);
    });
  }

  breakGoblinBomb() {
    // Crear 3 chispas de fuego que rebotan
    this.rockDebris = []; // Reutilizamos rockDebris para disparar meteoros
    const forceY = -2.5;
    const angles = [-1.2, 0, 1.2];
    angles.forEach(ang => {
      const deb = new Projectile(
        this.x, 
        this.y - 4, 
        ang + (Math.random() - 0.5) * 0.4, 
        forceY - Math.random() * 1.0, 
        'goblin_fire_debris', 
        this.damage * 0.4
      );
      this.rockDebris.push(deb);
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    
    if (this.type === 'player') {
      // Disparo espiritual: orbe brillante con núcleo blanco
      const radius = this.width / 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#3ae3ffaa'; // Aura cian
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; // Centro blanco brillante
      ctx.fill();
    } 
    else if (this.type === 'acid') {
      // Gota ácida
      const radius = this.width / 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + 1, 0, Math.PI * 2);
      ctx.fillStyle = '#87f542aa'; // Aura verde
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ccff33';
      ctx.fill();
    } 
    else if (this.type === 'zombie_bullet') {
      // Plasma verde
      const radius = this.width / 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55eaa';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308'; // Centro amarillo
      ctx.fill();
    }
    else if (this.type === 'goblin_bomb') {
      // Bola de fuego de Goblin Boss
      const radius = this.width / 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ef444488'; // Aura roja
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + 1, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316'; // Fuego naranja
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308'; // Núcleo amarillo
      ctx.fill();
    }
    else if (this.type === 'rock') {
      // Roca rugosa pixel-art
      const size = this.width;
      ctx.fillRect(Math.floor(this.x - size/2), Math.floor(this.y - size/2), size, size);
      
      // Dibujar relieve interior
      ctx.fillStyle = '#5c4e41';
      ctx.fillRect(Math.floor(this.x - size/2 + 2), Math.floor(this.y - size/2 + 2), size - 4, 3);
      ctx.fillStyle = '#9c8976';
      ctx.fillRect(Math.floor(this.x - size/2 + 4), Math.floor(this.y + 2), 4, 4);
    } 
    else if (this.type === 'rock_debris' || this.type === 'goblin_fire_debris') {
      // Fragmentos pequeños de roca o fuego
      ctx.fillRect(Math.floor(this.x - this.width/2), Math.floor(this.y - this.height/2), this.width, this.height);
    }
    
    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}
