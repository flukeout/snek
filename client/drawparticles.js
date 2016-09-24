// Animation loop for the Particle Effects
drawParticles();

function drawParticles(){
  for(var i = 0; i < particles.length; i++){
    var p = particles[i];
    p.move();
  }
  requestAnimationFrame(drawParticles);
}
