const CELL = 50, COLS = 12, ROWS = 11;
// Filas: 0 = metas, 1-3 = agua, 4 = zona segura, 5-8 = carretera, 9 = inicio
const SLOT_CENTERS = [60, 180, 300, 420, 540], SLOT_W = 60;
let lanes, frog, slots, lives, state; // state: play | over | win
let frogImg, lilypadImg, treeImg, car1Img, car2Img, car3Img, car4Img, roadImg, brickImg;

let tick = 0;
const SINK_PERIOD = 400; // duración del ciclo completo (frames)

// 0 = visible del todo, 1 = hundido del todo
function sinkAmount(l) {
  const p = (tick + l.sinkOffset) % SINK_PERIOD;
  if (p < 200) return 0;                  // arriba
  if (p < 260) return (p - 200) / 60;     // hundiéndose
  if (p < 340) return 1;                  // hundido
  return 1 - (p - 340) / 60;              // reapareciendo
}
const logUsable = l => sinkAmount(l) < 0.6; 

function preload() {
  frogImg = loadImage('img/frog.png');
  lilypadImg = loadImage('img/lilypad.png');
  treeImg = loadImage('img/tree.png');
  car1Img = loadImage('img/car1.png');
  car2Img = loadImage('img/car2.png');
  car3Img = loadImage('img/car3.png');
  car4Img = loadImage('img/car4.png');
  roadImg = loadImage('img/road.png');
  brickImg = loadImage('img/brick.png');
}

function setup() {
  createCanvas(COLS * CELL, ROWS * CELL);
  newGame();
}

function newGame() {
  lives = 3;
  slots = [false, false, false, false, false];
  state = 'play';
  lanes = [
    // agua (troncos)
// Agua
{ row: 1, speed: 1.2,  w: CELL, water: true, pattern: [1, 1, 1, 0, 0] },
{ row: 2, speed: -1.8, w: CELL, water: true, pattern: [1, 1, 0, 0, 0, 1, 0], sinkJ: [0, 1], sinkOffset: 0 },
{ row: 3, speed: 1.0,  w: CELL, water: true, pattern: [1, 1, 1, 1, 0, 0] },
{ row: 4, speed: -1.5, w: CELL, water: true, pattern: [0, 1, 1, 0, 0, 0], sinkJ: [1, 2], sinkOffset: 150 },

// Carretera
{ row: 9, speed: -1.2, w: 60,  gap: 400, water: false},
{ row: 6, speed: 1.0,  w: 60, gap: 200, water: false },
{ row: 7, speed: -1.4, w: 60,  gap: 500, water: false },
{ row: 8, speed: 2.0,  w: 60, gap: 400, water: false },
  ];
  for (const l of lanes) {
  l.items = [];
  l.sinkFlags = [];
  if (l.water) {
    const plen = l.pattern.length * CELL;
    // cuántas repeticiones hacen falta para cubrir el canvas + un margen
    const reps = ceil((width + 2 * CELL) / plen);
    l.loopStart = -CELL;
    l.loop = reps * plen;

    const shift = floor(random(l.pattern.length)) * CELL;
    for (let k = 0; k < reps; k++) {
      for (let j = 0; j < l.pattern.length; j++) {
        if (l.pattern[j]) {
          let x = l.loopStart + (k * l.pattern.length + j) * CELL + shift;
          if (x >= l.loopStart + l.loop) x -= l.loop;
          l.items.push(x);
          // solo la primera repetición se hunde → solo 2 troncos por fila
          l.sinkFlags.push(!!l.sinkJ && k === 0 && l.sinkJ.includes(j));
        }
      }
    }
  } else {
    const step = l.w + l.gap;
    for (let x = random(0, 50); x < width + step; x += step) l.items.push(x);
  }
}
  resetFrog();
}

function resetFrog() { frog = { x: 5 * CELL, row: 10 }; }

function loseLife() {
  lives--;
  if (lives <= 0) state = 'over'; else resetFrog();
}

function keyPressed() {
  if (key === ' ') { newGame(); return false; }
  if (state !== 'play') return;
  if (keyCode === UP_ARROW || key === 'w') frog.row = max(0, frog.row - 1);
  else if (keyCode === DOWN_ARROW || key === 's') frog.row = min(ROWS - 1, frog.row + 1);
  else if (keyCode === LEFT_ARROW || key === 'a') frog.x = max(0, frog.x - CELL);
  else if (keyCode === RIGHT_ARROW || key === 'd') frog.x = min(width - CELL, frog.x + CELL);
  else return;
  if (frog.row === 0) checkGoal();
  return false;
}

function checkGoal() {
  const cx = frog.x + CELL / 2;
  const i = SLOT_CENTERS.findIndex(c => abs(cx - c) <= SLOT_W / 2);
  if (i === -1 || slots[i]) { loseLife(); return; } // muro o puesto ocupado
  slots[i] = true;
  if (slots.every(Boolean)) state = 'win'; else resetFrog();
}

