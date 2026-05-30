# CLAUDE.md — Foxy vs Zombies

Contexto persistente del proyecto para futuras sesiones de Claude Code. Léelo antes de modificar código.

---

## 1. Resumen del proyecto

**Foxy vs Zombies** es un juego web retro pixel-art (8-bit) de plataformas + supervivencia por oleadas. El jugador controla un zorro ninja con habilidades acrobáticas (doble salto, slide, wall-jump) y lanza orbes de fuego espiritual contra hordas de zombies a través de 7 mundos secuenciales con físicas adaptativas.

- **Stack**: Vite 6 + JavaScript ESM nativo + HTML5 Canvas. **Sin frameworks ni motores de juego**.
- **Resolución lógica**: 640×360 (escalada por CSS dentro del gabinete arcade).
- **Target**: 60 FPS en navegador moderno.
- **Idioma del producto**: español (UI, textos, comentarios en código).

---

## 2. Scripts npm

```bash
npm install     # Instala Vite
npm run dev     # Dev server con HMR (http://localhost:5173)
npm run build   # Build de producción → /dist
npm run preview # Sirve /dist localmente
```

Requiere Node.js 18+. **No hay tests** ni linter configurados.

---

## 3. Estructura

```
foxy/
├── index.html              # Shell HTML con todos los overlays (HUD, shop, game-over, pause, boss alert)
├── package.json            # Vite como única dependencia
├── public/                 # favicon.svg, icons.svg (servidos en raíz)
└── src/
    ├── main.js             # Entry point → GAME.init('game-canvas')
    ├── config.js           # CONFIG global — única fuente de verdad para tuning
    ├── game.js             # Motor central (state machine, loop, colisiones, oleadas)
    ├── player.js           # Clase Player (Foxy)
    ├── zombie.js           # Clase Zombie (7 variantes por type)
    ├── map.js              # GameMap — grid de tiles + acorns + springs
    ├── particles.js        # Particle + PARTICLES (singleton)
    ├── projectile.js       # Projectile (7 tipos: player, acid, rock, rock_debris, zombie_bullet, goblin_bomb, goblin_fire_debris)
    ├── sound.js            # SOUND (WebAudio singleton — chiptune procedural)
    ├── style.css           # CRT, HUD, shop, menus, neón
    ├── counter.js          # Boilerplate Vite, NO usado en el juego
    └── assets/             # hero.png + svgs de Vite (no usados)
```

---

## 4. Arquitectura

### State machine principal (`GAME.state`)
`START_SCREEN → PLAYING → UPGRADE_SHOP → PLAYING → ... → GAME_OVER`. `PAUSED` se monta encima de `PLAYING`.

### Loop por frame (`GAME.update()`)
1. Spawn de zombies según `WAVES.SPAWN_INTERVAL` decreciente por oleada.
2. Trigger de boss phase cuando se eliminan todos los zombies regulares (timer 110f + alerta visual).
3. Update de player → zombies → projectiles → particles → map.
4. Colisiones AABB: `player↔zombies`, `player↔projectiles enemigos`, `projectiles del jugador↔zombies`, `player↔acorns/springs`.
5. Decay de combo (180f) y damping de cámara (`cameraX` lerp 8%).
6. Transición a `UPGRADE_SHOP` si todos los zombies murieron, o a `GAME_OVER` si `player.health ≤ 0`.

### Mundos y físicas adaptativas — **patrón clave**
`CONFIG.GRAVITY` y `CONFIG.AIR_RESISTANCE` se **mutan globalmente** al iniciar cada oleada según `CONFIG.WORLDS[theme]`. Player y Zombie leen estos valores en cada frame, así que no hay branching por mundo — el comportamiento emerge de la física. Mundos: `forest, desert, city, farm, ocean, space, volcano` (en orden, ciclados por `wave % WORLD_ORDER.length`).

