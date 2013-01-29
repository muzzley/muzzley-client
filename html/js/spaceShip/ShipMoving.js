ShipMoving = function(x,y) {


	this.pos = new Vector2(x,y); 
	this.angle = 0; 
	this.vel = new Vector2(0,0); 
	this.temp = new Vector2(0,0); 
	
	this.thrustPower = 0.1; 
	this.rotateSpeed = 1; 

	this.update = function() {
		this.pos.plusEq(this.vel);
		 	
	};
	
	this.thrust = function() {
		
		this.temp.reset(this.thrustPower,0); 

		this.temp.rotate(this.angle); 
		this.vel.plusEq(this.temp); 
	
	};
	
	this.rotateLeft = function() {
		this.angle -= this.rotateSpeed; 
	};
	this.rotateRight = function() {
		this.angle += this.rotateSpeed; 
	};
	
	
	// c = canvas context
	this.draw = function(c) {		
		
		c.save();
		c.translate(this.pos.x, this.pos.y); 
		c.rotate(this.angle * Vector2Const.TO_RADIANS);

		c.strokeStyle = "#fff"; 
		c.lineWidth = 2; 
		
		c.beginPath();
		c.moveTo(-10, -10);
		c.lineTo(-10, 10);
		c.lineTo(14, 0);
		c.closePath(); 
		c.stroke();
		
		c.restore();		

	};


}; 