function ModelBuilder(e) {
  this.e = e;

  /*this.merge = function (descriptor) {
    console.log("ModelBuilder.merge");
    console.log(descriptor);
    console.log(JSON.stringify(descriptor));
  };

  this.set = function (key, descriptor) {
    console.log("ModelBuilder.set");
    console.log(key);
    console.log(descriptor);
  };

  this.require = function (fields) {
    console.log("ModelBuilder.require");
    console.log(fields);
  };*/
}

var model = function (e) {
  return new ModelBuilder(e);
};