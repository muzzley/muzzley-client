
function Particle(posx, posy) {
	
	// the position of the particle
	this.pos = new Vector2(posx, posy); 
	 
	// the velocity 
	this.vel = new Vector2(0,0); 
	 

	// multiply the particle size by this every frame
	this.shrink = 1; 
	this.size = 1; 

	// multiply the velocity by this every frame to create
	// drag. A number between 0 and 1, closer to one is 
	// more slippery, closer to 0 is more sticky. values
	// below 0.6 are pretty much stuck :) 
	this.drag = 1; 

	// add this to the yVel every frame to simulate gravity
	this.gravity = 0; 

	// current transparency of the image
	this.alpha = 1; 
	// subtracted from the alpha every frame to make it fade out
	this.fade = 0; 

	this.enabled = true; 
	this.life = 0;
	
	this.reset = function(px, py) {
			// the position of the particle
		this.pos.reset(px, py); 
	
		// the velocity 
		this.vel.reset(0,0); 
	
	
		// multiply the particle size by this every frame
		this.shrink = 1; 
		this.size = 1; 
	
		// multiply the velocity by this every frame to create
		// drag. A number between 0 and 1, closer to one is 
		// more slippery, closer to 0 is more sticky. values
		// below 0.6 are pretty much stuck :) 
		this.drag = 1; 
	
		// add this to the yVel every frame to simulate gravity
		this.gravity = 0; 
	
		// current transparency of the image
		this.alpha = 1; 
		// subtracted from the alpha every frame to make it fade out
		this.fade = 0; 
	
		this.enabled = true; 
		this.life = 0;
	}; 
	
	
	this.update = function() {
	
		// simulate drag
		this.vel.multiplyEq(this.drag); 
		
		// add gravity force to the y velocity 
		this.vel.y += this.gravity; 
		
		// and the velocity to the position
		this.pos.plusEq(this.vel);
		
		// shrink the particle
		this.size *= this.shrink;
		
		// and fade it out
		this.alpha -= this.fade; 
		this.life++; 
		if(this.life>50) this.enabled = false; 
	 
	};
	
	this.render = function(c) {
		// set the fill style to have the right alpha
		c.fillStyle = "rgba(255,255,255,"+this.alpha+")";
		
		// draw a circle of the required size
		c.beginPath();
		c.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI*2, true);
		c.closePath();
		
		
		
		// and fill it
		c.fill();
	
	};


}


function randomRange(min, max) {
	return ((Math.random()*(max-min)) + min); 
}
