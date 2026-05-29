# 🦊 Foxy vs Zombies - Retro Ninja Platformer

¡Bienvenido a **Foxy vs Zombies**! Un emocionante juego web retro de plataformas y supervivencia en pixel-art de 8 bits. Toma el control de un zorro ninja místico con increíbles habilidades acrobáticas y mágicas, y sobrevive a oleadas implacables de diversas clases de zombies a través de múltiples mundos dinámicos, cada uno con físicas y atmósferas adaptativas únicas.

El proyecto está construido sobre una arquitectura moderna y rápida utilizando **Vite** y **JavaScript moderno (ESM)** en el navegador mediante el elemento HTML5 **Canvas**, sin depender de motores externos pesados, lo que permite un rendimiento óptimo de 60 FPS con un estilo visual nostálgico.

---

## 🎮 Características Principales

*   **Físicas Adaptativas y Multimundo**: Experimenta 7 mundos temáticos diferentes, cada uno con su propio sistema de gravedad, resistencia al aire, clima, partículas ambientales y paletas de colores únicas (por ejemplo, flotar y nadar bajo el agua en el océano abisal o saltos gigantes en la gravedad lunar del espacio cósmico).
*   **Controles Acrobáticos Premium**: Movimientos fluidos y avanzados como doble salto, deslizamiento por el suelo (`slide`), agachado, deslizamiento por paredes (`wall-slide`) y rebote en paredes (`wall-jump`).
*   **Sistema de Combate Místico**: Lanza orbes de fuego espiritual azul para derrotar a los zombies.
*   **Tienda Ninja (Upgrade Shop)**: Entre oleadas, gasta las bellotas doradas recolectadas para mejorar tus estadísticas de vida máxima, daño espiritual, velocidad ninja, cadencia de fuego y desbloquear el poderoso **Disparo Triple Místico**.
*   **Variedad de Enemigos**: Enfrenta 6 tipos de enemigos con comportamientos, ataques a distancia, auto-inmolaciones y proyectiles inteligentes propios.
*   **Efecto de Pantalla CRT**: Filtro estético de simulación de monitor CRT clásico para dar una vibra de máquina arcade retro de los años 80/90.
*   **Sistema de Combos y Récords**: Multiplica tu puntuación encadenando eliminaciones consecutivas antes de que se agote la barra de combo y compite por batir tu propio récord almacenado localmente.

---

## 🗺️ Los Mundos y sus Físicas

El juego transcurre a lo largo de un viaje a través de **7 mundos secuenciales** (se avanza al completar cada oleada):

1.  **Bosque Nocturno (`forest`)**: Gravedad normal. Cubierto por una niebla tóxica verde brillante y partículas de polvo en suspensión.
2.  **Desierto de Huesos (`desert`)**: Gravedad ligeramente reducida. Envuelto en tormentas de arena naranja y partículas de polvo dorado.
3.  **Ciudad en Ruinas (`city`)**: Gravedad normal. Cubierto por smog industrial grisáceo y partículas de lluvia/niebla ácida.
4.  **Campo de Cultivos (`farm`)**: Gravedad normal. Un ambiente nocturno rústico cubierto por niebla dorada y partículas de paja flotantes.
5.  **Océano Abisal (`ocean`)**: **¡Física subacuática!** Gravedad extremadamente baja (natación/flotabilidad) y alta resistencia al aire/agua que frena la inercia. Lleno de partículas de burbujas en ascenso.
6.  **Espacio Cósmico (`space`)**: **¡Física gravitacional reducida!** Gravedad ultra baja inspirada en la luna. Saltos flotantes gigantescos con casi nula resistencia del aire. Lleno de estrellas fugaces de fondo.
7.  **Cueva Volcánica (`volcano`)**: Gravedad pesada que te atrae rápidamente hacia el suelo. Aire cargado con chispas, cenizas incandescentes y un brillo de magma ardiente de fondo.

---

## 🧟 Hordas de Zombies

*   **Zombie Común**: Avanza lentamente pero en grandes números. En oleadas avanzadas, algunos pueden aparecer armados disparando municiones lentas.
*   **Zombie Inmolador (Kamikaze)**: De color rojo brillante. Corre velozmente hacia el jugador para autodestruirse y causar un daño masivo por explosión.
*   **Zombie Corredor**: Muy ágil y agresivo. Te perseguirá incansablemente a gran velocidad.
*   **Escupidor Ácido**: Permanece a distancia y te lanza bolas ácidas de color verde brillante que debes esquivar o destruir.
*   **Zombie Titán (Mini-Boss)**: Un coloso gigante de gran resistencia física que lanza rocas parabólicas gigantes hacia la posición del zorro ninja.
*   **Jefe Goblin Colosal (Gran Jefe)**: El jefe final definitivo que aparece al final de cada oleada. Posee una gran barra de salud que escala con la dificultad y lanza bombas explosivas dirigidas directamente a la posición de Foxy.

