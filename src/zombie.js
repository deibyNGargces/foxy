// CLASE ENEMIGO - ZOMBIES Y JEFE GOBLIN PIXEL ART (ZOMBIE CLASS)
import { CONFIG } from './config.js';
import { PARTICLES, Particle } from './particles.js';
import { SOUND } from './sound.js';
import { Projectile } from './projectile.js';

export class Zombie {
  constructor(x, y, type = 'common', wave = 1, theme = 'forest') {
    this.x = x;
    this.y = y;
    this.type = type; // 'common', 'runner', 'spitter', 'boss', 'goblin', 'kamikaze'
    this.wave = wave;
    this.theme = theme; // 'forest', 'desert', 'city', 'farm', 'ocean', 'space', 'volcano'

    // Decidir si es un Zombie Común armado (rifle de plasma)
    this.isArmed = false;
    if (
      this.type === 'common' && 
      this.wave >= CONFIG.ZOMBIES.ARMED.PROBABILITY_START_WAVE && 
      Math.random() < CONFIG.ZOMBIES.ARMED.PROBABILITY
    ) {
      this.isArmed = true;
    }

    // Cargar especificaciones del archivo de configuración
    const spec = CONFIG.ZOMBIES[type.toUpperCase()];
    this.name = spec.NAME;
    this.speed = spec.SPEED;

    // Variación de velocidad orgánica: 40% de probabilidad de ser un "Zombie Lento" aletargado
    if (this.type === 'common') {
      if (Math.random() < 0.40) {
        this.speed = spec.SPEED * 0.55; // Súper lento (~0.44 de velocidad base), arrastra los pies
        this.name = 'Zombie Lento';
      } else {
        this.speed = spec.SPEED * (0.85 + Math.random() * 0.3); // Leve variación física natural
      }
    }

    // Escalamiento progresivo de salud y daño de acuerdo al número de oleada (wave)
    const isJefe = (type === 'goblin' || type === 'boss');
    const scaleFactor = 1 + (this.wave - 1) * (isJefe ? 0.35 : 0.20); // Jefes escalan +35% de salud por nivel! (Más Hard!)
    const damageFactor = 1 + (this.wave - 1) * (isJefe ? 0.20 : 0.12); // Jefes escalan +20% de daño por nivel! (Más Hard!)

    this.health = type === 'goblin' 
      ? Math.round((spec.BASE_HEALTH + (this.wave - 1) * spec.HEALTH_SCALE) * scaleFactor) // Escala salud Goblin Boss por ola
      : Math.round(spec.MAX_HEALTH * scaleFactor);
    
    // HABILIDAD DE ESCENARIO OCÉANO: Zombies Coralinos tienen 30% más de vida
    if (this.theme === 'ocean' && type !== 'goblin') {
      this.health = Math.round(this.health * 1.30);
    }
    
    this.maxHealth = this.health;
    
    this.damage = Math.round(spec.DAMAGE * damageFactor);
    // HABILIDADES DE ESCENARIO TÓXICO / VOLCÁNICO (Daño adicional)
    if (this.theme === 'city') {
      this.damage += 3; // +3 de veneno
    } else if (this.theme === 'volcano') {
      this.damage += 4; // +4 de quemadura
    }

    this.scoreValue = spec.SCORE;
    this.moneyValue = spec.MONEY;
    this.color = spec.COLOR;
    this.eyesColor = spec.EYES_COLOR;
    
    // HABILIDAD DE ESCENARIO DESIERTO: Zombies de Arena son 25% más veloces
    if (this.theme === 'desert') {
      this.speed *= 1.25;
    }
    
    // Si está armado, incrementar su daño y salud ligeramente
    if (this.isArmed) {
      this.health += 5; // Solo +5 HP para que sean sumamente fáciles de derrotar
      this.maxHealth = this.health;
      this.damage = CONFIG.ZOMBIES.ARMED.BULLET_DAMAGE;
      this.name = 'Zombie Soldado';
    }

    // Dimensiones
    this.width = spec.SIZE_X;
    this.height = spec.SIZE_Y;

    // Física
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.facingDir = -1; // Comienzan mirando a la izquierda normalmente

    // Combate
    this.hitFlashTimer = 0; // Brillo blanco al ser golpeado
    this.actionTimer = Math.random() * 60; // Para disparar o lanzar bombas
    this.alive = true;
    this.destroyedBlock = false; // Flag para sacudir la pantalla

    // Animación
    this.animTime = Math.random() * 100;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    
    // HABILIDAD DE ESCENARIO CAMPO DE CULTIVO: Zombies Espantapájaros esquivan daño (25% de probabilidad)
    if (this.theme === 'farm' && this.type !== 'goblin' && this.type !== 'boss' && Math.random() < 0.25) {
      // Esparcir paja dorada
      for (let i = 0; i < 6; i++) {
        PARTICLES.particles.push(
          new Particle(
            this.x, 
            this.y - this.height / 2, 
            (Math.random() - 0.5) * 2.5, 
            -Math.random() * 2.5 - 0.5, 
            '#fbbf24', 
            2.0, 
            20, 
            0.1
          )
        );
      }
      SOUND.playHit();
      return; // Cero daño!
    }

    this.health -= amount;
    this.hitFlashTimer = 6; // Flashea blanco durante 6 cuadros
    
    SOUND.playHit();
    // Spawnea sangre de zombie
    PARTICLES.spawnZombieBlood(this.x, this.y - this.height / 2, 6, -this.facingDir);
    
    if (this.health <= 0) {
      this.alive = false;
      SOUND.playZombieGrowl();
      PARTICLES.spawnZombieBlood(this.x, this.y - this.height / 2, 18, -this.facingDir); // Gran explosión
      
      // Si es Boss o Goblin, lanzar partículas pesadas y sacudir fuerte la pantalla
      if (this.type === 'boss' || this.type === 'goblin') {
        PARTICLES.spawnHeavyImpact(this.x, this.y - 10, 30);
      }
    }
  }

