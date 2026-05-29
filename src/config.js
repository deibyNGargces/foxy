// CONFIGURACIÓN GLOBAL DEL JUEGO FOXY VS ZOMBIES (ACTUALIZADO MULTIMUNDO Y GOBLIN BOSS)

export const CONFIG = {
  // Dimensiones lógicas del juego (resolución retro pixel-art)
  VIEW_WIDTH: 640,
  VIEW_HEIGHT: 360,

  // Físicas globales por defecto
  GRAVITY: 0.45,
  FRICTION: 0.85,
  AIR_RESISTANCE: 0.98,

  // Temas de Mundos y Físicas Adaptativas
  WORLD_ORDER: ['forest', 'desert', 'city', 'farm', 'ocean', 'space', 'volcano'],
  WORLDS: {
    forest: {
      NAME: 'Bosque Nocturno',
      GRAVITY: 0.45,
      AIR_RESISTANCE: 0.98,
      PARTICLES: 'dust',
      SKY_COLOR_TOP: '#0a0915',
      SKY_COLOR_MID: '#1b1424',
      SKY_COLOR_BTM: '#2c1930',
      FOG_COLOR: '#24e88e', // Niebla verde tóxica
      FOG_OPACITY: 0.15
    },
    desert: {
      NAME: 'Desierto de Huesos',
      GRAVITY: 0.43,
      AIR_RESISTANCE: 0.98,
      PARTICLES: 'sand',
      SKY_COLOR_TOP: '#2b1b11', // Atardecer rojizo
      SKY_COLOR_MID: '#d97706', // Naranja desierto
      SKY_COLOR_BTM: '#f59e0b',
      FOG_COLOR: '#d97706', // Bruma de arena naranja
      FOG_OPACITY: 0.20
    },
    city: {
      NAME: 'Ciudad en Ruinas',
      GRAVITY: 0.45,
      AIR_RESISTANCE: 0.98,
      PARTICLES: 'smog',
      SKY_COLOR_TOP: '#0f172a', // Gris cemento / lluvia
      SKY_COLOR_MID: '#1e293b', 
      SKY_COLOR_BTM: '#334155',
      FOG_COLOR: '#64748b', // Esmog grisáceo
      FOG_OPACITY: 0.22
    },
    farm: {
      NAME: 'Campo de Cultivos',
      GRAVITY: 0.45,
      AIR_RESISTANCE: 0.98,
      PARTICLES: 'hay',
      SKY_COLOR_TOP: '#1a1005', // Noche rústica dorada
      SKY_COLOR_MID: '#2d1e08',
      SKY_COLOR_BTM: '#451a03',
      FOG_COLOR: '#d97706', // Resplandor dorado de espigas
      FOG_OPACITY: 0.12
    },
    ocean: {
      NAME: 'Océano Abisal',
      // FÍSICA DE AGUA: Gravedad muy baja y alta resistencia (Natación)
      GRAVITY: 0.14,
      AIR_RESISTANCE: 0.90, // Freno de inercia por agua
      PARTICLES: 'bubbles',
      SKY_COLOR_TOP: '#081c15', // Azul profundo marino
      SKY_COLOR_MID: '#0b3c5d',
      SKY_COLOR_BTM: '#328cc1',
      FOG_COLOR: '#328cc1', // Niebla subacuática azulada
      FOG_OPACITY: 0.30
    },
    space: {
      NAME: 'Espacio Cósmico',
      // FÍSICA ESPACIAL: Gravedad de Luna, saltos gigantes flotantes
      GRAVITY: 0.11,
      AIR_RESISTANCE: 0.99, // Casi sin arrastre
      PARTICLES: 'stars',
      SKY_COLOR_TOP: '#020205', // Espacio negro cósmico
      SKY_COLOR_MID: '#050c1e',
      SKY_COLOR_BTM: '#0c1b40',
      FOG_COLOR: '#3ae3ff', // Aura nebulosa cian
      FOG_OPACITY: 0.15
    },
    volcano: {
      NAME: 'Cueva Volcánica',
      GRAVITY: 0.48, // Gravedad pesada
      AIR_RESISTANCE: 0.97,
      PARTICLES: 'ashes',
      SKY_COLOR_TOP: '#0f0505', // Brasa infernal
      SKY_COLOR_MID: '#2d0a0a',
      SKY_COLOR_BTM: '#5a0f0f',
      FOG_COLOR: '#ea580c', // Resplandor de magma ardiente
      FOG_OPACITY: 0.25
    }
  },

  // Propiedades del jugador (Foxy)
  PLAYER: {
    WIDTH: 24,
    HEIGHT: 32,
    CROUCH_HEIGHT: 18,
    WALK_SPEED: 2.2,
    RUN_SPEED: 3.8,
    SLIDE_SPEED: 5.5,
    SLIDE_DECAY: 0.94,
    ACCEL: 0.25,
    JUMP_FORCE: -7.0,
    DOUBLE_JUMP_FORCE: -6.0,
    WALL_SLIDE_SPEED: 0.8,
    WALL_JUMP_X: 4.5,
    WALL_JUMP_Y: -6.0,
    MAX_HEALTH: 100,
    IFRAMES: 60, // Cuadros de invulnerabilidad tras recibir daño
    SHOOT_COOLDOWN: 15, // Cuadros entre disparos
    BASE_DAMAGE: 15,
  },

  // Propiedades de proyectiles del zorro
  PROJECTILE: {
    SPEED: 6.5,
    SIZE: 6,
    COLOR: '#3ae3ff', // Azul espiritual
    SPAWN_OFFSET_X: 12,
    SPAWN_OFFSET_Y: -4,
  },

  // Tipos de Zombies
  ZOMBIES: {
    COMMON: {
      NAME: 'Zombie Común',
      SPEED: 0.8,
      MAX_HEALTH: 30,
      DAMAGE: 10,
      SCORE: 100,
      MONEY: 10,
      COLOR: '#5a8f5d',
      EYES_COLOR: '#ffff33', // Amarillo
      SIZE_X: 20,
      SIZE_Y: 32,
    },
    // Nuevas propiedades para zombie común equipado con armas
    ARMED: {
      PROBABILITY_START_WAVE: 4, // Comienza a aparecer después del nivel 3 (Nivel 4+)
      PROBABILITY: 0.20, // 20% de que un común aparezca armado (más fácil)
      SHOOT_COOLDOWN: 160, // Disparan menos seguido (más fácil)
      BULLET_SPEED: 1.8, // Balas lentas y fáciles de esquivar
      BULLET_DAMAGE: 4, // Daño rebajado a la mitad
    },
    KAMIKAZE: {
      NAME: 'Zombie Inmolador',
      SPEED: 2.3, // Muy veloz
      MAX_HEALTH: 20, // Poca vida para que sea posible matarlo a distancia
      DAMAGE: 30, // Daño masivo por autoinmolación
      SCORE: 180,
      MONEY: 20,
      COLOR: '#b91c1c', // Rojo sangre / dinamita
      EYES_COLOR: '#facc15', // Chispa brillante mecha
      SIZE_X: 18,
      SIZE_Y: 28,
    },
    RUNNER: {
      NAME: 'Zombie Corredor',
      SPEED: 1.8,
      MAX_HEALTH: 20,
      DAMAGE: 12,
      SCORE: 150,
      MONEY: 15,
      COLOR: '#85598f',
      EYES_COLOR: '#ff3333', // Rojo rabioso
      SIZE_X: 20,
      SIZE_Y: 32,
    },
    SPITTER: {
      NAME: 'Escupidor Ácido',
      SPEED: 0.6,
      MAX_HEALTH: 25,
      DAMAGE: 8,
      SCORE: 200,
      MONEY: 20,
      COLOR: '#788f4c',
      EYES_COLOR: '#33ff33', // Verde brillante
      SIZE_X: 20,
      SIZE_Y: 32,
      SHOOT_COOLDOWN: 120, // Cuadros entre escupidas
      SPIT_SPEED: 4.0,
      SPIT_SIZE: 5,
    },
    BOSS: {
      NAME: 'Zombie Titán',
      SPEED: 0.65,
      MAX_HEALTH: 450, // Más duro (antes 300)
      DAMAGE: 35, // Más rudo (antes 25)
      SCORE: 1000,
      MONEY: 100,
      COLOR: '#3d4d40',
      EYES_COLOR: '#ff33ff', // Púrpura místico
      SIZE_X: 40,
      SIZE_Y: 64,
      THROW_COOLDOWN: 180, // Lanza piedras
      ROCK_SPEED_X: 3.5, // Corregido: Lanzamiento frontal hacia adelante
      ROCK_SPEED_Y: -5.0,
    },
    // JEFE DE FIN DE OLEADA: EL GOBLIN GIGANTE
    GOBLIN: {
      NAME: 'Jefe Goblin Colosal',
      SPEED: 0.85,
      BASE_HEALTH: 200, // Más duro (antes 140)
      HEALTH_SCALE: 120, // Mayor escalado por oleada (antes 80)
      DAMAGE: 25, // Más rudo (antes 16)
      SCORE: 1500,
      MONEY: 120,
      COLOR: '#2b9348', // Verde duende brillante
      EYES_COLOR: '#ff0055', // Fucsia neón
      SIZE_X: 42,
      SIZE_Y: 60,
      SHOOT_COOLDOWN: 100,
      BOMB_SPEED_X: 2.8, // Corregido: Lanzamiento frontal hacia adelante (hacia Foxy!)
      BOMB_SPEED_Y: -4.5
    }
  },

  // Configuración de la tienda de mejoras
  UPGRADES: {
    HEALTH: {
      NAME: 'Vida Máxima (+25)',
      BASE_COST: 50,
      COST_MULTIPLIER: 1.5,
      MAX_LEVEL: 5,
    },
    DAMAGE: {
      NAME: 'Fuerza Espiritual (+5 Daño)',
      BASE_COST: 60,
      COST_MULTIPLIER: 1.6,
      MAX_LEVEL: 5,
    },
    SPEED: {
      NAME: 'Velocidad Ninja (+15%)',
      BASE_COST: 40,
      COST_MULTIPLIER: 1.4,
      MAX_LEVEL: 3,
    },
    FIRE_RATE: {
      NAME: 'Cadencia de Fuego (+20%)',
      BASE_COST: 70,
      COST_MULTIPLIER: 1.7,
      MAX_LEVEL: 5,
    },
    TRIPLE_SHOT: {
      NAME: 'Disparo Triple Místico',
      BASE_COST: 200,
      COST_MULTIPLIER: 1,
      MAX_LEVEL: 1,
    }
  },

  // Configuración de la Oleada
  WAVES: {
    SPAWN_INTERVAL: 180, // Cuadros entre spawns (va bajando con el nivel de oleada)
    MIN_SPAWN_INTERVAL: 60,
  }
};