function update() {
  tick++;
  // Mover items
  for (const l of lanes) {
    for (let i = 0; i < l.items.length; i++) {
      l.items[i] += l.speed;
      if (l.water) {
        // reciclar manteniendo el patrón
        if (l.items[i] >= l.loopStart + l.loop) l.items[i] -= l.loop;
        if (l.items[i] < l.loopStart) l.items[i] += l.loop;
      } else {
        if (l.speed > 0 && l.items[i] > width) l.items[i] = -l.w;
        if (l.speed < 0 && l.items[i] + l.w < 0) l.items[i] = width;
      }
    }
  }

  // Colisiones
  const lane = lanes.find(l => l.row === frog.row);
  if (!lane) return;

if (lane.water) {
  const cx = frog.x + CELL / 2;
  const EPS = 0.5; // tolerancia por errores de decimales entre troncos pegados
  const onLog = lane.items.some((x, i) =>
  cx >= x - EPS && cx <= x + lane.w + EPS &&
  (!lane.sinkFlags[i] || logUsable(lane))
);
  if (!onLog) { loseLife(); return; }
  frog.x += lane.speed; // el tronco lo arrastra
  if (frog.x < -CELL / 2 || frog.x > width - CELL / 2) loseLife();
  } else {
    const PAD =10;
    for (const x of lane.items) {
      if (frog.x + 45 > x + PAD && frog.x + 5 < x + lane.w - PAD) { loseLife(); return; }
    }
  }
}

function draw() {
  for (const l of lanes) {
  if (!l.water) {
    for (let col = 0; col < COLS; col++) {
      image(roadImg, col * CELL, l.row * CELL, CELL, CELL);
    }
  }
}
  if (state === 'play') update();

  // agua
  noStroke(); fill(142, 216, 250); rect(0, CELL, width, CELL * 4);
  // zonas seguras
  for (let col = 0; col < COLS; col++) {
  image(brickImg, col * CELL, 5 * CELL, CELL, CELL);
  image(brickImg, col * CELL, 10 * CELL, CELL, CELL);
}

  // fila de metas: muros con 5 puestos libres
// fila de metas: Lily pads
fill(142, 216, 252);
rect(0, 0, width, CELL);

for (let i = 0; i < SLOT_CENTERS.length; i++) {
  image(lilypadImg, SLOT_CENTERS[i] - SLOT_W / 2, 0, SLOT_W, CELL);

  if (slots[i]) {
    image(frogImg, SLOT_CENTERS[i] - 20, 5, 40, 40);
  }
}
  // troncos y autos (grises)
// Troncos con textura y autos
// Troncos con textura y carros con textura

for (const l of lanes) {
  for (let i = 0; i < l.items.length; i++) {
    const x = l.items[i];
    if (l.water) {
      const y = l.row * CELL;
      if (l.sinkFlags[i]) {
        const a = sinkAmount(l);
        const s = 1 - 0.3 * a; // se encoge al hundirse
        push();
        tint(255, 255 * (1 - a)); // se vuelve transparente
        image(treeImg, x + (CELL * (1 - s)) / 2, y + (CELL * (1 - s)) / 2, CELL * s, CELL * s);
        pop();
        // ondas de agua cuando está hundiéndose
        if (a > 0.3) {
          noFill(); stroke(255, 255 * a); strokeWeight(2);
          ellipse(x + CELL / 2, y + CELL / 2, 30 * a, 18 * a);
          noStroke();
        }
      } else {
        image(treeImg, x, y, CELL, CELL);
      }
    }  else {
      let carImg;
      if (l.row === 8){
         image(car1Img,x,l.row * CELL + (CELL - 80) / 2, l.w, l.w);
      } else if (l.row === 7) {
         image(car2Img,x,l.row * CELL + (CELL - 60) / 2,l.w, l.w-20);
      } else if (l.row === 6) {
         image(car3Img,x,l.row * CELL + (CELL - 65) / 2,l.w, l.w-15);
      } else {
         image(car4Img,x,l.row * CELL + (CELL - 70) / 2,l.w, l.w-10);
      }
  

    }
  }
}

  // jugador
  if (state === 'play') {
  image(frogImg, frog.x + 5, frog.row * CELL + 5, 40, 40);
}

  // HUD
  fill(200); textSize(14); textAlign(LEFT, TOP);
  text('Vidas: ' + lives + '   Puestos: ' + slots.filter(Boolean).length + '/5', 6, height - 16);

  if (state !== 'play') {
    fill(0, 0, 0, 190); rect(0, 0, width, height);
    fill(255); textAlign(CENTER, CENTER); textSize(32);
    text(state === 'win' ? '¡Nivel 1 completado!' : 'Game over', width / 2, height / 2 - 15);
    textSize(16); text('Pulsa ESPACIO para jugar de nuevo', width / 2, height / 2 + 25);
  }
}