  update(player, map, projectiles) {
    if (!this.alive) return;

    // 1. Decrementar Timers de combate
    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    if (this.actionTimer > 0) this.actionTimer--;

    // 2. IA de Movimiento Básica
    const dx = player.x - this.x;
    this.facingDir = dx > 0 ? 1 : -1;

    let wishSpeed = this.speed;

    // Comportamientos específicos por tipo de Zombie
    if (this.isArmed) {
      // IA de Zombie Armado: Mantener distancia de disparo medio (160px a 240px)
      const absDx = Math.abs(dx);
      if (absDx < 150) {
        wishSpeed = -this.speed * 0.8; // Retroceder si Foxy se acerca
      } else if (absDx > 250) {
        wishSpeed = this.speed; // Acercarse si está lejos
      } else {
        wishSpeed = 0; // En posición, disparar
        this.vx *= 0.8;
        if (this.actionTimer <= 0) {
          this.shootRifle(projectiles);
        }
      }
    } 
    else if (this.type === 'spitter') {
      // IA del Escupidor: Mantener distancia de tiro
      const absDx = Math.abs(dx);
      if (absDx < 140) {
        wishSpeed = -this.speed * 1.2;
      } else if (absDx > 240) {
        wishSpeed = this.speed;
      } else {
        wishSpeed = 0;
        this.vx *= 0.8;
        if (this.actionTimer <= 0) {
          this.spitAcid(projectiles);
        }
      }
    } 
    else if (this.type === 'boss') {
      // IA del Boss Titán: lanza rocas cada cierto tiempo
      if (this.actionTimer <= 0 && Math.abs(dx) > 100) {
        this.throwRock(projectiles);
      }
    } 
    else if (this.type === 'goblin') {
      // IA de JEFE GOBLIN GIGANTE: camina persiguiendo al zorro y lanza bombas de fuego gigantes
      const absDx = Math.abs(dx);
      const dy = player.y - this.y;
      const absDy = Math.abs(dy);
      
      // Si el zorro está en la misma plataforma vertical y a una distancia razonable,
      // el Goblin ruge, entra en estado de FURIA/EMBESTIDA y corre mucho más rápido.
      if (absDy < 32 && absDx < 200) {
        wishSpeed = this.speed * 1.6; // Corre a un 160% de velocidad (súper veloz!)
        
        // Efecto visual: esparcir sangre y chispas oscuras al correr en furia
        if (Math.random() > 0.85) {
          PARTICLES.spawnZombieBlood(this.x, this.y - 12, 1, this.facingDir);
        }
      }
      
      if (this.actionTimer <= 0) {
        this.throwGoblinBomb(projectiles);
      }
      
      // Si está lanzando y no está en furia extrema, ralentizarse levemente
      if (this.actionTimer > CONFIG.ZOMBIES.GOBLIN.SHOOT_COOLDOWN * 0.75 && !(absDy < 32 && absDx < 200)) {
        wishSpeed = this.speed * 0.4;
      }
    }

    // Aplicar velocidad al zombi si no está parado
    if (wishSpeed !== 0) {
      this.vx = this.facingDir * wishSpeed;
    }

    // Aplicar Gravedad
    if (!this.grounded) {
      this.vy += CONFIG.GRAVITY;
    }

    // 3. Salto automático e inteligente (IA reactiva y de persecución vertical)
    const dy = player.y - this.y;
    const frontWall = map.isSolidAt(this.x + this.facingDir * (this.width / 2 + 3), this.y - 12);
    
    if (this.grounded) {
      // A. Salto para superar obstáculos del mapa
      if (frontWall) {
        if (this.type === 'runner') {
          this.vy = -5.0; // Salto rápido corredor
          this.grounded = false;
        } else if (this.type === 'common' && Math.random() > 0.4) {
          this.vy = -3.5;
          this.grounded = false;
        } else if (this.type === 'goblin' || this.type === 'boss') {
          this.vy = -5.5; // Salto alto para jefes colosales ante muros obstáculo
          this.grounded = false;
        }
      } 
      // B. Persecución vertical: Si Foxy está en una plataforma más elevada,
      // los enemigos más veloces e inteligentes (Jefes, Corredores) saltan activamente para escalarla
      else if (dy < -40 && Math.abs(dx) < 140 && Math.random() < 0.035) {
        // ÚNICAMENTE los Jefes colosales (Goblin y Titán) y el Zombie Kamikaze tienen el poder de trepar verticalmente a las bardas
        if (this.type === 'goblin' || this.type === 'boss' || this.type === 'kamikaze') {
          this.vy = -6.0; // Gran salto místico vertical para trepar a las bardas
          this.grounded = false;
          SOUND.playZombieGrowl(); // Rugido de furia al saltar hacia ti
        }
      }
    }

    // Destrucción destructiva del escenario al paso del Jefe Goblin / Titán (WOW destructible blocks!)
    if (this.type === 'boss' || this.type === 'goblin') {
      let destroyedAny = false;
      const scanOffsetsX = [2, 8, 16, 24]; // Escaneo horizontal profundo (1.5 bloques de profundidad)
      
      // Escaneo vertical dinámico cubriendo toda la altura del jefe
      const heights = [];
      for (let h = 6; h < this.height - 4; h += 12) {
        heights.push(h);
      }
      heights.push(this.height - 6); // Asegurar el borde de la cabeza

      for (let dxOff of scanOffsetsX) {
        const testX = this.x + this.facingDir * (this.width / 2 + dxOff);
        for (let offset of heights) {
          const testY = this.y - offset;
          // Solo romper si el bloque es sólido o semi-sólido
          if (map.isSolidAt(testX, testY) || map.isSemiSolidAt(testX, testY)) {
            const success = map.destroyTileAt(testX, testY);
            if (success) {
              destroyedAny = true;
            }
          }
        }
      }
      
      if (destroyedAny) {
        // Ralentizarse al 50% por el impacto pero continuar avanzando de forma imparable
        this.vx = this.facingDir * (this.speed * 0.5);
        this.destroyedBlock = true; // Activa el screen shake en game.js
      }
    }

    // 4. Resolver colisiones
    this.resolveCollisions(map);

    // ================= EFECTOS DE HABILIDADES/PARTÍCULAS POR ESCENARIO =================
    if (this.alive && Math.random() < 0.08) {
      if (this.theme === 'city') {
        // Estela de gas tóxico verde
        PARTICLES.particles.push(
          new Particle(this.x + (Math.random() - 0.5) * 6, this.y - 12, (Math.random() - 0.5) * 0.4, -Math.random() * 0.4, '#22c55e', 3.0, 24, 0.0)
        );
      } else if (this.theme === 'ocean') {
        // Burbujas subiendo flotando
        PARTICLES.particles.push(
          new Particle(this.x + (Math.random() - 0.5) * 8, this.y - 10, 0, -0.7, '#3ae3ff', 1.5, 30, -0.01)
        );
      } else if (this.theme === 'volcano') {
        // Chispas/Cenizas de magma cayendo/flotando
        PARTICLES.particles.push(
          new Particle(this.x + (Math.random() - 0.5) * 8, this.y - 10, (Math.random() - 0.5) * 0.4, -0.5, '#ea580c', 2.0, 24, 0.02)
        );
      } else if (this.theme === 'space') {
        // Polvo estelar cósmico titilante
        PARTICLES.particles.push(
          new Particle(this.x + (Math.random() - 0.5) * 8, this.y - 12, (Math.random() - 0.5) * 0.5, -0.1, '#c084fc', 2.0, 16, 0.0)
        );
      } else if (this.theme === 'desert') {
        // Partículas de polvo de arena
        PARTICLES.particles.push(
          new Particle(this.x + (Math.random() - 0.5) * 6, this.y - 4, -this.facingDir * 0.5, -Math.random() * 0.5, '#fbbf24', 1.8, 15, 0.05)
        );
      }
    }

    // Animación
    this.animTime += Math.abs(this.vx) * 0.1 + 0.05;
  }

