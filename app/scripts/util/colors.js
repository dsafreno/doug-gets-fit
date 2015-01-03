'use strict';

var colors = {
  data: [
    {
      r: 28,
      g: 247,
      b: 121
    }, {
      r: 247,
      g: 28,
      b: 155
    }, {
      r: 28,
      g: 173,
      b: 247
    }, {
      r: 221,
      g: 58,
      b: 57
    }, {
      r: 255,
      g: 134,
      b: 0
    }, {
      r: 118,
      g: 84,
      b: 249
    }, {
      r: 204,
      g: 204,
      b: 204
    }, {
      r: 199,
      g: 98,
      b: 54
    }
  ],

  get: function(index, alpha) {
    if (!alpha) {
      alpha = 1
    }
    console.log('colorstart', index);
    var color = this.data[index];
    var colorString = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')';
    console.log('colorend', index);
    return colorString;
  }
}
