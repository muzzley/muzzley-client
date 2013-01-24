MovingCircle = function (x,y,radius)
{
	this.pos = new Vector2(x,y); 
	this.vel = new Vector2(0,0); 
	this.radius = radius; 
	this.enabled = true; 
	
	// temp vector to calculate distance from circle in hitTest
	this.diff = new Vector2(0,0); 
	
	this.update = function(canvas) {
		
		this.pos.plusEq(this.vel); 

		if(this.pos.x+this.radius < 0) this.pos.x = canvas.width+this.radius; 
		else if (this.pos.x-this.radius > canvas.width) this.pos.x = -this.radius; 
			
		if(this.pos.y+this.radius < 0) this.pos.y = canvas.height+this.radius; 
		else if (this.pos.y-this.radius > canvas.height) this.pos.y = -this.radius; 
				
	};
	
	this.draw = function(ctx) {
		
		ctx.strokeStyle = "#ffffff";
		ctx.beginPath(); 
		ctx.arc(this.pos.x,this.pos.y,this.radius, 0, Math.PI*2, true); 
		ctx.stroke();
		
	};
	
	this.hitTest = function(x,y) {
		
		this.diff.copyFrom(this.pos); 
		this.diff.x-=x; 
		this.diff.y-=y; 
		
		var distance = Math.sqrt((this.diff.x * this.diff.x) + (this.diff.y*this.diff.y));
		// now check built in vector function 
		// then use optimised version
		
		return ( distance<this.radius); 
		
	};
	
};