  shootRifle(projectiles) {
    this.actionTimer = CONFIG.ZOMBIES.ARMED.SHOOT_COOLDOWN + Math.random() * 40;
    SOUND.playShoot(); // Sonido laser/tiro chiptune

    const spawnX = this.x + this.facingDir * 14;
    const spawnY = this.y - 18; // Nivel del arma del pecho
    const vx = this.facingDir * CONFIG.ZOMBIES.ARMED.BULLET_SPEED;
    
    // Muzzle flash verde
    PARTICLES.spawnSpiritualTrail(spawnX, spawnY, 2);
    
    projectiles.push(
      new Projectile(spawnX, spawnY, vx, 0, 'zombie_bullet', this.damage)
    );
  }

  spitAcid(projectiles) {
    this.actionTimer = CONFIG.ZOMBIES.SPITTER.SHOOT_COOLDOWN + Math.random() * 60;
    SOUND.playZombieGrowl();
    
    const spawnX = this.x + this.facingDir * 10;
    const spawnY = this.y - 25;
    const speed = CONFIG.ZOMBIES.SPITTER.SPIT_SPEED;
    const vx = this.facingDir * speed;
    const vy = -1.5;
    
    projectiles.push(
      new Projectile(spawnX, spawnY, vx, vy, 'acid', this.damage)
    );
  }

