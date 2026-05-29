// JUGADOR - EL ZORRO NINJA MÍSTICO (PLAYER CLASS)
import { CONFIG } from './config.js';
import { PARTICLES, Particle } from './particles.js';
import { SOUND } from './sound.js';
import { Projectile } from './projectile.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    
    // Dimensiones dinámicas (cambian al agacharse)
    this.width = CONFIG.PLAYER.WIDTH;
    this.height = CONFIG.PLAYER.HEIGHT;
    this.normalHeight = CONFIG.PLAYER.HEIGHT;
    this.crouchHeight = CONFIG.PLAYER.CROUCH_HEIGHT;

    // Estados físicos
    this.grounded = false;
    this.doubleJumpAvailable = true;
    this.isCrouching = false;
    this.isSliding = false;
    this.slideTimer = 0;
    
    // Deslizamiento en pared (Wall Slide / Wall Jump)
    this.onWallLeft = false;
    this.onWallRight = false;
    this.isWallSliding = false;

    // Estadísticas y combate
    this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
    this.health = this.maxHealth;
    this.iframeTimer = 0;
    this.shootCooldownTimer = 0;
    
    // Dirección: 1 = Derecha, -1 = Izquierda
    this.facingDir = 1;

    // Animación y cola
    this.animTime = 0;
    this.state = 'idle'; // 'idle', 'run', 'jump', 'crouch', 'slide', 'wall-slide', 'hurt'
    
    // Historial de la bufanda (para simulación de física de tela por cuerda)
    this.scarfSegments = [];
    const numSegments = 7;
    for (let i = 0; i < numSegments; i++) {
      this.scarfSegments.push({ x: this.x, y: this.y });
    }

    // Mejoras de Tienda (Nivel actual)
    this.upgrades = {
      healthLevel: 0,
      damageLevel: 0,
      speedLevel: 0,
      fireRateLevel: 0,
      tripleShot: 0
    };
  }

  // Obtener estadísticas dinámicas según nivel de mejoras
  getMaxHealth() {
    return CONFIG.PLAYER.MAX_HEALTH + this.upgrades.healthLevel * 25;
  }

  getDamage() {
    return CONFIG.PLAYER.BASE_DAMAGE + this.upgrades.damageLevel * 5;
  }

  getSpeedMultiplier() {
    return 1.0 + this.upgrades.speedLevel * 0.15;
  }

  getShootCooldown() {
    // Reduce cooldown un 20% por nivel
    const reduction = this.upgrades.fireRateLevel * 0.20;
    return Math.max(5, Math.round(CONFIG.PLAYER.SHOOT_COOLDOWN * (1 - reduction)));
  }

  heal(amount) {
    this.health = Math.min(this.getMaxHealth(), this.health + amount);
  }

  takeDamage(amount) {
    if (this.iframeTimer > 0) return false;
    
    this.health -= amount;
    this.iframeTimer = CONFIG.PLAYER.IFRAMES;
    this.vy = -3.0; // Pequeño empujón arriba
    this.vx = -this.facingDir * 3.0; // Empujón hacia atrás
    
    SOUND.playHurt();
    PARTICLES.spawnZombieBlood(this.x, this.y - 10, 8, -this.facingDir); // Partículas de daño
    
    if (this.health <= 0) {
      this.health = 0;
    }
    return true;
  }

  update(keys, map, projectiles) {
    // 1. Decrementar Timers
    if (this.iframeTimer > 0) this.iframeTimer--;
    if (this.shootCooldownTimer > 0) this.shootCooldownTimer--;

    // 2. Leer Controles WASD / Shift
    const keyLeft = keys['KeyA'] || keys['ArrowLeft'];
    const keyRight = keys['KeyD'] || keys['ArrowRight'];
    const keyJump = keys['KeyW'] || keys['Space'] || keys['ArrowUp'];
    const keyCrouch = keys['KeyS'] || keys['ArrowDown'];
    const keyRun = keys['ShiftLeft'] || keys['ShiftRight'];

    // 3. Modificaciones de Tamaño (Crouch)
    if (keyCrouch && this.grounded) {
      if (!this.isCrouching) {
        this.isCrouching = true;
        this.height = this.crouchHeight;
        this.y += (this.normalHeight - this.crouchHeight); // Ajustar posición vertical

        // Si corría a velocidad alta, iniciar un deslizamiento (slide)
        const speed = Math.abs(this.vx);
        if (speed > CONFIG.PLAYER.WALK_SPEED + 0.5) {
          this.isSliding = true;
          this.vx = this.facingDir * CONFIG.PLAYER.SLIDE_SPEED;
          this.slideTimer = 25; // Duración en cuadros del slide
          SOUND.playJump(); // Sonido slide
        }
      }
    } else if (!keyCrouch && this.isCrouching) {
      // Verificar si cabe al levantarse (no hay bloque sólido encima)
      if (!map.isSolidAt(this.x, this.y - (this.normalHeight - this.crouchHeight))) {
        this.isCrouching = false;
        this.isSliding = false;
        this.y -= (this.normalHeight - this.crouchHeight);
        this.height = this.normalHeight;
      }
    }

    // 4. Gestión del Slide deslizante
    if (this.isSliding) {
      this.slideTimer--;
      this.vx *= CONFIG.PLAYER.SLIDE_DECAY;
      PARTICLES.spawnDust(this.x - this.facingDir * 10, this.y, 1, this.facingDir);
      
      if (this.slideTimer <= 0 || Math.abs(this.vx) < 1.0) {
        this.isSliding = false;
        if (!keyCrouch) {
          this.isCrouching = false;
          this.height = this.normalHeight;
        }
      }
    }

    // 5. Movimiento Horizontal (No aplicable si está en slide rígido)
    if (!this.isSliding) {
      const maxSpeed = (keyRun ? CONFIG.PLAYER.RUN_SPEED : CONFIG.PLAYER.WALK_SPEED) * this.getSpeedMultiplier();
      
      if (keyLeft) {
        this.vx -= CONFIG.PLAYER.ACCEL;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;
        this.facingDir = -1;
        if (this.grounded) {
          this.state = 'run';
          if (Math.random() > 0.6) PARTICLES.spawnDust(this.x, this.y, 1, -1);
        }
      } else if (keyRight) {
        this.vx += CONFIG.PLAYER.ACCEL;
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        this.facingDir = 1;
        if (this.grounded) {
          this.state = 'run';
          if (Math.random() > 0.6) PARTICLES.spawnDust(this.x, this.y, 1, 1);
        }
      } else {
        // Frenado/Fricción en suelo
        if (this.grounded) {
          this.vx *= CONFIG.FRICTION;
          this.state = 'idle';
        } else {
          this.vx *= CONFIG.AIR_RESISTANCE; // Menos fricción en aire
        }
      }
    } else {
      this.state = 'slide';
    }

    // 6. Aplicar Gravedad
    if (!this.grounded) {
      // Gravedad normal o en deslizamiento por pared
      let gravityForce = CONFIG.GRAVITY;
      if (this.isWallSliding) {
        gravityForce = CONFIG.PLAYER.WALL_SLIDE_SPEED * CONFIG.GRAVITY;
        this.state = 'wall-slide';
        if (Math.random() > 0.7) PARTICLES.spawnWallDust(this.x + this.facingDir * 10, this.y - 12, 1, -this.facingDir);
      } else {
        this.state = 'jump';
      }
      this.vy += gravityForce;
    }

    // 7. Detección de Paredes para Wall Jump (solo si está en el aire)
    this.onWallLeft = map.isSolidAt(this.x - this.width / 2 - 2, this.y - 10) || map.isSolidAt(this.x - this.width / 2 - 2, this.y - 25);
    this.onWallRight = map.isSolidAt(this.x + this.width / 2 + 2, this.y - 10) || map.isSolidAt(this.x + this.width / 2 + 2, this.y - 25);
    
    this.isWallSliding = false;
    if (!this.grounded && this.vy > 0) {
      if ((this.onWallLeft && keyLeft) || (this.onWallRight && keyRight)) {
        this.isWallSliding = true;
        this.doubleJumpAvailable = true; // Restaurar doble salto en la pared
      }
    }

    // 8. Salto (W o Espacio)
    // Usamos keys['KeyW_Trigger'] para evitar saltos infinitos por mantener presionada la tecla.
    // El trigger se limpia en el bucle principal.
    if (keys['KeyW_Trigger'] || keys['Space_Trigger'] || keys['ArrowUp_Trigger']) {
      // Limpiar triggers
      keys['KeyW_Trigger'] = false;
      keys['Space_Trigger'] = false;
      keys['ArrowUp_Trigger'] = false;

      if (this.grounded) {
        // Salto Normal
        this.vy = CONFIG.PLAYER.JUMP_FORCE;
        this.grounded = false;
        SOUND.playJump();
        PARTICLES.spawnDust(this.x, this.y, 6, 0);
      } else if (this.isWallSliding) {
        // Salto en la Pared (Wall Jump) - Impulsa en sentido contrario
        const wallDir = this.onWallLeft ? 1 : -1;
        this.vx = wallDir * CONFIG.PLAYER.WALL_JUMP_X;
        this.vy = CONFIG.PLAYER.WALL_JUMP_Y;
        this.facingDir = wallDir;
        this.isWallSliding = false;
        SOUND.playJump();
        PARTICLES.spawnDust(this.x + (-wallDir) * 10, this.y - 12, 5, -wallDir);
      } else if (this.doubleJumpAvailable) {
        // Doble Salto
        this.vy = CONFIG.PLAYER.DOUBLE_JUMP_FORCE;
        this.doubleJumpAvailable = false;
        SOUND.playJump();
        
        // Efecto visual: ráfaga de chispas en cruz
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          PARTICLES.particles.push(
            new Particle(this.x, this.y - 12, Math.cos(ang) * 2, Math.sin(ang) * 2 + 1, '#ffffff', 2.5, 12, 0.05)
          );
        }
      }
    }

    // Salto variable: si soltamos el botón de salto y subimos rápido, recortamos impulso
    if (!keyJump && this.vy < -2.0) {
      this.vy = -2.0;
    }

    // 9. Resolver Colisiones Físicas con el Mapa (AABB)
    this.resolveCollisions(map, keyCrouch);

    // 10. Disparar Hechizo Místico (Click J / Mouse Click)
    // El trigger se limpia en main/game
    if (keys['KeyJ_Trigger'] || keys['Mouse_Trigger']) {
      keys['KeyJ_Trigger'] = false;
      keys['Mouse_Trigger'] = false;
      this.shoot(projectiles);
    }

    // 11. Actualizar Simulación física de la Bufanda (Cuerda Verlet simplificada)
    this.updateScarf();

    // Actualizar timer de animaciones
    this.animTime += Math.abs(this.vx) * 0.15 + 0.08;
    if (this.iframeTimer > 0 && Math.floor(this.iframeTimer / 4) % 2 === 0) {
      this.state = 'hurt';
    }
  }

  shoot(projectiles) {
    if (this.shootCooldownTimer > 0) return;

    SOUND.playShoot();
    this.shootCooldownTimer = this.getShootCooldown();

    const spawnX = this.x + this.facingDir * CONFIG.PROJECTILE.SPAWN_OFFSET_X;
    const spawnY = this.y + (this.isCrouching ? -CONFIG.PLAYER.CROUCH_HEIGHT / 2 : -16);
    
    // Muzzle flash espiritual
    PARTICLES.spawnSpiritualTrail(spawnX, spawnY, 4);

    if (this.upgrades.tripleShot > 0) {
      // Disparo triple en abanico
      const angles = [-0.15, 0, 0.15]; // Ángulos en radianes
      angles.forEach(angle => {
        const vx = Math.cos(angle) * CONFIG.PROJECTILE.SPEED * this.facingDir;
        const vy = Math.sin(angle) * CONFIG.PROJECTILE.SPEED;
        projectiles.push(
          new Projectile(spawnX, spawnY, vx, vy, 'player', this.getDamage())
        );
      });
    } else {
      // Disparo recto normal
      const vx = CONFIG.PROJECTILE.SPEED * this.facingDir;
      const vy = 0;
      projectiles.push(
        new Projectile(spawnX, spawnY, vx, vy, 'player', this.getDamage())
      );
    }
  }

  resolveCollisions(map, keyCrouch) {
    // 1. Colisión Eje X (Movimiento horizontal)
    this.x += this.vx;
    let hitbox = this.getHitbox();

    const checkXCollision = () => {
      // Revisar esquinas laterales de la caja
      const steps = [4, 14, 28]; // Muestras de colisión vertical
      if (this.isCrouching) steps.splice(2, 1); // Quitar paso alto al agacharse

      for (let offset of steps) {
        const testY = this.y - offset;
        const sideX = this.vx > 0 ? hitbox.x + hitbox.width : hitbox.x;

        if (map.isSolidAt(sideX, testY)) {
          // Retroceder y frenar
          if (this.vx > 0) {
            this.x = Math.floor(sideX / map.tileSize) * map.tileSize - this.width / 2;
          } else {
            this.x = Math.floor(sideX / map.tileSize) * map.tileSize + map.tileSize + this.width / 2;
          }
          this.vx = 0;
          this.isSliding = false;
          break;
        }
      }
    };
    checkXCollision();

    // 2. Colisión Eje Y (Gravedad y salto)
    this.y += this.vy;
    hitbox = this.getHitbox();

    let newGrounded = false;

    // Revisar colisión vertical (techo/suelo)
    const testPointsX = [hitbox.x + 2, hitbox.x + hitbox.width / 2, hitbox.x + hitbox.width - 2];
    
    if (this.vy < 0) {
      // Subiendo: Colisión contra techos sólidos
      const testY = this.y - this.height;
      for (let testX of testPointsX) {
        if (map.isSolidAt(testX, testY)) {
          this.y = Math.floor(testY / map.tileSize) * map.tileSize + map.tileSize + this.height;
          this.vy = 0;
          break;
        }
      }
    } else {
      // Bajando: Colisión contra suelos sólidos Y plataformas semi-sólidas
      const testY = this.y;
      
      for (let testX of testPointsX) {
        const onSolid = map.isSolidAt(testX, testY);
        const onSemi = map.isSemiSolidAt(testX, testY);
        
        // Solo aterrizamos en semi-sólidos si:
        // - El pie estaba arriba del borde de la plataforma en el frame anterior
        // - No estamos presionando S (agacharse) + W/Espacio para atravesarlo/bajar
        const prevFootY = this.y - this.vy;
        const tileTopY = Math.floor(testY / map.tileSize) * map.tileSize;
        
        const platformDrop = keyCrouch && (this.vy > 0); // Drop platform request

        if (onSolid || (onSemi && prevFootY <= tileTopY + 1 && !platformDrop)) {
          // Aterrizar
          this.y = tileTopY;
          this.vy = 0;
          newGrounded = true;
          this.doubleJumpAvailable = true; // Resetear doble salto
          
          // Trampas de Púas
          const col = Math.floor(testX / map.tileSize);
          const row = Math.floor(testY / map.tileSize);
          if (map.grid[row][col] === 4) {
            this.takeDamage(10); // Daño directo por púas
          }

          // Interactuar con Resorte
          if (map.grid[row][col] === 5) {
            const spring = map.springs.find(s => s.col === col && s.row === row);
            if (spring) {
              spring.triggerFrames = 10;
              this.vy = -10.5; // Brinco gigante
              newGrounded = false;
              SOUND.playJump();
              PARTICLES.spawnDust(this.x, this.y, 10, 0);
            }
          }
          break;
        }
      }
    }

    this.grounded = newGrounded;
  }

  updateScarf() {
    // El punto de anclaje está en el cuello del zorro
    const neckX = this.x - this.facingDir * 4;
    const neckY = this.y - (this.isCrouching ? 12 : 23);

    // Mover el primer segmento al cuello
    this.scarfSegments[0].x = neckX;
    this.scarfSegments[0].y = neckY;

    // Simular los demás segmentos con retardo (efecto arrastre de cuerda)
    for (let i = 1; i < this.scarfSegments.length; i++) {
      const prev = this.scarfSegments[i - 1];
      const curr = this.scarfSegments[i];

      // Distancia objetivo entre nudos
      const targetDist = 3.5;
      
      let dx = curr.x - prev.x;
      let dy = curr.y - prev.y;
      
      // Aplicar soplado de viento de cola debido al movimiento del jugador
      dx -= this.vx * 0.25 * (1 - i / this.scarfSegments.length);
      dy += 0.12; // Gravedad leve sobre el tejido

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > targetDist) {
        const ratio = targetDist / dist;
        curr.x = prev.x + dx * ratio;
        curr.y = prev.y + dy * ratio;
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Dibujar bufanda de ninja roja con física hermosa
    ctx.fillStyle = '#dc2626'; // Rojo vibrante
    ctx.strokeStyle = '#991b1b'; // Bordes rojos oscuros
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.scarfSegments[0].x, this.scarfSegments[0].y);
    for (let i = 1; i < this.scarfSegments.length; i++) {
      ctx.lineTo(this.scarfSegments[i].x, this.scarfSegments[i].y);
    }
    ctx.stroke();

    // Cintas cuadradas de la bufanda al final
    for (let i = 1; i < this.scarfSegments.length; i++) {
      const seg = this.scarfSegments[i];
      const size = Math.max(2, 6 - i * 0.7); // Se hace más delgada
      ctx.fillRect(Math.floor(seg.x - size / 2), Math.floor(seg.y - size / 2), size, size);
    }

    // 2. Preparar renderizado del zorro pixelado
    ctx.translate(Math.floor(this.x), Math.floor(this.y));
    ctx.scale(this.facingDir, 1); // Voltear dinámicamente

    // Parámetros de animación (Squash & Stretch)
    let scaleX = 1.0;
    let scaleY = 1.0;

    if (!this.grounded) {
      // Estirar al subir en salto, aplastar al caer rápido
      if (this.vy < 0) {
        scaleY = 1.15;
        scaleX = 0.88;
      } else {
        scaleY = 0.90;
        scaleX = 1.05;
      }
    } else {
      // Aplastamiento leve al aterrizar/correr rápido
      const speed = Math.abs(this.vx);
      if (speed > 0.1) {
        scaleY = 0.96 + Math.sin(this.animTime * 2) * 0.03;
        scaleX = 1.04 - Math.sin(this.animTime * 2) * 0.03;
      } else {
        // Respiración pasiva (Idle)
        scaleY = 1.0 + Math.sin(this.animTime) * 0.02;
        scaleX = 1.0 - Math.sin(this.animTime) * 0.02;
      }
    }
    ctx.scale(scaleX, scaleY);

    // COLORES DEL ZORRO NINJA
    const Orange = '#ff6b35';
    const OrangeDark = '#d84a16';
    const White = '#ffffff';
    const Black = '#1a1a1d';
    const BlueGlow = '#3ae3ff'; // Ojos místicos
    const HeadbandRed = '#dc2626'; // Banda ninja roja

    // --- COLA ESPONJOSA DEL ZORRO ---
    // La cola oscila según la velocidad y el tiempo
    let tailAngle = Math.sin(this.animTime * 0.8) * 0.15;
    if (this.state === 'run') tailAngle = Math.sin(this.animTime * 1.5) * 0.3 - 0.2;
    if (this.state === 'jump') tailAngle = 0.4;
    if (this.isCrouching) tailAngle = 0.3;

    ctx.save();
    ctx.translate(-8, -12); // Base de la cola
    ctx.rotate(tailAngle);
    
    // Dibujo de cola en capas de píxeles
    ctx.fillStyle = Orange;
    ctx.fillRect(-10, -5, 12, 10);
    ctx.fillStyle = OrangeDark;
    ctx.fillRect(-10, 0, 10, 5);
    ctx.fillStyle = White; // Punta de cola blanca clásica
    ctx.fillRect(-14, -3, 5, 7);
    ctx.restore();

    // --- PIERNAS / EXTREMIDADES ---
    let legOffset1 = 0;
    let legOffset2 = 0;
    if (this.state === 'run') {
      legOffset1 = Math.sin(this.animTime * 1.5) * 6;
      legOffset2 = -Math.sin(this.animTime * 1.5) * 6;
    }

    ctx.fillStyle = Black; // Botas negras ninja
    if (this.isCrouching) {
      // Piernas agachadas
      ctx.fillRect(-8, -4, 4, 4);
      ctx.fillRect(2, -4, 4, 4);
    } else {
      // Piernas de pie normales
      ctx.fillRect(-6 + legOffset1 / 2, -8, 3, 8);
      ctx.fillRect(1 + legOffset2 / 2, -8, 3, 8);
      ctx.fillStyle = OrangeDark;
      ctx.fillRect(-6 + legOffset1 / 2, -8, 3, 3);
      ctx.fillRect(1 + legOffset2 / 2, -8, 3, 3);
    }

    // --- CUERPO (Túnica Ninja) ---
    ctx.fillStyle = Black; // Ropa oscura ninja
    if (this.isCrouching) {
      ctx.fillRect(-8, -16, 15, 12);
      ctx.fillStyle = Orange; // Pecho naranja asomando
      ctx.fillRect(-3, -13, 6, 8);
      ctx.fillStyle = White;
      ctx.fillRect(-1, -11, 3, 5);
    } else {
      ctx.fillRect(-7, -24, 14, 16);
      ctx.fillStyle = Orange; // Pecho del zorro
      ctx.fillRect(-3, -21, 6, 12);
      ctx.fillStyle = White;
      ctx.fillRect(-1, -18, 3, 8);
      
      // Cinturón místico rojo
      ctx.fillStyle = HeadbandRed;
      ctx.fillRect(-7.5, -13, 15, 2);
    }

    // --- CABEZA DE ZORRO ---
    const headY = this.isCrouching ? -22 : -30;
    ctx.save();
    ctx.translate(0, headY);
    
    // Cara / Pelaje Naranja
    ctx.fillStyle = Orange;
    ctx.fillRect(-6, -8, 12, 10);
    ctx.fillStyle = OrangeDark; // Sombra en base de la cabeza
    ctx.fillRect(-6, 0, 11, 2);

    // Mejillas blancas esponjosas
    ctx.fillStyle = White;
    ctx.fillRect(-8, -2, 3, 3);
    ctx.fillRect(5, -2, 3, 3);
    ctx.fillRect(-7, -4, 2, 2);
    ctx.fillRect(5, -4, 2, 2);

    // Hocico
    ctx.fillStyle = Orange;
    ctx.fillRect(4, -3, 4, 4);
    ctx.fillStyle = Black; // Nariz
    ctx.fillRect(7, -3, 2, 2);

    // Orejas de zorro (puntiagudas)
    ctx.fillStyle = Orange;
    ctx.fillRect(-6, -12, 3, 4); // Oreja trasera
    ctx.fillStyle = Black; // Detalle interior oreja
    ctx.fillRect(-5, -10, 1, 2);

    ctx.fillStyle = Orange;
    ctx.fillRect(2, -12, 3, 4);  // Oreja delantera
    ctx.fillStyle = Black;
    ctx.fillRect(3, -10, 1, 2);

    // Banda Ninja Mística en la frente
    ctx.fillStyle = HeadbandRed;
    ctx.fillRect(-6.5, -7, 13.5, 2.5);
    ctx.fillStyle = White; // Placa metálica ninja
    ctx.fillRect(2, -7, 3, 2.5);

    // Ojo místico brillante cian (estilo ninja de fuego azul)
    ctx.fillStyle = BlueGlow;
    ctx.fillRect(2, -4, 2, 2.5);

    ctx.restore();

    // --- MANO / SENSOR DE DISPARO ---
    if (this.shootCooldownTimer > CONFIG.PLAYER.SHOOT_COOLDOWN * 0.6) {
      // Brazo extendido lanzando hechizo
      ctx.fillStyle = Black;
      ctx.fillRect(4, this.isCrouching ? -12 : -18, 8, 3);
      ctx.fillStyle = Orange;
      ctx.fillRect(10, this.isCrouching ? -12 : -18, 3, 3);
    } else {
      // Brazo descansando
      ctx.fillStyle = Black;
      ctx.fillRect(2, this.isCrouching ? -10 : -16, 3, 6);
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
