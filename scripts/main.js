require(['muzzley'], function(Muzzley) {
  console.log("At the main file, after the Muzzley require");
  var muzzley = new Muzzley();
  muzzley.connect();
});