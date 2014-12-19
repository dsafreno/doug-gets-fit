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
    }
  ],

  get: function(index, alpha) {
    if (!alpha) {
      alpha = 1
    }
    var color = this.data[index];
    var colorString = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')';
    console.log(colorString);
    return colorString;
  }
}
