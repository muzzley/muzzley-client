function inherits(ctor, superCtor, includeStatitMethods) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (includeStatitMethods) {
    for (var method in superCtor) {
      ctor[method] = superCtor[method];
    }
  }
}

exports = module.exports = inherits;