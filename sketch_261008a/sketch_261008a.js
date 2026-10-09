const CELL = 50, COLS = 12, ROWS = 10;
// Filas: 0 = metas, 1-3 = agua, 4 = zona segura, 5-8 = carretera, 9 = inicio
const SLOT_CENTERS = [60, 180, 300, 420, 540], SLOT_W = 60;
let lanes, frog, slots, lives, state; // state: play | over | win

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
    { row: 1, speed: 1.2,  w: 150, gap: 220, water: true },
    { row: 2, speed: -1.8, w: 100, gap: 200, water: true },
    { row: 3, speed: 1.0,  w: 200, gap: 250, water: true },
    // carretera (autos)
    { row: 5, speed: -2.2, w: 60,  gap: 220, water: false },
    { row: 6, speed: 1.6,  w: 90,  gap: 260, water: false },
    { row: 7, speed: -3.0, w: 50,  gap: 240, water: false },
    { row: 8, speed: 2.0,  w: 70,  gap: 200, water: false },
  ];
  for (const l of lanes) {
    l.items = [];
    const step = l.w + l.gap;
    for (let x = random(0, 80); x < width + step; x += step) l.items.push(x);
  }
  resetFrog();
}

function resetFrog() { frog = { x: 6 * CELL, row: 9 }; }

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
  for (const l of lanes) {
    for (let i = 0; i < l.items.length; i++) {
      l.items[i] += l.speed;
      if (l.speed > 0 && l.items[i] > width) l.items[i] = -l.w;
      if (l.speed < 0 && l.items[i] + l.w < 0) l.items[i] = width;
    }
  }
  const lane = lanes.find(l => l.row === frog.row);
  if (!lane) return;
  const cx = frog.x + CELL / 2;
  if (lane.water) {
    const log = lane.items.find(x => cx >= x && cx <= x + lane.w);
    if (!log && log !== 0) { loseLife(); return; }
    frog.x += lane.speed; // el tronco lo arrastra
    if (frog.x < -CELL / 2 || frog.x > width - CELL / 2) loseLife();
  } else {
    for (const x of lane.items) {
      if (frog.x + 45 > x && frog.x + 5 < x + lane.w) { loseLife(); return; }
    }
  }
}

function draw() {
  background(0);
  if (state === 'play') update();

  // agua
  noStroke(); fill(8, 8, 35); rect(0, CELL, width, CELL * 3);
  // zonas seguras
  fill(25); rect(0, 4 * CELL, width, CELL);
  rect(0, 9 * CELL, width, CELL);
  // fila de metas: muros con 5 puestos libres
  fill(45); rect(0, 0, width, CELL);
  fill(0);
  for (const c of SLOT_CENTERS) rect(c - SLOT_W / 2, 0, SLOT_W, CELL);
  fill(0, 200, 0);
  slots.forEach((f, i) => { if (f) rect(SLOT_CENTERS[i] - 20, 5, 40, 40); });

  // troncos y autos (grises)
  for (const l of lanes) {
    fill(l.water ? 120 : 170);
    for (const x of l.items) rect(x, l.row * CELL + 5, l.w, 40, l.water ? 6 : 2);
  }

  // jugador
  if (state === 'play') { fill(0, 220, 0); rect(frog.x + 5, frog.row * CELL + 5, 40, 40); }

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
