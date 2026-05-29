// MOTOR PRINCIPAL DEL JUEGO (CORE GAME ENGINE - MULTIMUNDO Y JEFE GOBLIN)
import { CONFIG } from './config.js';
import { SOUND } from './sound.js';
import { PARTICLES } from './particles.js';
import { GameMap } from './map.js';
import { Player } from './player.js';
import { Zombie } from './zombie.js';

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    
    // Entidades del juego
    this.map = null;
    this.player = null;
    this.zombies = [];
    this.projectiles = [];
    
    // Controles
    this.keys = {};
    
    // Estado del juego: 'START_SCREEN', 'PLAYING', 'UPGRADE_SHOP', 'GAME_OVER', 'PAUSED'
    this.state = 'START_SCREEN';
    
    // Estadísticas
    this.score = 0;
    this.money = 0;
    this.highScore = parseInt(localStorage.getItem('foxy_high_score') || '0');
    
    // Combos
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMaxTimer = 180;

    // Sistema de Oleadas
    this.wave = 0;
    this.zombiesToSpawn = 0;
    this.zombiesSpawned = 0;
    this.spawnTimer = 0;
    this.zombiesSlain = 0;

    // Fases del Jefe Duende de Oleada
    this.bossPhase = false;
    this.bossSpawned = false;
    this.bossTimer = 0;
    
    // Tema del mundo activo: 'forest', 'desert', 'city', 'farm', 'ocean', 'space', 'volcano'
    this.theme = 'forest';

    // Cámara y sacudida
    this.cameraX = 0;
    this.shakeIntensity = 0;

    // Elementos DOM
    this.dom = {};
  }

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Configurar resolución lógica
    this.canvas.width = CONFIG.VIEW_WIDTH;
    this.canvas.height = CONFIG.VIEW_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;

    this.map = new GameMap();
    this.player = new Player(150, 200);

    this.setupInput();
    this.setupDOM();
    this.loadState('START_SCREEN');

    requestAnimationFrame((t) => this.loop(t));
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      // Prevenir el scroll de página y la activación de botones HTML del navegador (Focus Trap)
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      this.keys[e.code] = true;
      if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
        this.keys[e.code + '_Trigger'] = true;
      }
      if (e.code === 'KeyJ') {
        this.keys['KeyJ_Trigger'] = true;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.state === 'PLAYING') {
        this.keys['Mouse_Trigger'] = true;
      }
    });

    // Desenfocar automáticamente cualquier botón HTML clicado (Focus Trap prevent)
    window.addEventListener('click', () => {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
        document.activeElement.blur();
      }
    });
  }

  setupDOM() {
    this.dom = {
      hud: document.getElementById('hud'),
      startScreen: document.getElementById('start-screen'),
      shopScreen: document.getElementById('shop-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      pauseOverlay: document.getElementById('pause-overlay'),
      
      healthBar: document.getElementById('hud-health'),
      healthText: document.getElementById('hud-health-text'),
      moneyText: document.getElementById('hud-money'),
      scoreText: document.getElementById('hud-score'),
      waveText: document.getElementById('hud-wave'),
      zombiesCountText: document.getElementById('hud-zombies'),
      highScoreText: document.getElementById('hud-highscore'),
      
      comboContainer: document.getElementById('hud-combo-container'),
      comboBadge: document.getElementById('hud-combo-badge'),
      comboBar: document.getElementById('hud-combo-bar'),

      // Estadísticas finales
      finalScore: document.getElementById('final-score'),
      finalWave: document.getElementById('final-wave'),
      finalZombies: document.getElementById('final-zombies'),
      finalHighScore: document.getElementById('final-highscore'),

      btnContinue: document.getElementById('btn-continue'),
      btnResumeGame: document.getElementById('btn-resume-game'),
    };

    document.getElementById('btn-play').addEventListener('click', () => {
      SOUND.init();
      SOUND.startMusic();
      this.startGame();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.startGame();
    });

    this.dom.btnContinue.addEventListener('click', () => {
      this.resumeSavedGame();
    });

    this.dom.btnResumeGame.addEventListener('click', () => {
      this.resumeSavedGame();
    });

    document.getElementById('btn-next-wave').addEventListener('click', () => {
      this.startNextWave();
    });

    const btnCrt = document.getElementById('btn-crt-toggle');
    btnCrt.addEventListener('click', () => {
      const container = document.getElementById('game-container');
      container.classList.toggle('crt-active');
      btnCrt.classList.toggle('active');
      SOUND.playCollect();
    });

    const btnMute = document.getElementById('btn-mute');
    btnMute.addEventListener('click', () => {
      const muted = SOUND.toggleMute();
      btnMute.innerHTML = muted ? '🔇 Silenciado' : '🔊 Sonido: ON';
      btnMute.classList.toggle('muted-active');
    });

    this.setupShopButtons();
  }

  setupShopButtons() {
    const buyButtons = [
      { id: 'buy-health', type: 'HEALTH' },
      { id: 'buy-damage', type: 'DAMAGE' },
      { id: 'buy-speed', type: 'SPEED' },
      { id: 'buy-firerate', type: 'FIRE_RATE' },
      { id: 'buy-tripleshot', type: 'TRIPLE_SHOT' }
    ];

    buyButtons.forEach(b => {
      const el = document.getElementById(b.id);
      el.addEventListener('click', () => {
        this.buyUpgrade(b.type, el);
      });
    });
  }

  loadState(newState) {
    this.state = newState;
    
    this.dom.startScreen.classList.add('hidden');
    this.dom.shopScreen.classList.add('hidden');
    this.dom.gameOverScreen.classList.add('hidden');
    this.dom.pauseOverlay.classList.add('hidden');
    this.dom.hud.classList.add('hidden');

    // Desactivar cartel de alerta de Boss
    const alertEl = document.getElementById('boss-warning-overlay');
    if (alertEl) alertEl.classList.add('hidden');

    if (newState === 'START_SCREEN') {
      this.dom.startScreen.classList.remove('hidden');
      
      // Mostrar botón de continuar si hay progreso
      const savedData = localStorage.getItem('foxy_save_progress');
      if (savedData && this.dom.btnResumeGame) {
        try {
          const progress = JSON.parse(savedData);
          if (progress.wave > 1) {
            this.dom.btnResumeGame.classList.remove('hidden');
            this.dom.btnResumeGame.innerText = `CONTINUAR: OLEADA ${progress.wave}`;
          } else {
            this.dom.btnResumeGame.classList.add('hidden');
          }
        } catch (e) {
          this.dom.btnResumeGame.classList.add('hidden');
        }
      } else if (this.dom.btnResumeGame) {
        this.dom.btnResumeGame.classList.add('hidden');
      }
    } 
    else if (newState === 'PLAYING') {
      this.dom.hud.classList.remove('hidden');
    } 
    else if (newState === 'UPGRADE_SHOP') {
      this.dom.shopScreen.classList.remove('hidden');
      this.updateShopUI();
    } 
    else if (newState === 'GAME_OVER') {
      this.dom.gameOverScreen.classList.remove('hidden');
      
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('foxy_high_score', this.highScore.toString());
      }
      
      this.dom.finalScore.innerText = this.score;
      this.dom.finalWave.innerText = this.wave;
      this.dom.finalZombies.innerText = this.zombiesSlain;
      this.dom.finalHighScore.innerText = this.highScore;

      // Mostrar botón de continuar si hay progreso salvado
      const savedData = localStorage.getItem('foxy_save_progress');
      if (savedData && this.dom.btnContinue) {
        try {
          const progress = JSON.parse(savedData);
          if (progress.wave > 1) {
            this.dom.btnContinue.classList.remove('hidden');
            this.dom.btnContinue.innerText = `CONTINUAR OLEADA ${progress.wave}`;
          } else {
            this.dom.btnContinue.classList.add('hidden');
          }
        } catch (e) {
          this.dom.btnContinue.classList.add('hidden');
        }
      } else if (this.dom.btnContinue) {
        this.dom.btnContinue.classList.add('hidden');
      }

      SOUND.stopMusic();
      SOUND.playGameOver();
    }
  }

  startGame() {
    this.score = 0;
    this.money = 0;
    this.zombiesSlain = 0;
    this.wave = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    
    this.player = new Player(150, 200);
    this.map = new GameMap();
    this.zombies = [];
    this.projectiles = [];
    PARTICLES.clear();
    
    SOUND.stopMusic();
    SOUND.startMusic();

    this.startNextWave();
  }

  startNextWave() {
    this.wave++;
    this.loadState('PLAYING');

    // 1. Determinar el tema del mundo según la oleada activa
    const worldIndex = (this.wave - 1) % CONFIG.WORLD_ORDER.length;
    this.theme = CONFIG.WORLD_ORDER[worldIndex];
    this.map.theme = this.theme;

    // 2. Modificar físicas adaptativas en caliente
    const worldConfig = CONFIG.WORLDS[this.theme];
    CONFIG.GRAVITY = worldConfig.GRAVITY;
    CONFIG.AIR_RESISTANCE = worldConfig.AIR_RESISTANCE;

    // Regenerar bellotas y reajustar posición del zorro ninja
    this.map.respawnCollectibles();
    this.player.x = 150;
    this.player.y = 200;
    this.player.vx = 0;
    this.player.vy = 0;

    // 3. Configuración de oleada de zombies
    this.zombiesToSpawn = 5 + (this.wave - 1) * 3; // Escalado lineal
    this.zombiesSpawned = 0;
    this.spawnTimer = 0;
    
    // Iniciar fases del Jefe Duende
    this.bossPhase = false;
    this.bossSpawned = false;
    this.bossTimer = 0;

    SOUND.playWaveComplete();
    this.triggerScreenShake(4);
    this.player.heal(25); // Curar parcialmente por victoria

    // Guardar progreso automáticamente
    this.saveProgress();
  }

  saveProgress() {
    const progress = {
      wave: this.wave,
      money: this.money,
      score: this.score,
      upgrades: this.player.upgrades,
      zombiesSlain: this.zombiesSlain
    };
    localStorage.setItem('foxy_save_progress', JSON.stringify(progress));
  }

  resumeSavedGame() {
    const rawData = localStorage.getItem('foxy_save_progress');
    if (!rawData) return;
    
    try {
      const progress = JSON.parse(rawData);
      
      // Restaurar estadísticas
      this.score = progress.score || 0;
      this.money = progress.money || 0;
      this.zombiesSlain = progress.zombiesSlain || 0;
      
      // La oleada a iniciar es la guardada
      this.wave = progress.wave - 1; // Le restamos 1 porque startNextWave() hará this.wave++
      
      // Recrear jugador y restaurar upgrades
      this.player = new Player(150, 200);
      if (progress.upgrades) {
        this.player.upgrades = progress.upgrades;
      }
      this.player.health = this.player.getMaxHealth(); // Curar al 100%

      this.map = new GameMap();
      this.zombies = [];
      this.projectiles = [];
      PARTICLES.clear();
      
      SOUND.stopMusic();
      SOUND.startMusic();

      this.startNextWave();
    } catch (e) {
      console.error("Error cargando el progreso guardado:", e);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.dom.pauseOverlay.classList.remove('hidden');
      SOUND.stopMusic();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.dom.pauseOverlay.classList.add('hidden');
      SOUND.startMusic();
    }
  }

  buyUpgrade(upgradeType, buttonEl) {
    const config = CONFIG.UPGRADES[upgradeType];
    let currentLevel = 0;

    if (upgradeType === 'HEALTH') currentLevel = this.player.upgrades.healthLevel;
    else if (upgradeType === 'DAMAGE') currentLevel = this.player.upgrades.damageLevel;
    else if (upgradeType === 'SPEED') currentLevel = this.player.upgrades.speedLevel;
    else if (upgradeType === 'FIRE_RATE') currentLevel = this.player.upgrades.fireRateLevel;
    else if (upgradeType === 'TRIPLE_SHOT') currentLevel = this.player.upgrades.tripleShot;

    if (currentLevel >= config.MAX_LEVEL) return;

    const cost = Math.round(config.BASE_COST * Math.pow(config.COST_MULTIPLIER, currentLevel));
    
    if (this.money >= cost) {
      this.money -= cost;
      SOUND.playCollect();

      if (upgradeType === 'HEALTH') {
        this.player.upgrades.healthLevel++;
        this.player.health = this.player.getMaxHealth();
      } 
      else if (upgradeType === 'DAMAGE') {
        this.player.upgrades.damageLevel++;
      } 
      else if (upgradeType === 'SPEED') {
        this.player.upgrades.speedLevel++;
      } 
      else if (upgradeType === 'FIRE_RATE') {
        this.player.upgrades.fireRateLevel++;
      } 
      else if (upgradeType === 'TRIPLE_SHOT') {
        this.player.upgrades.tripleShot = 1;
      }

      PARTICLES.spawnGoldSparkle(this.canvas.width / 2, this.canvas.height / 2, 10);
      this.updateShopUI();
    } else {
      SOUND.playHurt();
    }
  }

  updateShopUI() {
    document.getElementById('shop-money').innerText = this.money;
    
    const list = [
      { key: 'HEALTH', btnId: 'buy-health', barId: 'bar-health', lvl: this.player.upgrades.healthLevel },
      { key: 'DAMAGE', btnId: 'buy-damage', barId: 'bar-damage', lvl: this.player.upgrades.damageLevel },
      { key: 'SPEED', btnId: 'buy-speed', barId: 'bar-speed', lvl: this.player.upgrades.speedLevel },
      { key: 'FIRE_RATE', btnId: 'buy-firerate', barId: 'bar-firerate', lvl: this.player.upgrades.fireRateLevel },
      { key: 'TRIPLE_SHOT', btnId: 'buy-tripleshot', barId: 'bar-tripleshot', lvl: this.player.upgrades.tripleShot }
    ];

    list.forEach(item => {
      const config = CONFIG.UPGRADES[item.key];
      const cost = Math.round(config.BASE_COST * Math.pow(config.COST_MULTIPLIER, item.lvl));
      const btn = document.getElementById(item.btnId);
      const bar = document.getElementById(item.barId);
      
      let barsHtml = '';
      for (let i = 0; i < config.MAX_LEVEL; i++) {
        barsHtml += `<div class="level-segment ${i < item.lvl ? 'active' : ''}"></div>`;
      }
      bar.innerHTML = barsHtml;

      if (item.lvl >= config.MAX_LEVEL) {
        btn.innerHTML = 'MÁXIMO';
        btn.disabled = true;
        btn.classList.add('maxed');
      } else {
        btn.innerHTML = `Comprar: 🌰${cost}`;
        btn.disabled = this.money < cost;
        btn.classList.toggle('disabled', this.money < cost);
      }
    });
  }

  loop(timestamp) {
    if (this.state === 'PLAYING') {
      this.update();
      this.draw();
    } else if (this.state === 'PAUSED') {
      // Pausado
    } else {
      this.drawStaticScene();
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    // 0. Esparcir partículas ambientales específicas del mundo activo
    PARTICLES.spawnAmbientParticles(this.theme, this.cameraX);

    // 1. Spawning de Zombies normales
    this.spawnTimer++;
    const currentInterval = Math.max(
      CONFIG.WAVES.MIN_SPAWN_INTERVAL, 
      CONFIG.WAVES.SPAWN_INTERVAL - (this.wave - 1) * 12
    );

    if (!this.bossPhase && this.zombiesSpawned < this.zombiesToSpawn && this.spawnTimer >= currentInterval) {
      this.spawnTimer = 0;
      this.spawnZombie();
    }

    // 2. FASE DE MINI-JEFE GOBLIN DE FIN DE OLEADA
    // Se activa cuando spawnean todos los comunes y son totalmente aniquilados
    if (this.zombiesSpawned >= this.zombiesToSpawn && this.zombies.length === 0 && !this.bossPhase) {
      this.bossPhase = true;
      this.bossSpawned = false;
      this.bossTimer = 110; // ~1.8 segundos de sirena roja
      SOUND.playZombieGrowl();
      this.triggerScreenShake(8);
      
      // Recuperar 20% de la vida máxima de Foxy (20% heal event)
      const healAmount = Math.round(this.player.getMaxHealth() * 0.20);
      this.player.heal(healAmount);
      
      // Mostrar overlay alerta de Boss
      const alertEl = document.getElementById('boss-warning-overlay');
      if (alertEl) alertEl.classList.remove('hidden');
    }

    if (this.bossPhase && !this.bossSpawned) {
      this.bossTimer--;
      // Golpes lejanos de entrada sísmica
      if (this.bossTimer % 20 === 0) {
        this.triggerScreenShake(4);
        SOUND.playZombieGrowl();
      }

      if (this.bossTimer <= 0) {
        this.bossSpawned = true;
        
        // Ocultar overlay
        const alertEl = document.getElementById('boss-warning-overlay');
        if (alertEl) alertEl.classList.add('hidden');

        // Spawnear Goblin Boss en el lado opuesto al zorro ninja
        const spawnX = this.player.x > this.map.width / 2 ? 60 : this.map.width - 60;
        const spawnY = this.map.height - 32;

        this.zombies.push(new Zombie(spawnX, spawnY, 'goblin', this.wave, this.theme));
        this.triggerScreenShake(10); // Mega terremoto de entrada
      }
    }

    // 3. Actualizar Entidades
    this.player.update(this.keys, this.map, this.projectiles);
    this.map.update();
    PARTICLES.update();

    // Actualizar Proyectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(this.map);
      
      if (!proj.alive) {
        if (proj.rockDebris && proj.rockDebris.length > 0) {
          proj.rockDebris.forEach(deb => this.projectiles.push(deb));
          this.triggerScreenShake(2.5);
        }
        this.projectiles.splice(i, 1);
      }
    }

    // Actualizar Zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.update(this.player, this.map, this.projectiles);
      
      // Si el Jefe destruyó un bloque del mapa, sacudir fuertemente la cámara
      if (z.destroyedBlock) {
        z.destroyedBlock = false; // Resetear
        this.triggerScreenShake(5);
      }
      
      // Temblor de tierra leve al andar si son gigantes
      if (z.alive && (z.type === 'boss' || z.type === 'goblin')) {
        if (Math.floor(z.animTime) % 20 === 0 && Math.abs(z.vx) > 0.1) {
          this.triggerScreenShake(1.5);
        }
      }

      if (!z.alive) {
        if (z.type === 'kamikaze') {
          // Detonar al morir para esparcir escombros de fuego caliente
          z.detonate(this.projectiles);
        }
        this.awardKill(z);
        this.zombies.splice(i, 1);
      }
    }

    // 4. Colisiones e Interacciones de Daño
    this.handleCollisions();

    // 5. Actualizar Combo
    if (this.comboCount > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // 6. Cámara Lerp
    const targetCamX = this.player.x - CONFIG.VIEW_WIDTH / 2;
    this.cameraX += (targetCamX - this.cameraX) * 0.08;
    this.cameraX = Math.max(0, Math.min(this.cameraX, this.map.width - CONFIG.VIEW_WIDTH));

    // Desvanecer Sacudida
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // 7. Victoria de Oleada (Spawneados completados, boss eliminado)
    if (this.zombiesSpawned >= this.zombiesToSpawn && this.zombies.length === 0 && this.bossSpawned) {
      this.loadState('UPGRADE_SHOP');
    }

    // 8. Muerte
    if (this.player.health <= 0) {
      this.loadState('GAME_OVER');
    }

    this.updateHUD();
  }

  spawnZombie() {
    this.zombiesSpawned++;
    
    let spawnX = 32;
    let spawnY = this.map.height - 32;

    const spawnPoints = this.map.getValidSpawnPoints();
    // 35% de probabilidad de aparecer en plataformas elevadas a partir de la oleada 2
    if (this.wave >= 2 && spawnPoints.length > 0 && Math.random() < 0.35) {
      const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      spawnX = pt.x;
      spawnY = pt.y;
    } else {
      // Suelo base a izquierda o derecha
      const spawnOnRight = Math.random() > 0.5;
      if (spawnOnRight) {
        spawnX = this.map.width - 32 - Math.random() * 80;
      } else {
        spawnX = 32 + Math.random() * 80;
      }
    }

    let type = 'common';
    const rand = Math.random();

    if (this.wave >= 2) {
      if (rand < 0.20) {
        type = 'kamikaze'; // Inmolador veloz
      } else if (rand >= 0.20 && rand < 0.45 && this.wave >= 3) {
        type = 'runner'; // Corredor
      } else if (rand >= 0.45 && rand < 0.65 && this.wave >= 4) {
        type = 'spitter'; // Escupidor
      }
    }
    
    if (this.wave > 1 && this.wave % 5 === 0 && this.zombiesSpawned === this.zombiesToSpawn) {
      type = 'boss'; // Spawnea el Boss Titán
      SOUND.playZombieGrowl();
      // Asegurar que el Subjefe Titán aparezca en el suelo para evitar atascos en repisas angostas
      spawnY = this.map.height - 32;
      spawnX = this.player.x > this.map.width / 2 ? 60 : this.map.width - 60;
    }

    this.zombies.push(new Zombie(spawnX, spawnY, type, this.wave, this.theme));
  }

  handleCollisions() {
    const pRect = this.player.getHitbox();

    this.zombies.forEach(z => {
      const zRect = z.getHitbox();
      if (
        pRect.x < zRect.x + zRect.width &&
        pRect.x + pRect.width > zRect.x &&
        pRect.y < zRect.y + zRect.height &&
        pRect.y + pRect.height > zRect.y
      ) {
        if (z.type === 'kamikaze') {
          // Si el inmolador toca al zorro ninja, detona infligiendo daño masivo e inmolación
          const hitSuccess = this.player.takeDamage(z.damage);
          if (hitSuccess) {
            z.detonate(this.projectiles);
            this.triggerScreenShake(6);
            this.comboCount = 0;
          }
        } else {
          const hitSuccess = this.player.takeDamage(z.damage);
          if (hitSuccess) {
            this.triggerScreenShake(4);
            this.comboCount = 0;
          }
        }
      }
    });

    this.projectiles.forEach(proj => {
      if (!proj.alive) return;
      const prRect = proj.getHitbox();

      if (proj.type === 'player') {
        this.zombies.forEach(z => {
          if (!z.alive) return;
          const zRect = z.getHitbox();

          if (
            prRect.x < zRect.x + zRect.width &&
            prRect.x + prRect.width > zRect.x &&
            prRect.y < zRect.y + zRect.height &&
            prRect.y + prRect.height > zRect.y
          ) {
            z.takeDamage(proj.damage);
            proj.onHitSolid();
            
            this.comboCount++;
            this.comboTimer = this.comboMaxTimer;
            this.score += 25 * Math.min(5, this.comboCount);
          }
        });
      } else {
        if (
          prRect.x < pRect.x + pRect.width &&
          prRect.x + prRect.width > pRect.x &&
          prRect.y < pRect.y + pRect.height &&
          prRect.y + pRect.height > pRect.y
        ) {
          const hitSuccess = this.player.takeDamage(proj.damage);
          if (hitSuccess) {
            proj.onHitSolid();
            this.triggerScreenShake(5);
            this.comboCount = 0;
          }
        }
      }
    });

    this.map.checkAcornCollisions(pRect, (amount) => {
      this.money += amount;
      this.score += amount * 10;
    });
  }

  awardKill(zombie) {
    this.zombiesSlain++;
    const mult = 1 + Math.floor(this.comboCount / 5);
    this.score += zombie.scoreValue * mult;
    this.money += zombie.moneyValue * mult;
    this.triggerScreenShake(2);
  }

  triggerScreenShake(intensity) {
    this.shakeIntensity = intensity;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    
    let shakeOffset = { x: 0, y: 0 };
    if (this.shakeIntensity > 0) {
      shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
      shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
    }
    
    this.ctx.translate(
      Math.floor(-this.cameraX + shakeOffset.x), 
      Math.floor(shakeOffset.y)
    );

    // 1. DIBUJAR FONDO ADAPTATIVO CON MULTIPARALAJE POR MUNDO
    this.drawParallaxBackground();

    // 2. Dibujar Bloques
    this.map.draw(this.ctx, this.cameraX);

    // 3. Dibujar Proyectiles
    this.projectiles.forEach(p => p.draw(this.ctx));

    // 4. Dibujar Zombies
    this.zombies.forEach(z => z.draw(this.ctx));

    // 5. Dibujar Player
    this.player.draw(this.ctx);

    // 6. Dibujar Partículas
    PARTICLES.draw(this.ctx);

    this.ctx.restore();
  }

  drawStaticScene() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.cameraX = 160 + Math.sin(Date.now() * 0.0003) * 60;
    
    this.drawParallaxBackground();
    this.map.draw(this.ctx, this.cameraX);
    
    if (Math.random() > 0.94) {
      PARTICLES.spawnSpiritualTrail(
        this.cameraX + Math.random() * CONFIG.VIEW_WIDTH, 
        CONFIG.VIEW_HEIGHT - 60 - Math.random() * 100, 
        1
      );
    }
    PARTICLES.update();
    PARTICLES.draw(this.ctx);

    this.ctx.restore();
  }

  // DIBUJAR FONDOS MULTIMUNDO DE LUJO CON PARALAJE ADAPTATIVO
  drawParallaxBackground() {
    const w = CONFIG.VIEW_WIDTH;
    const h = CONFIG.VIEW_HEIGHT;
    const t = Date.now();

    const config = CONFIG.WORLDS[this.theme] || CONFIG.WORLDS.forest;

    // --- CAPA 1: CIELO DEGRADADO ESPECÍFICO DEL MUNDO ---
    const skyGrad = this.ctx.createLinearGradient(this.cameraX, 0, this.cameraX, h);
    skyGrad.addColorStop(0, config.SKY_COLOR_TOP);
    skyGrad.addColorStop(0.6, config.SKY_COLOR_MID);
    skyGrad.addColorStop(1, config.SKY_COLOR_BTM);
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(this.cameraX, 0, w, h);

    // --- CAPA 2: EFECTOS CELESTIALES O CLIMÁTICOS DE FONDO ---
    if (this.theme === 'forest' || this.theme === 'space' || this.theme === 'city') {
      // Estrellas blancas y cianes
      this.ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 22; i++) {
        const starX = this.cameraX + ((i * 147) % w);
        const starY = (i * 48) % (h - 130);
        const twinkle = Math.sin(t * 0.0025 + i) > 0 ? 0.9 : 0.3;
        this.ctx.save();
        this.ctx.globalAlpha = twinkle * 0.5;
        this.ctx.fillRect(starX, starY, 1.5, 1.5);
        this.ctx.restore();
      }
    }

    if (this.theme === 'forest') {
      // Luna brillante
      const moonX = this.cameraX + w - 100 - (this.cameraX * 0.08);
      this.ctx.fillStyle = '#fffbe3';
      this.ctx.beginPath(); this.ctx.arc(moonX, 60, 26, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.fillStyle = '#fffbe31a';
      this.ctx.beginPath(); this.ctx.arc(moonX, 60, 34, 0, Math.PI * 2); this.ctx.fill();
    } 
    else if (this.theme === 'desert') {
      // Sol desértico rojo abrasador
      const sunX = this.cameraX + w - 120 - (this.cameraX * 0.05);
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath(); this.ctx.arc(sunX, 80, 30, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.fillStyle = '#f9731633';
      this.ctx.beginPath(); this.ctx.arc(sunX, 80, 42, 0, Math.PI * 2); this.ctx.fill();
    } 
    else if (this.theme === 'space') {
      // Planeta con anillo de fondo
      const planetX = this.cameraX + w - 150 - (this.cameraX * 0.04);
      const planetY = 70;
      // Anillo
      this.ctx.strokeStyle = '#c084fc66';
      this.ctx.lineWidth = 6;
      this.ctx.save();
      this.ctx.translate(planetX, planetY);
      this.ctx.rotate(0.3);
      this.ctx.scale(2.5, 0.4);
      this.ctx.beginPath(); this.ctx.arc(0, 0, 22, 0, Math.PI * 2); this.ctx.stroke();
      this.ctx.restore();
      // Esfera del Planeta
      this.ctx.fillStyle = '#a855f7';
      this.ctx.beginPath(); this.ctx.arc(planetX, planetY, 15, 0, Math.PI * 2); this.ctx.fill();
      // Nebulosa flotante gaseosa
      const nebGrad = this.ctx.createRadialGradient(this.cameraX + 220, 100, 10, this.cameraX + 220, 100, 80);
      nebGrad.addColorStop(0, '#c084fc22');
      nebGrad.addColorStop(1, '#3ae3ff00');
      this.ctx.fillStyle = nebGrad;
      this.ctx.fillRect(this.cameraX, 0, w, 200);
    }
    else if (this.theme === 'ocean') {
      // Rayos de luz subacuáticos
      this.ctx.fillStyle = '#aef7ff11';
      for (let i = 0; i < 4; i++) {
        const lx = this.cameraX + 80 + i * 160 + Math.sin(t * 0.001 + i) * 20;
        this.ctx.beginPath();
        this.ctx.moveTo(lx, 0);
        this.ctx.lineTo(lx + 30, 0);
        this.ctx.lineTo(lx - 20, h);
        this.ctx.lineTo(lx - 60, h);
        this.ctx.fill();
      }
    }

    // --- CAPA 3: COLINAS DISTANTES (PARALAJE x0.2) ---
    if (this.theme === 'forest') {
      this.ctx.fillStyle = '#1c1326'; // Púrpura bosque
      this.drawHills(this.cameraX * 0.2, 0.003, h - 140, 30);
    } 
    else if (this.theme === 'desert') {
      this.ctx.fillStyle = '#92400e'; // Dunas desierto
      this.drawHills(this.cameraX * 0.2, 0.002, h - 150, 24);
    } 
    else if (this.theme === 'city') {
      // Siluetas lejanas de rascacielos
      this.drawSkyscrapers(this.cameraX * 0.2, h - 60, '#1e293b', 45, 120);
    } 
    else if (this.theme === 'farm') {
      this.ctx.fillStyle = '#7c2d12'; // Colinas de heno
      this.drawHills(this.cameraX * 0.2, 0.004, h - 130, 15);
    } 
    else if (this.theme === 'ocean') {
      this.ctx.fillStyle = '#0f172a'; // Fosa marina
      this.drawHills(this.cameraX * 0.2, 0.003, h - 150, 35);
    } 
    else if (this.theme === 'space') {
      this.ctx.fillStyle = '#1f2937'; // Craters de luna
      this.drawHills(this.cameraX * 0.2, 0.005, h - 160, 20);
    } 
    else if (this.theme === 'volcano') {
      this.ctx.fillStyle = '#3f0712'; // Rocas basalticas
      this.drawHills(this.cameraX * 0.2, 0.004, h - 140, 28);
    }

    // --- CAPA 4: SILUETAS CERCANAS (PARALAJE x0.4) ---
    if (this.theme === 'forest') {
      this.ctx.fillStyle = '#171120'; // Pinos
      this.drawPineSilhouettes(this.cameraX * 0.4, h - 80);
    } 
    else if (this.theme === 'desert') {
      this.ctx.fillStyle = '#78350f'; // Cactus gigantes desérticos
      this.drawCactiSilhouettes(this.cameraX * 0.4, h - 80);
    } 
    else if (this.theme === 'city') {
      // Rascacielos cercanos con ventanas glowing pixel
      this.drawSkyscrapers(this.cameraX * 0.4, h - 80, '#0f172a', 65, 150, true);
    } 
    else if (this.theme === 'farm') {
      this.ctx.fillStyle = '#451a03'; // Silueta de graneros y molinos
      this.drawFarmSilhouettes(this.cameraX * 0.4, h - 80);
    } 
    else if (this.theme === 'ocean') {
      this.ctx.fillStyle = '#0b132b'; // Algas marinas gigantes oscilantes
      this.drawKelpSilhouettes(this.cameraX * 0.4, h - 80, t);
    } 
    else if (this.theme === 'space') {
      this.ctx.fillStyle = '#111827'; // Escombros meteoritos
      this.drawAsteroidSilhouettes(this.cameraX * 0.4, h - 80);
    } 
    else if (this.theme === 'volcano') {
      // Columnas ardientes
      this.ctx.fillStyle = '#2d0a0a';
      this.drawPineSilhouettes(this.cameraX * 0.4, h - 80); // Reutilizamos triangulos negros estilo rocas afiladas
    }

    // --- CAPA 5: NIEBLA / ATMÓSFERA DEL MUNDO ---
    const fogGrad = this.ctx.createLinearGradient(this.cameraX, h - 80, this.cameraX, h);
    fogGrad.addColorStop(0, `${config.FOG_COLOR}00`);
    fogGrad.addColorStop(1, `${config.FOG_COLOR}${Math.round(config.FOG_OPACITY * 255).toString(16).padStart(2, '0')}`);
    this.ctx.fillStyle = fogGrad;
    this.ctx.fillRect(this.cameraX, h - 100, w, 100);
  }

  // --- DIBUJADORES EXCLUSIVOS DE PARALAJE ---

  drawHills(scroll, freq, yOffset, amplitude) {
    const w = CONFIG.VIEW_WIDTH;
    const startX = this.cameraX;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, CONFIG.VIEW_HEIGHT);
    for (let px = 0; px <= w; px++) {
      const worldX = startX + px;
      const height = Math.sin((worldX + scroll) * freq) * amplitude + yOffset;
      this.ctx.lineTo(worldX, height);
    }
    this.ctx.lineTo(startX + w, CONFIG.VIEW_HEIGHT);
    this.ctx.fill();
  }

  drawPineSilhouettes(scroll, baseY) {
    const w = CONFIG.VIEW_WIDTH;
    const startX = this.cameraX;
    
    // Dibujar pinos triangulares estilizados retro
    const step = 45; // Distancia entre pinos
    const firstPine = Math.floor((startX - scroll) / step) * step;

    for (let x = firstPine; x < startX - scroll + w + step; x += step) {
      const realX = x + scroll;
      
      // Altura randomizada usando su coordenada
      const height = 45 + (Math.abs(Math.sin(x)) * 30);
      const width = 16 + (Math.abs(Math.cos(x)) * 8);

      // Dibujar pino pixelado en 3 capas triangulares
      this.ctx.beginPath();
      // Capa base
      this.ctx.moveTo(realX - width, baseY);
      this.ctx.lineTo(realX, baseY - height);
      this.ctx.lineTo(realX + width, baseY);
      this.ctx.fill();
    }
  }

  drawCactiSilhouettes(scroll, baseY) {
    const w = CONFIG.VIEW_WIDTH;
    const startX = this.cameraX;
    const step = 65;
    const firstCactus = Math.floor((startX - scroll) / step) * step;

    for (let x = firstCactus; x < startX - scroll + w + step; x += step) {
      const realX = x + scroll;
      const height = 40 + (Math.abs(Math.sin(x)) * 25);
      
      // Dibujar cuerpo de cactus pixelado
      this.ctx.fillRect(realX - 3, baseY - height, 6, height);
      // Brazos laterales
      this.ctx.fillRect(realX - 10, baseY - height + 15, 7, 3);
      this.ctx.fillRect(realX - 10, baseY - height + 8, 3, 8);
      
      this.ctx.fillRect(realX + 3, baseY - height + 20, 7, 3);
      this.ctx.fillRect(realX + 7, baseY - height + 10, 3, 11);
    }
  }

  drawSkyscrapers(scroll, baseY, color, minW, maxH, drawWindows = false) {
    const w = CONFIG.VIEW_WIDTH;
    const startX = this.cameraX;
    const step = 60;
    const firstBuilding = Math.floor((startX - scroll) / step) * step;

    this.ctx.fillStyle = color;
    for (let x = firstBuilding; x < startX - scroll + w + step; x += step) {
      const realX = x + scroll;
      const height = 60 + (Math.abs(Math.cos(x)) * maxH);
      const width = minW + (Math.abs(Math.sin(x)) * 20);

      this.ctx.fillStyle = color;
      this.ctx.fillRect(realX - width/2, baseY - height, width, height);

      // Ventanitas encendidas neón amarillas
      if (drawWindows) {
        this.ctx.fillStyle = '#fef08a';
        for (let wy = baseY - height + 10; wy < baseY - 10; wy += 14) {
          for (let wx = realX - width/2 + 6; wx < realX + width/2 - 6; wx += 12) {
            // 35% de ventanas encendidas
            if (Math.sin(wx * wy) > 0.3) {
              this.ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }
      }
    }
  }

  drawFarmSilhouettes(scroll, baseY) {
    const w = CONFIG.VIEW_WIDTH;
    const startX = this.cameraX;
    const step = 85;
    const firstGranero = Math.floor((startX - scroll) / step) * step;

    for (let x = firstGranero; x < startX - scroll + w + step; x += step) {
      const realX = x + scroll;
      // Dibujar chozas rusticas
      this.ctx.fillRect(realX - 15, baseY - 25, 30, 25);
      // Techo triangular
      this.ctx.beginPath();
      this.ctx.moveTo(realX - 18, baseY - 25);
      this.ctx.lineTo(realX, baseY - 38);
      this.ctx.lineTo(realX + 18, baseY - 25);
      this.ctx.fill();
    }
  }

  drawKelpSilhouettes(scroll, baseY, time) {
    const w = CONFIG.VIEW_WIDTH;
    const startX = this.cameraX;
    const step = 40;
    const firstKelp = Math.floor((startX - scroll) / step) * step;

    for (let x = firstKelp; x < startX - scroll + w + step; x += step) {
      const realX = x + scroll;
      const height = 60 + (Math.abs(Math.sin(x)) * 50);
      
      // Alga marina serpenteando con inercia de agua
      this.ctx.beginPath();
      this.ctx.moveTo(realX, baseY);
      for (let yOffset = 0; yOffset <= height; yOffset += 10) {
        const waveX = realX + Math.sin(time * 0.0015 + yOffset * 0.05 + x) * 8;
        this.ctx.lineTo(waveX, baseY - yOffset);
      }
      this.ctx.strokeStyle = '#064e3b';
      this.ctx.lineWidth = 5;
      this.ctx.stroke();
    }
  }

  drawAsteroidSilhouettes(scroll, baseY) {
    const w = CONFIG.VIEW_WIDTH;
    const startX = this.cameraX;
    const step = 70;
    const firstAst = Math.floor((startX - scroll) / step) * step;

    for (let x = firstAst; x < startX - scroll + w + step; x += step) {
      const realX = x + scroll;
      const size = 12 + (Math.abs(Math.sin(x)) * 16);
      const height = baseY - 50 - (Math.abs(Math.cos(x)) * 100);
      
      // Bloques volantes flotantes en el espacio (Asteroides)
      this.ctx.fillRect(realX - size/2, height, size, size - 4);
      this.ctx.fillStyle = '#111827';
      this.ctx.fillRect(realX - size/2 + 2, height + 2, size - 4, size - 8);
    }
  }

  // --- ACTUALIZAR HUD DEL DOM (PREMIUM UX) ---
  updateHUD() {
    const currentMaxHp = this.player.getMaxHealth();
    const hpPercent = (this.player.health / currentMaxHp) * 100;
    this.dom.healthBar.style.width = `${hpPercent}%`;
    this.dom.healthText.innerText = `${this.player.health}/${currentMaxHp}`;

    if (this.player.health < currentMaxHp * 0.25) {
      this.dom.healthBar.parentElement.classList.add('low-health-warning');
    } else {
      this.dom.healthBar.parentElement.classList.remove('low-health-warning');
    }

    this.dom.moneyText.innerText = `🌰 ${this.money}`;
    this.dom.scoreText.innerText = `SCORE: ${this.score.toString().padStart(6, '0')}`;
    
    // Cambiar nombre del mundo/nivel en la info superior
    const worldName = CONFIG.WORLDS[this.theme]?.NAME || 'Mundo Desconocido';
    this.dom.waveText.innerText = `NIVEL: ${this.wave} - ${worldName}`;
    
    const left = this.zombiesToSpawn - this.zombiesSpawned + this.zombies.length;
    this.dom.zombiesCountText.innerText = this.bossPhase 
      ? `🚨 ¡JEFE ALERTA!` 
      : `ZOMBIES: ${left}`;
    
    this.dom.highScoreText.innerText = `RECORD: ${Math.max(this.highScore, this.score)}`;

    if (this.comboCount >= 2) {
      this.dom.comboContainer.classList.remove('hidden');
      this.dom.comboBadge.innerText = `x${this.comboCount} COMBO!`;
      const comboPercent = (this.comboTimer / this.comboMaxTimer) * 100;
      this.dom.comboBar.style.width = `${comboPercent}%`;
    } else {
      this.dom.comboContainer.classList.add('hidden');
    }
  }
}

export const GAME = new GameEngine();
export default GAME;
