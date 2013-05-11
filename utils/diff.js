var each = exports.each = function (obj,iterator){
 var keys = Object.keys(obj)
 keys.forEach(function (key){
  iterator(obj[key],key,obj) 
 })
}

var merge = exports.merge = function (a, b) {
  if(arguments.length <= 1)
    return a
  if(a == null)
    return merge.apply(null, [].slice.call(arguments, 1))
  if(b != null)
    each(b, function (v,k){
      a[k] = v
    })
  return merge.apply(null, [a].concat([].slice.call(arguments, 2)))  
}

var deepMerge = exports.deepMerge = function (old, nw) {
  var ab = merge({}, nw,  old)
    , s = Array.isArray(nw) ? [] : {}
  each(ab, function (ignore, k) { //on each key in ab, 
    
    s[k] = (nw[k] === undefined ? old[k] : nw[k])
    if ('object' === typeof nw[k] && 'object' === typeof old[k] && old[k] && nw[k] && old[k]) {
        s[k] = deepMerge (old[k], nw[k])
    }
  })
  return s
}

var diff = module.exports = function (old, nw) {
  var ab = deepMerge (nw,  old)
    , s = {}
     
  each(ab, function (ignore, k) {

    //if the property is not in the new object, it must have been deleted.
    if (nw[k] == null) 
      s[k]  = null //null on a diff means to delete that property.
    else if ('object' === typeof nw[k] && 'object' === typeof old[k] && old[k]) 
      s[k] = diff(old[k], nw[k])
    else if (nw[k] !== old[k])   
      s[k] = nw[k] === undefined ? null : nw[k]

  })
  return s
  
}