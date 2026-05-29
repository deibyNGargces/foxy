// MOTOR DE MAPA, PLATAFORMAS Y COLECCIONABLES (ACTUALIZADO MULTIMUNDO)
import { CONFIG } from './config.js';
import { PARTICLES, Particle } from './particles.js';
import { SOUND } from './sound.js';

export class GameMap {
  constructor() {
    this.tileSize = 16;
    this.cols = 60; // 960px de ancho (scrolling horizontal)
    this.rows = 23; // 368px de alto
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;

    this.grid = [];
    this.springs = []; // Resortes animados {col, row, triggerFrames: 0}
    this.acorns = [];  // Bellotas doradas {x, y, hoverAngle: 0, collected: false}
    this.theme = 'forest'; // Tema por defecto (cambia con la oleada)
    
    this.generateArena();
  }

  generateArena() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));

    // 1. Crear suelo sólido
    for (let col = 0; col < this.cols; col++) {
      this.grid[this.rows - 1][col] = 1; // Tierra profunda
      this.grid[this.rows - 2][col] = 1; // Suelo/Césped
    }

    // 2. Crear paredes laterales altas para contener la arena
    for (let row = 0; row < this.rows - 1; row++) {
      this.grid[row][0] = 2; // Pared izquierda
      this.grid[row][this.cols - 1] = 2; // Pared derecha
    }

    // 3. Crear plataformas flotantes interesantes y simétricas
    // Estructuras de ladrillos y puentes de madera (semi-sólidos)
    const layouts = [
      // Plataforma central baja
      { r: 16, cStart: 20, cEnd: 40, tile: 3 },
      // Plataformas laterales
      { r: 17, cStart: 5, cEnd: 15, tile: 2 },
      { r: 17, cStart: 45, cEnd: 54, tile: 2 },
      
      // Plataformas elevadas
      { r: 12, cStart: 12, cEnd: 24, tile: 3 },
      { r: 12, cStart: 36, cEnd: 48, tile: 3 },
      
      // Plataforma superior central alta
      { r: 8, cStart: 22, cEnd: 38, tile: 2 },
      // Más plataformas laterales altas
      { r: 8, cStart: 4, cEnd: 12, tile: 3 },
      { r: 8, cStart: 48, cEnd: 55, tile: 3 }
    ];

    layouts.forEach(l => {
      for (let c = l.cStart; c <= l.cEnd; c++) {
        this.grid[l.r][c] = l.tile;
      }
    });

    // 4. Agregar resortes para brincar alto (corregidos e in-bounds)
    this.addSpring(8, 20);
    this.addSpring(51, 20);
    this.addSpring(20, 15);
    this.addSpring(40, 15);

    // 5. Agregar trampas de púas en zonas estratégicas
    this.grid[this.rows - 3][15] = 4;
    this.grid[this.rows - 3][16] = 4;
    this.grid[this.rows - 3][43] = 4;
    this.grid[this.rows - 3][44] = 4;
    
    // Púas en plataforma central elevada
    this.grid[7][30] = 4;

    // 6. Generar bellotas doradas
    this.spawnAcornAt(150, 220);
    this.spawnAcornAt(320, 200);
    this.spawnAcornAt(480, 150);
    this.spawnAcornAt(800, 220);
    this.spawnAcornAt(300, 80);
    this.spawnAcornAt(660, 80);
    this.spawnAcornAt(100, 80);
    this.spawnAcornAt(860, 80);
  }

  addSpring(col, row) {
    this.grid[row][col] = 5; // Tile de resorte
    this.springs.push({
      col, row,
      triggerFrames: 0
    });
  }

  spawnAcornAt(x, y) {
    this.acorns.push({
      x, y,
      width: 10,
      height: 10,
      hoverAngle: Math.random() * Math.PI * 2,
      collected: false
    });
  }

  // Comprobar si hay sólido
  isSolidAt(x, y) {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
    
    const tile = this.grid[row][col];
    return tile === 1 || tile === 2;
  }

  // Comprobar si hay semi-sólido (se puede atravesar desde abajo)
  isSemiSolidAt(x, y) {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    
    const tile = this.grid[row][col];
    return tile === 3;
  }

  getValidSpawnPoints() {
    const points = [];
    // Escanea el mapa en busca de repisas o puentes elevados (pisos superiores)
    // Evita las columnas de los bordes externos y el suelo base profundo
    for (let r = 3; r < this.rows - 3; r++) {
      for (let c = 4; c < this.cols - 4; c++) {
        const currentTile = this.grid[r][c];
        const tileAbove1 = this.grid[r - 1][c];
        const tileAbove2 = this.grid[r - 2][c];
        
        // Si la baldosa es suelo o plataforma semi-sólida y hay aire libre arriba
        if ((currentTile === 1 || currentTile === 2 || currentTile === 3) && 
            tileAbove1 === 0 && tileAbove2 === 0) {
          points.push({
            x: c * this.tileSize + this.tileSize / 2,
            y: r * this.tileSize
          });
        }
      }
    }
    return points;
  }

  // Actualizar resortes y coleccionables
  update() {
    // Animación de resortes
    this.springs.forEach(s => {
      if (s.triggerFrames > 0) s.triggerFrames--;
    });

    // Animación de bellotas (flotan arriba y abajo)
    this.acorns.forEach(a => {
      if (!a.collected) {
        a.hoverAngle += 0.05;
      }
    });

    // Eliminar recolectadas
    this.acorns = this.acorns.filter(a => !a.collected);
  }

  // Comprobar colisión de recolecta con bellotas
  checkAcornCollisions(playerRect, onCollect) {
    this.acorns.forEach(a => {
      if (
        playerRect.x < a.x + a.width &&
        playerRect.x + playerRect.width > a.x &&
        playerRect.y < a.y + a.height &&
        playerRect.y + playerRect.height > a.y
      ) {
        a.collected = true;
        SOUND.playCollect();
        PARTICLES.spawnGoldSparkle(a.x + a.width / 2, a.y + a.height / 2, 8);
        onCollect(15); // Aumentar monedas
      }
    });
  }

  // DIBUJAR MAPA RETRO PIXEL-ART ADAPTATIVO POR MUNDO
  draw(ctx, cameraX) {
    ctx.save();
    
    // Definir límites para no dibujar lo que está fuera de cámara (culling)
    const startCol = Math.max(0, Math.floor(cameraX / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((cameraX + CONFIG.VIEW_WIDTH) / this.tileSize));

    for (let r = 0; r < this.rows; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.grid[r][c];
        if (tile === 0) continue;

        const x = c * this.tileSize;
        const y = r * this.tileSize;

        // --- TILE 1: SUELO / CÉSPED ---
        if (tile === 1) {
          if (this.theme === 'forest') {
            ctx.fillStyle = '#4d372e'; // Tierra bosque
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            ctx.fillStyle = '#26733b'; // Césped oscuro
            ctx.fillRect(x, y, this.tileSize, 4);
            ctx.fillStyle = '#4ade80'; // Césped brillante
            ctx.fillRect(x, y, this.tileSize, 2);
          } 
          else if (this.theme === 'desert') {
            ctx.fillStyle = '#d97706'; // Arena naranja
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            ctx.fillStyle = '#b58d3d'; // Arena seca top
            ctx.fillRect(x, y, this.tileSize, 4);
            ctx.fillStyle = '#fbbf24'; // Arena dorada
            ctx.fillRect(x, y, this.tileSize, 2);
          } 
          else if (this.theme === 'city') {
            ctx.fillStyle = '#334155'; // Asfalto gris
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            ctx.fillStyle = '#475569'; // Cemento
            ctx.fillRect(x, y, this.tileSize, 4);
            ctx.fillStyle = '#94a3b8'; // Grietas brillantes
            ctx.fillRect(x, y, this.tileSize, 2);
          } 
          else if (this.theme === 'farm') {
            ctx.fillStyle = '#352219'; // Tierra fértil
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            ctx.fillStyle = '#b45309'; // Cultivo seco
            ctx.fillRect(x, y, this.tileSize, 4);
            ctx.fillStyle = '#fbbf24'; // Trigo dorado
            ctx.fillRect(x, y, this.tileSize, 2);
          } 
          else if (this.theme === 'ocean') {
            ctx.fillStyle = '#1d3557'; // Grava azul profunda
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            ctx.fillStyle = '#1d4ed8'; // Arena marina top
            ctx.fillRect(x, y, this.tileSize, 4);
            ctx.fillStyle = '#3ae3ff'; // Coral luminiscente
            ctx.fillRect(x, y, this.tileSize, 2);
          } 
          else if (this.theme === 'space') {
            ctx.fillStyle = '#4b5563'; // Roca lunar gris
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            ctx.fillStyle = '#9ca3af'; // Polvo estelar
            ctx.fillRect(x, y, this.tileSize, 4);
            ctx.fillStyle = '#d1d5db'; // Brillo lunar blanco
            ctx.fillRect(x, y, this.tileSize, 2);
          } 
          else if (this.theme === 'volcano') {
            ctx.fillStyle = '#1c1917'; // Piedra volcánica negra
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            ctx.fillStyle = '#b91c1c'; // Basalto caliente
            ctx.fillRect(x, y, this.tileSize, 4);
            ctx.fillStyle = '#ea580c'; // Magma brillante
            ctx.fillRect(x, y, this.tileSize, 2);
          }
        } 
        // --- TILE 2: PARED SÓLIDA / BLOQUES ---
        else if (tile === 2) {
          let colorBase = '#2d2b38';
          let colorBorder = '#18161f';
          let colorShine = '#4c495e';

          if (this.theme === 'desert') {
            colorBase = '#b25e38'; // Ladrillo arcilla
            colorBorder = '#632811';
            colorShine = '#d9703c';
          } else if (this.theme === 'city') {
            colorBase = '#1e293b'; // Placa acero viga
            colorBorder = '#0f172a';
            colorShine = '#38bdf8';
          } else if (this.theme === 'farm') {
            colorBase = '#78350f'; // Tronco rústico
            colorBorder = '#451a03';
            colorShine = '#a16207';
          } else if (this.theme === 'ocean') {
            colorBase = '#115e59'; // Coral macizo
            colorBorder = '#0f172a';
            colorShine = '#34d399';
          } else if (this.theme === 'space') {
            colorBase = '#0f172a'; // Fuselaje metálico nave
            colorBorder = '#020617';
            colorShine = '#3ae3ff'; // Circuitos cian glowing
          } else if (this.theme === 'volcano') {
            colorBase = '#292524'; // Ladrillo obsidiana
            colorBorder = '#0c0a09';
            colorShine = '#dc2626'; // Grieta de lava
          }

          ctx.fillStyle = colorBase;
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
          ctx.strokeStyle = colorBorder;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, this.tileSize - 1, this.tileSize - 1);
          ctx.fillStyle = colorShine;
          ctx.fillRect(x + 1, y + 1, this.tileSize - 3, 2);
        } 
        // --- TILE 3: PLATAFORMAS SEMI-SÓLIDAS ---
        else if (tile === 3) {
          let platformColorTop = '#9c6644';
          let platformColorBtm = '#7f5539';
          let supportColor = '#ddb892';

          if (this.theme === 'city') {
            platformColorTop = '#64748b'; // Rejas de concreto
            platformColorBtm = '#475569';
            supportColor = '#94a3b8';
          } else if (this.theme === 'ocean') {
            platformColorTop = '#065f46'; // Puentes de algas
            platformColorBtm = '#064e3b';
            supportColor = '#34d399';
          } else if (this.theme === 'space') {
            platformColorTop = '#7e22ce'; // Campo fuerza violeta
            platformColorBtm = '#581c87';
            supportColor = '#c084fc';
          } else if (this.theme === 'volcano') {
            platformColorTop = '#78716c'; // Piedra basalto tallada
            platformColorBtm = '#44403c';
            supportColor = '#f97316';
          }

          ctx.fillStyle = platformColorTop;
          ctx.fillRect(x, y + 2, this.tileSize, 4);
          ctx.fillStyle = platformColorBtm;
          ctx.fillRect(x, y + 6, this.tileSize, 4);
          ctx.fillStyle = supportColor;
          ctx.fillRect(x + 1, y, 2, 2);
          ctx.fillRect(x + this.tileSize - 3, y, 2, 2);
        } 
        // --- TILE 4: PÚAS / TRAMPAS ---
        else if (tile === 4) {
          let spikeColor = '#7a7687'; // Metal por defecto
          let tipColor = '#87f542'; // Sangre verde ácida

          if (this.theme === 'desert') {
            spikeColor = '#e2e8f0'; // Huesos desérticos puntiagudos
            tipColor = '#dc2626'; // Sangre seca
          } else if (this.theme === 'ocean') {
            spikeColor = '#e76f51'; // Erizos coral/espinas
            tipColor = '#3ae3ff'; // Veneno cian
          } else if (this.theme === 'space') {
            spikeColor = '#06b6d4'; // Pinchos láser de energía
            tipColor = '#ffffff';
          } else if (this.theme === 'volcano') {
            spikeColor = '#dc2626'; // Pinchos de piedra incandescente
            tipColor = '#ffb703';
          }

          ctx.fillStyle = spikeColor;
          ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const px = x + i * 5.3 + 1;
            ctx.moveTo(px, y + this.tileSize);
            ctx.lineTo(px + 2.6, y + 4);
            ctx.lineTo(px + 5.3, y + this.tileSize);
          }
          ctx.fill();
          
          ctx.fillStyle = tipColor;
          for (let i = 0; i < 3; i++) {
            const px = x + i * 5.3 + 2.3;
            ctx.fillRect(Math.floor(px), y + 4, 1.5, 1.5);
          }
        } 
        // --- TILE 5: RESORTES ---
        else if (tile === 5) {
          const spring = this.springs.find(s => s.col === c && s.row === r);
          const isTriggered = spring && spring.triggerFrames > 0;
          
          // Mantener resorte pero usar colores dinámicos según el mundo
          const baseColor = this.theme === 'space' ? '#0891b2' : '#457b9d';
          const coilColor = this.theme === 'volcano' ? '#f97316' : '#e63946';

          ctx.fillStyle = baseColor;
          if (isTriggered) {
            ctx.fillRect(x + 1, y + 10, this.tileSize - 2, 6);
            ctx.fillStyle = coilColor;
            ctx.fillRect(x + 3, y + 8, this.tileSize - 6, 2);
          } else {
            ctx.fillRect(x + 1, y + 12, this.tileSize - 2, 4);
            ctx.fillStyle = coilColor;
            ctx.fillRect(x + 4, y + 6, this.tileSize - 8, 6);
            ctx.fillStyle = '#a8dadc';
            ctx.fillRect(x + 2, y + 3, this.tileSize - 4, 3);
          }
        }
      }
    }

    // Dibujar bellotas doradas flotando
    this.acorns.forEach(a => {
      const floatY = Math.sin(a.hoverAngle) * 2.5;
      const x = a.x;
      const y = a.y + floatY;

      // Bellota dorada retro pixel-art
      ctx.fillStyle = '#ffd700'; // Dorado
      ctx.fillRect(x + 2, y + 4, 6, 6);
      ctx.fillRect(x + 4, y + 2, 2, 2); // Cúpula superior
      
      ctx.fillStyle = '#8b5a2b'; // Tallo marrón
      ctx.fillRect(x + 4, y, 2, 2);

      ctx.fillStyle = '#ffffff'; // Destello brillante pixel
      ctx.fillRect(x + 3, y + 3, 2, 2);
    });

    ctx.restore();
  }

  // Destrucción destructiva del escenario por parte del Boss (WOW Destructible Terrain)
  destroyTileAt(x, y) {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);
    
    // Evitar salir de los límites de la cuadrícula, no destruir la pared absoluta ni el suelo absoluto
    if (col <= 0 || col >= this.cols - 1 || row <= 0 || row >= this.rows - 2) return false;
    
    const tile = this.grid[row][col];
    // Se pueden destruir bloques sólidos, ladrillos, plataformas y trampas de púas (pero no resortes 5 o vacíos 0)
    if (tile === 1 || tile === 2 || tile === 3 || tile === 4) {
      this.grid[row][col] = 0; // Aire
      
      SOUND.playHit(); // Sonido crujido retro
      
      // Detonar escombros visuales
      const blockX = col * this.tileSize + this.tileSize / 2;
      const blockY = row * this.tileSize + this.tileSize / 2;
      
      // Esparcir partículas con colores que simulen el escombro destruido
      let color = '#7c6a58';
      if (tile === 1) color = this.theme === 'desert' ? '#fbbf24' : '#4d372e';
      else if (tile === 2) color = '#1e293b';
      else if (tile === 3) color = '#9c6644';
      else if (tile === 4) color = '#7a7687';
      
      PARTICLES.spawnHeavyImpact(blockX, blockY, 4);
      
      // Crear pequeñas chispas/fragmentos físicos volando
      for (let i = 0; i < 3; i++) {
        PARTICLES.particles.push(
          new Particle(
            blockX, blockY, (Math.random() - 0.5) * 2.5, -Math.random() * 2.5 - 1.0, color, Math.random() * 3.5 + 1.5, 25, 0.18
          )
        );
      }
      return true;
    }
    return false;
  }

  // Regenerar algunas bellotas en oleadas nuevas
  respawnCollectibles() {
    this.acorns = [];
    this.spawnAcornAt(150, 220);
    this.spawnAcornAt(320, 200);
    this.spawnAcornAt(480, 150);
    this.spawnAcornAt(800, 220);
    
    // Bellotas flotantes altas
    this.spawnAcornAt(300, 80);
    this.spawnAcornAt(660, 80);
    this.spawnAcornAt(100, 80);
    this.spawnAcornAt(860, 80);
  }
}