---

## ⌨️ Controles del Juego

Puedes manejar al zorro ninja usando los siguientes controles de teclado y ratón:

*   **Moverse a la Izquierda / Derecha**: Teclas `A` / `D` (o Flechas Izquierda / Derecha)
*   **Saltar / Doble Salto**: Teclas `W` / `Espacio` (o Flecha Arriba)
*   **Agacharse**: Mantener pulsada la tecla `S` (o Flecha Abajo)
*   **Deslizarse (Slide)**: Pulsa `S` (o Flecha Abajo) mientras corres a alta velocidad.
*   **Correr (Sprint)**: Mantener presionada la tecla `SHIFT` (Mayús) izquierda.
*   **Rebotar en la Pared (Wall Jump)**: Salta contra una pared, mantén presionada la dirección hacia la pared para deslizarte, y presiona `W` o `Espacio` para impulsarte en la dirección contraria.
*   **Lanzar Fuego Espiritual (Atacar)**: **Clic Izquierdo del Ratón** o la tecla `J`.
*   **Pausar el Juego**: Tecla `ESC` o `P`.

---

## 🚀 ¿Cómo se Ejecuta el Proyecto?

Este proyecto utiliza **Node.js** y **npm** (Node Package Manager) junto con **Vite** para compilar y servir la aplicación de forma rápida.

Sigue estos sencillos pasos para instalar y ejecutar el juego de forma local:

### 1. Requisitos Previos

Asegúrate de tener instalado **Node.js** en tu sistema (versión 18 o superior recomendada). Puedes descargarlo desde [nodejs.org](https://nodejs.org/).

### 2. Instalación de Dependencias

Abre una terminal o línea de comandos en la carpeta raíz del proyecto (`c:\Users\deiby\Documents\SOFIA GAMES\FOXY`) y ejecuta el siguiente comando para descargar e instalar los paquetes de desarrollo necesarios (principalmente Vite):

```bash
npm install
```

### 3. Ejecutar en Modo Desarrollo (Local)

Para iniciar el servidor local de desarrollo con recarga en tiempo real, ejecuta:

```bash
npm run dev
```

Una vez que termine, la consola te mostrará una dirección de red local (típicamente `http://localhost:5173`). Abre esa URL en tu navegador web preferido y el juego se iniciará de inmediato con el rendimiento nativo más fluido.

### 4. Compilar para Producción (Build)

Si deseas empaquetar el juego optimizado, minificado y listo para producción (para subirlo a un hosting como GitHub Pages, Vercel, Netlify, etc.), ejecuta el comando:

```bash
npm run build
```

Este proceso generará una carpeta llamada `/dist` en la raíz del proyecto, la cual contendrá todos los archivos HTML, CSS y JS optimizados listos para ser desplegados en cualquier servidor web estático.

### 5. Previsualizar la Compilación de Producción

Si deseas probar localmente la versión ya compilada y optimizada para asegurarte de que todo funcione perfectamente antes de subirlo a internet:

```bash
npm run preview
```

Este comando iniciará un servidor local rápido sirviendo los archivos desde la carpeta `/dist`.

---

## 🛠️ Tecnologías Utilizadas

*   **HTML5 Canvas**: Utilizado para renderizar los sprites, partículas, mapas de plataformas y efectos en tiempo real a alta velocidad.
*   **JavaScript (ES6+ Modules)**: Lógica estructurada en módulos limpios y desacoplados (`game.js`, `player.js`, `zombie.js`, `map.js`, `particles.js`, `projectile.js`, `sound.js`, `config.js`).
*   **CSS3 Avanzado**: Estilizado del gabinete del arcade retro con efectos dinámicos de parpadeo neón, transiciones de pantalla fluida y la máscara del filtro CRT usando gradientes de barrido lineal y animaciones dinámicas.
*   **Google Fonts**: Tipografías clásicas *Press Start 2P* y *Rajdhani* para crear la experiencia de interfaz de usuario de las antiguas máquinas recreativas.
