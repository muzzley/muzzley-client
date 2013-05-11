//
// simple mergetool for objects that 
// adds all the fields from obj2 onto obj1
//
var each = exports.each = function (obj,iterator){
 var keys = Object.keys(obj)
 keys.forEach(function (key){
  iterator(obj[key],key,obj) 
 })
}

var mergeObj = module.exports = function (a, b) {
  if(arguments.length <= 1)
    return a
  if(a == null)
    return mergeObj.apply(null, [].slice.call(arguments, 1))
  if(b != null)
    each(b, function (v,k){
      a[k] = v
    })
  return mergeObj.apply(null, [a].concat([].slice.call(arguments, 2)))  
}