  throwRock(projectiles) {
    this.actionTimer = CONFIG.ZOMBIES.BOSS.THROW_COOLDOWN + Math.random() * 60;
    SOUND.playZombieGrowl();

    const spawnX = this.x + this.facingDir * 20;
    const spawnY = this.y - 50;
    const vx = this.facingDir * 2.8;
    const vy = -4.5;

    projectiles.push(
      new Projectile(spawnX, spawnY, vx, vy, 'rock', this.damage)
    );
  }

  throwGoblinBomb(projectiles) {
    this.actionTimer = CONFIG.ZOMBIES.GOBLIN.SHOOT_COOLDOWN + Math.random() * 40;
    SOUND.playZombieGrowl();
    
    // Efecto visual: sacudir la pantalla al lanzar la gran bomba
    PARTICLES.spawnHeavyImpact(this.x + this.facingDir * 20, this.y - 30, 8);

    const spawnX = this.x + this.facingDir * 18;
    const spawnY = this.y - 40;
    const vx = this.facingDir * CONFIG.ZOMBIES.GOBLIN.BOMB_SPEED_X;
    const vy = CONFIG.ZOMBIES.GOBLIN.BOMB_SPEED_Y;

    projectiles.push(
      new Projectile(spawnX, spawnY, vx, vy, 'goblin_bomb', this.damage)
    );
  }

