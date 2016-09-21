// Animation loop for the Particle Effects
loop();
function loop(){
  for(var i = 0; i < particles.length; i++){
    var p = particles[i];
    p.move();
  }
  requestAnimationFrame(loop);
}
