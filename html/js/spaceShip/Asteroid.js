Asteroid = function (x,y,radius)
{
	this.pos = new Vector2(x,y); 
	this.vel = new Vector2(0,0); 
	
	this.points; 
	
	this.enabled = true; 
	
	// temp vector to calculate distance from circle in hitTest
	this.diff = new Vector2(0,0); 
	
	this.reset = function (radius) {
		this.points = []; 
		this.radius = radius; 
		
		var temp = new Vector2(radius, 0);
		
		for(var angle = 0; angle<360; angle+=45)
		{
			temp.reset(radius,0); 
			temp.rotate(angle);
			
			this.points.push(temp.clone()); 
					
		}
	
		
	};
	
	this.reset(radius); 
	
	this.update = function(canvas) {
		
		this.pos.plusEq(this.vel); 

		if(this.pos.x+this.radius < 0) this.pos.x = canvas.width+this.radius; 
		else if (this.pos.x-this.radius > canvas.width) this.pos.x = -this.radius; 
			
		if(this.pos.y+this.radius < 0) this.pos.y = canvas.height+this.radius; 
		else if (this.pos.y-this.radius > canvas.height) this.pos.y = -this.radius; 
				
	};
	
	this.draw = function(ctx) {
		ctx.save(); 
		ctx.translate(this.pos.x, this.pos.y); 
		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 2; 
		ctx.beginPath(); 
	
		for(var i = 0; i<this.points.length; i++) {
			
			var p = this.points[i % this.points.length]; 
			ctx.lineTo(p.x, p.y); 
		}
		
		ctx.closePath(); 
		ctx.stroke();
		ctx.restore(); 
	};
	
	this.hitTest = function(x,y) {
		
		this.diff.copyFrom(this.pos); 
		this.diff.x-=x; 
		this.diff.y-=y; 
		
		//var distancesquared = (this.diff.x * this.diff.x) + (this.diff.y*this.diff.y);
		// now check built in vector function 
		// then use optimised version
		
		return ( this.diff.isMagLessThan(this.radius)); 
		
	};
	
};