  detonate(projectiles) {
    if (!this.alive) return;
    this.alive = false;
    
    SOUND.playGameOver(); // Sonido explosivo místico chiptune
    PARTICLES.spawnHeavyImpact(this.x, this.y - 12, 18);
    
    // Esparcir 6 fragmentos de magma ardientes en abanico que dañan a Foxy
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const vx = Math.cos(ang) * 3.5;
      const vy = Math.sin(ang) * 3.5;
      projectiles.push(
        new Projectile(this.x, this.y - 12, vx, vy, 'rock', Math.round(this.damage * 0.6)) // Fragmentos de roca caliente
      );
    }
  }

  resolveCollisions(map) {
    // Colisión Eje X
    this.x += this.vx;
    let hitbox = this.getHitbox();

    const checkXCollision = () => {
      const steps = [4, 14, 28];
      if (this.type === 'boss' || this.type === 'goblin') steps.push(38, 50);

      for (let offset of steps) {
        const testY = this.y - offset;
        const sideX = this.vx > 0 ? hitbox.x + hitbox.width : hitbox.x;

        if (map.isSolidAt(sideX, testY)) {
          if (this.vx > 0) {
            this.x = Math.floor(sideX / map.tileSize) * map.tileSize - this.width / 2;
          } else {
            this.x = Math.floor(sideX / map.tileSize) * map.tileSize + map.tileSize + this.width / 2;
          }
          this.vx = 0;
          break;
        }
      }
    };
    checkXCollision();

    // Colisión Eje Y
    this.y += this.vy;
    hitbox = this.getHitbox();
    let newGrounded = false;
    
    const testPointsX = [hitbox.x + 2, hitbox.x + hitbox.width / 2, hitbox.x + hitbox.width - 2];
    const testY = this.y;

    if (this.vy >= 0) {
      for (let testX of testPointsX) {
        if (map.isSolidAt(testX, testY) || map.isSemiSolidAt(testX, testY)) {
          this.y = Math.floor(testY / map.tileSize) * map.tileSize;
          this.vy = 0;
          newGrounded = true;
          break;
        }
      }
    }

    this.grounded = newGrounded;
  }

  draw(ctx) {
    ctx.save();

    const isFlashing = this.hitFlashTimer > 0;
    
    ctx.translate(Math.floor(this.x), Math.floor(this.y));
    ctx.scale(this.facingDir, 1);

    // Animación de Squash & Stretch en marcha zombie
    let scaleX = 1.0;
    let scaleY = 1.0;
    if (this.type !== 'boss' && this.type !== 'goblin') {
      scaleY = 1.0 + Math.sin(this.animTime * 1.5) * 0.03;
      scaleX = 1.0 - Math.sin(this.animTime * 1.5) * 0.03;
    } else {
      // Temblores del jefe al caminar
      const speed = Math.abs(this.vx);
      if (speed > 0.1) {
        scaleY = 1.0 + Math.sin(this.animTime * 1.2) * 0.02;
        scaleX = 1.0 - Math.sin(this.animTime * 1.2) * 0.02;
      }
    }
    ctx.scale(scaleX, scaleY);

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    // COLORES DE DIBUJO
    const skinColor = this.color;
    const darkSkin = '#1e3d21';
    let clothColor = this.type === 'runner' ? '#69306d' : (this.type === 'spitter' ? '#4f5d75' : '#725e54');
    const boneWhite = '#e8ebf0';
    const redGlow = this.eyesColor;
    
    // --- 1. ZOMBIES TAMAÑO NORMAL (COMMON, RUNNER, SPITTER, ARMED, KAMIKAZE) ---
    if (this.type !== 'boss' && this.type !== 'goblin') {
      // Dibujar paquete de dinamitas amarrado a la espalda si es Kamikaze
      if (this.type === 'kamikaze') {
        ctx.fillStyle = '#ef4444'; // Dinamitas rojas
        ctx.fillRect(-11, -20, 4, 10);
        ctx.fillStyle = '#111827'; // Cuerda negra amarrada
        ctx.fillRect(-12, -15, 6, 2);
        
        // Mecha chispeante
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-9, -23, 1, 3);
        if (Math.random() > 0.45) {
          ctx.fillStyle = '#facc15'; // Chispa
          ctx.fillRect(-10 + Math.random() * 3, -25, 2, 2);
        }
      }

      // Piernas
      ctx.fillStyle = darkSkin;
      ctx.fillRect(-6, -6, 3, 6);
      ctx.fillRect(2, -6, 3, 6);
      ctx.fillStyle = clothColor;
      ctx.fillRect(-6, -8, 3, 3);
      ctx.fillRect(2, -8, 3, 3);

      // Cuerpo
      ctx.fillStyle = clothColor;
      ctx.fillRect(-8, -22, 14, 14);
      
      // Detalles de ropa
      ctx.fillStyle = boneWhite;
      ctx.fillRect(-3, -15, 2, 2);

      // HABILIDADES COSMÉTICAS DEL ESCENARIO EN EL TORSO
      if (this.theme === 'ocean') {
        ctx.fillStyle = '#06b6d4'; // Incrustaciones de coral cian
        ctx.fillRect(-7, -20, 2, 3);
        ctx.fillRect(4, -15, 2, 2);
      } else if (this.theme === 'volcano') {
        ctx.fillStyle = '#ea580c'; // Grietas incandescentes
        ctx.fillRect(-3, -16, 5, 2);
        ctx.fillRect(1, -12, 3, 1.5);
      }

      // Brazos estirados al frente
      let armAngle = 0.2;
      if (this.type === 'runner' || this.type === 'kamikaze') {
        armAngle = Math.sin(this.animTime * 2.0) * 0.4;
      }
      ctx.save();
      ctx.translate(4, -18);
      ctx.rotate(armAngle);
      
      if (this.isArmed) {
        // ZOMBIE ARMADO: Sostiene un fusil de plasma futurista verde neón
        ctx.fillStyle = '#1e293b'; // Cuerpo del rifle gris oscuro
        ctx.fillRect(-2, -3, 12, 4);
        ctx.fillStyle = '#22c55e'; // Cañón verde glowing
        ctx.fillRect(8, -2, 6, 2);
        // Culata
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-4, -1, 3, 4);
        // Mano sosteniendo
        ctx.fillStyle = skinColor;
        ctx.fillRect(2, -1, 3, 3);
      } else {
        // Zombie normal con mano estirada
        ctx.fillStyle = skinColor;
        ctx.fillRect(0, -2, 10, 4);
        ctx.fillStyle = darkSkin;
        ctx.fillRect(9, -2, 2, 4);
      }
      ctx.restore();

      // Cabeza
      ctx.fillStyle = skinColor;
      ctx.fillRect(-4, -28, 9, 7);

      // HABILIDADES COSMÉTICAS DEL ESCENARIO EN LA CABEZA
      if (this.theme === 'city') {
        ctx.fillStyle = '#22c55e'; // Venas tóxicas verdes
        ctx.fillRect(-2, -26, 2, 1);
        ctx.fillRect(2, -25, 2, 1);
      } else if (this.theme === 'farm') {
        ctx.fillStyle = '#fbbf24'; // Paja saliendo
        ctx.fillRect(-3, -30, 1.5, 3);
        ctx.fillRect(2, -31, 1.5, 4);
      }
      
      // Ojos
      ctx.fillStyle = redGlow;
      ctx.fillRect(2.5, -25, 2, 2);

      // Pelo
      ctx.fillStyle = '#3c3d42';
      ctx.fillRect(-4, -29, 6, 2);
    } 
    // --- 2. JEFE GOBLIN COLOSAL (32x48) - GRAN DUENDE ---
    else if (this.type === 'goblin') {
      const legSwing = Math.sin(this.animTime * 1.0) * 5;
      
      // AURA DE SOMBRAS OSCURAS Y MAGIA MÍSTICA (Efecto WOW Aterrador)
      const auraTime = Date.now() * 0.0035;
      ctx.fillStyle = 'rgba(88, 28, 135, 0.28)'; // Púrpura translúcido mágico
      for (let i = 0; i < 5; i++) {
        const ox = Math.sin(auraTime + i * 1.5) * 8 - 4;
        const oy = -24 - i * 8 + Math.cos(auraTime * 0.8 + i) * 6;
        const size = 10 + Math.sin(auraTime * 0.4 + i) * 5;
        ctx.fillRect(ox - size/2, oy - size/2, size, size);
      }
      // Detalle de chispas rojas flotando del aura
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fillRect(Math.sin(auraTime) * 12 - 5, -35 + Math.cos(auraTime) * 10, 3, 3);
      ctx.fillRect(Math.cos(auraTime * 1.2) * 10 - 2, -15 + Math.sin(auraTime * 0.9) * 8, 2, 2);

      // Piernas robustas verde oscuro goblin
      ctx.fillStyle = '#1b4d3e'; // Verde bosque oscuro
      ctx.fillRect(-10 + legSwing/2, -10, 5, 10);
      ctx.fillRect(3 - legSwing/2, -10, 5, 10);

      // Ropa rústica de cuero / taparrabos
      ctx.fillStyle = '#7c2d12'; // Marrón óxido
      ctx.fillRect(-12, -22, 22, 12);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-10, -26, 18, 4);

      // Torso musculoso de goblin verde brillante
      ctx.fillStyle = skinColor;
      ctx.fillRect(-14, -40, 26, 14);
      
      // HOMBRERAS CON PINCHOS DE HUESO (Para verse más intimidante y aterrador)
      ctx.fillStyle = '#e2e8f0'; // Hueso
      ctx.fillRect(-16, -38, 3, 5); // Pinchos hombro trasero
      ctx.fillRect(-18, -36, 3, 2);
      ctx.fillRect(13, -38, 3, 5);  // Pinchos hombro delantero
      ctx.fillRect(15, -36, 3, 2);

      // Collares de calaveras místicas
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(-8, -37, 2, 2);
      ctx.fillRect(4, -37, 2, 2);
      ctx.fillRect(-2, -35, 3, 3);

      // Brazos alzando un garrote colosal con espinas ensangrentadas
      const isAttacking = this.actionTimer > CONFIG.ZOMBIES.GOBLIN.SHOOT_COOLDOWN * 0.7;
      ctx.save();
      
      if (isAttacking) {
        // Alzando el garrote sobre la cabeza para lanzar
        ctx.translate(6, -34);
        ctx.rotate(-0.8);
        ctx.fillStyle = skinColor;
        ctx.fillRect(0, -6, 14, 6); // Brazo arriba
        
        // Garrote de madera gigantesco con pinchos
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(10, -18, 8, 24); // Mango
        ctx.fillStyle = '#451a03'; // Maza spiked
        ctx.fillRect(7, -30, 14, 14);
        // Pinchos grises
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(13, -33, 2, 3);
        ctx.fillRect(4, -24, 3, 2);
        ctx.fillRect(21, -24, 3, 2);
        // Puntas de pinchos ensangrentadas neón
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(13, -34, 2, 1);
        ctx.fillRect(3, -24, 1, 2);
        ctx.fillRect(24, -24, 1, 2);
      } else {
        // Brazo extendido en pose desafiante
        ctx.translate(10, -32);
        ctx.fillStyle = skinColor;
        ctx.fillRect(0, -4, 14, 7);
        // Garrote apoyado en hombro
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(8, -16, 4, 18);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(5, -28, 10, 12);
        // Sangre en los pinchos de la maza
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(4, -22, 2, 2);
        ctx.fillRect(14, -26, 2, 2);
      }
      ctx.restore();

      // Cabeza duende
      ctx.fillStyle = skinColor;
      ctx.fillRect(-7, -49, 13, 9);

      // OREJAS DE DUENDE/GOBLIN INCONFUNDIBLES (Gran detalle visual)
      ctx.fillStyle = '#1e3f20'; // Verde oscuro interior
      ctx.beginPath();
      // Oreja trasera (izquierda mirando)
      ctx.moveTo(-7, -46);
      ctx.lineTo(-17, -49);
      ctx.lineTo(-7, -41);
      ctx.fill();
      
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      // Oreja delantera (derecha)
      ctx.moveTo(6, -46);
      ctx.lineTo(16, -49);
      ctx.lineTo(6, -41);
      ctx.fill();

      // Hocico puntiagudo de Goblin
      ctx.fillStyle = skinColor;
      ctx.fillRect(5, -45, 4, 4);

      // Ojos malvados fucsia brillante glowing con pupila demoníaca y brillo
      ctx.fillStyle = '#ff003c'; // Fucsia/Rojo sangriento neón
      ctx.fillRect(3, -48, 4, 4);
      ctx.fillStyle = '#ffffff'; // Pupila blanca brillante y maligna
      ctx.fillRect(4.5, -47, 1.5, 1.5);

      // Boca malévola con sonrisa sádica y colmillos gigantes afilados
      ctx.fillStyle = '#111827'; // Boca abierta negra
      ctx.fillRect(1, -43, 7, 3);
      ctx.fillStyle = '#ffffff'; // Colmillos puntiagudos
      ctx.fillRect(1, -43, 1, 2); // Colmillo superior izquierdo
      ctx.fillRect(6, -43, 1, 2); // Colmillo superior derecho
      ctx.fillRect(3, -41, 1, 1);
      ctx.fillRect(5, -41, 1, 1);
    }
    // --- 3. ZOMBIE BOSS TITÁN COLOSAL (40x64) ---
    else if (this.type === 'boss') {
      // Piernas
      ctx.fillStyle = '#1c241e';
      ctx.fillRect(-12, -14, 7, 14);
      ctx.fillRect(3, -14, 7, 14);

      // Torso colosal
      ctx.fillStyle = skinColor;
      ctx.fillRect(-16, -46, 32, 32);
      
      // Chaleco
      ctx.fillStyle = '#222';
      ctx.fillRect(-17, -46, 7, 32);
      ctx.fillRect(10, -46, 7, 32);
      ctx.fillRect(-17, -46, 34, 8);

      // Brazos
      const isThrowing = this.actionTimer > CONFIG.ZOMBIES.BOSS.THROW_COOLDOWN * 0.75;
      if (isThrowing) {
        ctx.fillStyle = skinColor;
        ctx.fillRect(6, -60, 8, 20);
        ctx.fillRect(-14, -60, 8, 20);

        ctx.fillStyle = '#7c6a58';
        ctx.fillRect(-12, -74, 24, 18);
        ctx.fillStyle = '#5c4e41';
        ctx.fillRect(-8, -72, 18, 5);
      } else {
        const armSwing = Math.sin(this.animTime * 0.5) * 0.2;
        ctx.save();
        ctx.translate(10, -38);
        ctx.rotate(armSwing);
        ctx.fillStyle = skinColor;
        ctx.fillRect(0, -4, 18, 9);
        ctx.fillStyle = '#ff33ff';
        ctx.fillRect(16, -4, 4, 9);
        ctx.restore();
      }

      // Cabeza
      ctx.fillStyle = skinColor;
      ctx.fillRect(-8, -58, 16, 13);
      ctx.fillStyle = '#1e241f';
      ctx.fillRect(-6, -49, 12, 4);

      // Ojo
      ctx.fillStyle = redGlow;
      ctx.fillRect(3, -54, 4, 4);
      
      // Cicatrices
      ctx.fillStyle = '#87f542';
      ctx.fillRect(-10, -32, 2, 8);
      ctx.fillRect(4, -22, 6, 2);
    }

    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }
}
