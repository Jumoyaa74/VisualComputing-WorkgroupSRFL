function setup() {
  createCanvas(680, 480, WEBGL);
  
  perspective()
}
function draw(){
  background(128);
  orbit
  
  for(let i=0; i<6; i++){
    push();
    //translate(75*i,sin(framecount / 30) * 50 * i ,0)
    translate(75, 0, 0)
    box(50);
    pop()
  }
}

function keyPressed(){
  if (key === "1") {
    ortho() }
    else if (key === "2") {
      perspective()}
}      
