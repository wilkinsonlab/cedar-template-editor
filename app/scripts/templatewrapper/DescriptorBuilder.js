function DescriptorBuilder(d) {
  this.d = d;
  if (!this.d.hasOwnProperty('fieldDescriptors')) {
    this.d.fieldDescriptors = {};
  }

  this.merge = function (d) {
    for (var i in  d.fieldDescriptors) {
      this.d.fieldDescriptors[i] = d.fieldDescriptors[i];
    }
  };

  this.set = function (key, value) {
    this.d.fieldDescriptors[key] = value;
  };

  /*this.setValue = function (fieldName, value) {
    this.d.fieldDescriptors[fieldName].value = value;
  };*/
}

var descriptor = function (d) {
  return new DescriptorBuilder(d);
};