// Grid dimensions and cell sizing
int cols = 20;
int rows = 20;
int cellSize = 20;

// Player grid position (0 to 19)
int playerX = 10;
int playerY = 10;

void setup() {
  size(cols * cellSize, rows * cellSize); // 400 x 400 canvas
  frameRate(30);
}

void draw() {
  background(240);

  // 1. Draw the 20x20 grid lines
  stroke(210);
  strokeWeight(1);
  for (int i = 0; i <= cols; i++) {
    line(i * cellSize, 0, i * cellSize, height);
  }
  for (int j = 0; j <= rows; j++) {
    line(0, j * cellSize, width, j * cellSize);
  }

  // 2. Draw the little green square
  fill(46, 204, 113); // Emerald green
  stroke(39, 174, 96);
  strokeWeight(2);
  rect(playerX * cellSize + 2, playerY * cellSize + 2, cellSize - 4, cellSize - 4, 3);
}

// 3. Move the square on key press with boundary clamping
void keyPressed() {
  if (keyCode == UP || key == 'w' || key == 'W') {
    if (playerY > 0) playerY--;
  } else if (keyCode == DOWN || key == 's' || key == 'S') {
    if (playerY < rows - 1) playerY++;
  } else if (keyCode == LEFT || key == 'a' || key == 'A') {
    if (playerX > 0) playerX--;
  } else if (keyCode == RIGHT || key == 'd' || key == 'D') {
    if (playerX < cols - 1) playerX++;
  }
}