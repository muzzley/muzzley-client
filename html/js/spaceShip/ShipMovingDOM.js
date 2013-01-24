ShipMoving = function(x,y) {


	this.pos = new Vector2(x,y); 
	this.angle = 0; 
	this.vel = new Vector2(0,0); 
	this.temp = new Vector2(0,0); 
	
	this.thrustPower = 0.1; 
	this.rotateSpeed = 4; 
	
	this.thrustSize = 0; 
	
	this.canvas = document.createElement("canvas"); 
	var canvas = this.canvas; 
	canvas.width = 60; 
	canvas.height = 60;
	canvas.style = "display:block; position:absolute; background-color:'#ff0000';"; 
	canvas.style.webkitTransformOrigin = canvas.style.MozTransformOrigin = canvas.style.OTransformOrigin = canvas.style.transformOrigin = "30px 30px"; 
	
	var c = canvas.getContext( '2d' );
	this.c = c;  
	 
	var counter = 0; 

	this.update = function() {
		this.pos.plusEq(this.vel);
		 
		if(this.thrustSize>0) this.thrustSize--; 
	
	};
	
	this.thrust = function() {
		
		this.temp.reset(this.thrustPower,0); 

		this.temp.rotate(this.angle); 
		this.vel.plusEq(this.temp); 
		if(this.thrustSize<16) this.thrustSize+=2; 
	};
	
	this.rotateLeft = function() {
		this.angle -= this.rotateSpeed; 
	};
	this.rotateRight = function() {
		this.angle += this.rotateSpeed; 
	};
	
	
	// c = canvas context
	this.draw = function() {		
		
		c.clearRect(0,0,60,60); 
		c.fillStyle = "rgba(255,255,255,0.2)";
		c.fillRect(0,0,60,60); 
		c.save();
		c.translate(30, 30); 
	
		c.strokeStyle = "#fff"; 
		c.lineWidth = 2; 
		
		c.beginPath();
		c.moveTo(-10, -10);
		c.lineTo(-10, 10);
		c.lineTo(14, 0);
		c.closePath(); 
		c.stroke();
	
		if(this.thrustSize>0) {

			c.beginPath();
			c.moveTo(-10, -6);
			
			c.lineTo(-10 - (this.thrustSize/((counter%2)+1)) , 0);	
			c.lineTo(-10, 6);
			c.stroke();
			counter++; 
		}
		
		c.restore();
		
		var posx = Math.round(this.pos.x-30); 
		var posy = Math.round(this.pos.y-30); 
		
		var styleStr = "translate3d("+posx+"px, "+posy+"px, 0px) rotate("+this.angle+"deg)"; 
		canvas.style.webkitTransform = canvas.style.MozTransform = canvas.style.OTransform = canvas.style.transform = styleStr; 

		
		
	};


}; 