Casos extremos:
- **Ocean**: gravedad 0.14 + air_resistance 0.90 → natación.
- **Space**: gravedad 0.11 + air_resistance 0.99 → saltos lunares.
- **Volcano**: gravedad 0.48 → caídas pesadas.

### Combo system
Cada hit de proyectil del jugador sobre un zombie incrementa `comboCount` y resetea `comboTimer` a 180f. Score por kill = `25 × min(5, comboCount)`. Se rompe si: el timer llega a 0, o el jugador recibe daño.

### Persistencia (localStorage)
- `foxy_high_score` — récord histórico.
- `foxy_save_progress` — `{ wave, money, score, upgrades, zombiesSlain }`. Se guarda al completar cada oleada. "CONTINUAR PARTIDA" en el menú restaura este estado.

---

## 5. Entidades — referencia rápida

### Player (`src/player.js`)
- Estados: `idle, run, jump, crouch, slide, wall-slide, hurt`.
- `iframeTimer` ~15f tras recibir daño (knockback ±3px/s + partículas de sangre).
- Upgrades aplicados como multiplicadores: vida +25/lvl, daño +5/lvl, velocidad ×(1+0.15·lvl), cadencia ×(1−0.20·lvl) con piso de 5f, `tripleShot` boolean.
- Bufanda: 7 segmentos con rope simulation (puramente visual).

### Zombie (`src/zombie.js`)
| Tipo | Spawn desde | Comportamiento |
|------|------------|----------------|
| `common` | wave 1 | Lento, melee. 40% de ellos tienen ×0.55 velocidad. |
| `armed` (variante de common) | wave ≥ 4 | 20-35% de los common llevan rifle (bala plasma verde, 35 dmg). |
| `runner` | wave ≥ 3 | Rápido, melee agresivo. |
| `spitter` | wave ≥ 4 | Estático/lento, escupe ácido cada 120f. |
| `kamikaze` | wave ≥ 2 | Veloz, detona 8 fragmentos al morir o al contacto. |
| `boss` (Titán) | cada 5 oleadas (slot final del pool) | Lanza rocas con gravedad → spawn `rock_debris`. |
| `goblin` (Jefe de oleada) | fin de cada oleada | Bombas parabólicas con trail de fuego. |

**Scaling por oleada**: HP ×(1+(wave−1)·0.20), DMG ×(1+(wave−1)·0.12). Bosses/goblin usan factor 0.35/0.20.

**Bonus de mundo**: ocean +30% HP, desert ×1.25 speed, city +3 dmg, volcano +4 dmg.

### Map (`src/map.js`)
- Grid 60×23 tiles de 16px → 960×368 mundo. Tipos: `0=vacío, 1=suelo, 2=pared, 3=plataforma, 4=spike, 5=spring`.
- Layout fijo procedural (mismo arena para todos los mundos), simétrico izq/der.
- 8 acorns por mundo (hover + recolección → +50 money y partículas doradas).
- El tema (`theme`) afecta parallax de fondo y partículas ambientales, no la geometría.

### Particles (`src/particles.js`)
Singleton `PARTICLES`. Presets: `spawnDust`, `spawnSpiritualTrail` (azul neón del orbe del jugador), `spawnZombieBlood`, `spawnGoldSparkle`, `spawnAmbientParticles(theme, cameraX)` (hojas, arena, burbujas, estrellas, cenizas, etc.).

### Projectile (`src/projectile.js`)
7 tipos diferenciados por gravity/friction/color/trail. El proyectil del jugador tiene gravity 0 (línea recta); los enemigos usan arcos parabólicos.

### Sound (`src/sound.js`)
Singleton `SOUND` con WebAudio. Música procedural: bassline 16-step en La menor + melodía 32-step a 150 BPM. SFX sintetizados (square/triangle waves con decay). Lazy-init en el primer play. Mute global toggleable.

---

## 6. Tuning — todo vive en `src/config.js`

**Cambiar valores siempre por aquí**, no hardcodear en módulos. Secciones:
- `VIEW_WIDTH/HEIGHT`, `GRAVITY/FRICTION/AIR_RESISTANCE` (defaults)
- `WORLDS` — 7 entradas con física y paleta
- `PLAYER` — dimensiones, velocidades, jump force, cooldown, daño base
- `PROJECTILE` — orbe del zorro
- `ZOMBIES` — stats por tipo (COMMON, ARMED, KAMIKAZE, RUNNER, SPITTER, BOSS, GOBLIN)
- `UPGRADES` — `BASE_COST`, `COST_MULTIPLIER`, `MAX_LEVEL` por upgrade
- `WAVES` — intervalos de spawn

---

## 7. Convenciones y gotchas

- **Idioma**: todo el código y los textos están en español. Mantenerlo.
- **No usar emojis en código** salvo en strings de UI ya existentes (🌰 bellotas, 🦊 favicon, etc.).
- **Pixel rendering**: el canvas usa `image-rendering: pixelated`. No habilitar smoothing.
- **`counter.js` es boilerplate de Vite no usado** — no lo importes ni lo borres por ahora (no estorba).
- **Cooldowns y timers se miden en frames**, no en milisegundos (asume 60 FPS).
- **`CONFIG.GRAVITY` se muta en runtime** al cambiar de mundo. No confiar en su valor inicial fuera del primer frame.
- **El layout del arena es el mismo en todos los mundos** — solo cambia el tema visual y la física. Si añades mundos, replica esta convención salvo decisión explícita en contra.
- **Coordenadas del jugador**: spawn en `(150, 200)` al iniciar partida.
- **No hay sistema de audio para BGM por mundo** — la música es una sola loop procedural.

---

## 8. Tareas comunes — dónde tocar

| Quiero... | Edita |
|-----------|-------|
| Cambiar balance (HP, daño, velocidad, costos) | `src/config.js` |
| Añadir un mundo nuevo | `config.js → WORLDS + WORLD_ORDER`, opcional preset en `particles.js → spawnAmbientParticles` |
| Añadir un tipo de zombie | `config.js → ZOMBIES`, `zombie.js` (nuevo case en update/render), `game.js → spawnZombie` (umbral de oleada) |
| Añadir un upgrade | `config.js → UPGRADES`, `index.html` (card en `#shop-screen`), `game.js → buyUpgrade`, `player.js` (aplicar efecto) |
| Cambiar UI/HUD | `index.html` + `src/style.css` |
| Añadir SFX | `src/sound.js` (define método, llámalo desde el evento) |
| Cambiar layout del arena | `src/map.js → generateArena` |

---

## 9. Cosas que NO existen todavía (no asumir)

- No hay tests automatizados.
- No hay TypeScript — JS plano.
- No hay CI/CD.
- No hay sistema de logros ni de skins.
- No hay multiplayer.
- El proyecto **no es un repo git** todavía (verificar con `git status` antes de asumir).

**Soporte móvil/touch (añadido):** el juego es responsive y jugable en móvil en landscape.
- Detección de dispositivo táctil en `game.js → setupTouchControls()` → añade clase `body.touch-device`.
- Mandos en pantalla en `index.html` (`#touch-controls`): D-pad (◀▶), saltar (▲), agacharse (▼), disparar (🔥, auto-fire mientras se mantiene vía `this.touchShooting` releído cada frame en `update()`), sprint (» toggle de `ShiftLeft`) y pausa flotante (`#touch-pause`). Mapean al mismo `this.keys` que el teclado.
- Solo visibles durante `PLAYING` (toggle de `.hidden` en `loadState` y `togglePause`).
- CSS responsive en `style.css`: media query `(max-width: 1024px), (pointer: coarse)` escala `#game-container` a 16:9 con `min(100vw, 177.78vh)` / `min(56.25vw, 100vh)`. Aviso `#rotate-device-overlay` en `(orientation: portrait)` pide girar el dispositivo.
