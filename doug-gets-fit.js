var firebase = new Firebase("https://doug-gets-fit.firebaseio.com");

$(document).ready(function() {
  tryLogin();
});

function tryLogin() {
  var authData = firebase.getAuth();
  if (authData) {
    onLogin(authData);
  } else {
    $('.sign-in-modal-wrapper').show();
    $('#facebook-sign-in').click(function(event){
      event.preventDefault();
      firebase.authWithOAuthPopup("facebook", function(error, authData) {
        if (error) {
          alert("error logging in");
        } else {
          onLogin(authData);
        }
      });
    });
  }
}

function onLogin(authData) {
  $('#header-name').text(authData.facebook.cachedUserProfile.first_name);
  $('.sign-in-modal-wrapper').hide();
  var uid = authData.uid;
  firebase.child('users').child(uid).once('value', function(snapshot) {
    var exists = (snapshot.val() !== null);
    if (!exists) {
      authData['metrics'] = [{name: 'weight', records:[]}];
      firebase.child('users').child(uid).set(authData);
    }
  });

  $("#new-metric").click(function() {
    $(".new-metric-modal-wrapper").show();
    $(".new-metric-modal-wrapper").click(function(event) {
      $(".new-metric-modal-wrapper").hide();
    });
    $(".new-metric-modal").click(function(event) {
      event.stopPropagation();
    });
    $("#new-metric-submit").click(function(event) {
      event.preventDefault();
      var name = $("#new-metric-name").val();
      firebase.child('users').child(uid).child('metrics').push({
        name: name,
        records: []
      });
      $(".new-metric-modal-wrapper").hide();
    });
  });
  rerender();
}

function lambdaMetricScores(func) {
  return func(metrics, function(metric) {
    var base = 0;
    if (metric.records.length > 0) {
      base = metric.records[0].score;
    }
    if (base < 1) {
      base = 1;
    }
    return func(metric.records, function(record) {
      return (record.score - base) / base;
    });
  });
}

function rerender() {
  var vis = d3.select('#visualization');
  vis.selectAll('*').remove();
  var WIDTH = $('.graph').width();
  var HEIGHT = $('.graph').height();
  var MARGINS = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 50
  };
  var xRange = d3.time.scale()
    .range([MARGINS.left, WIDTH - MARGINS.right])
    .domain([d3.min(metrics, function(metric) {
      return d3.min(metric.records, function(record) {
        return new Date(record.timeInMillis);
      });
    }), d3.max(metrics, function(metric) {
      return d3.max(metric.records, function(record) {
        return new Date(record.timeInMillis);
      });
    })]);
  var yRange = d3.scale.linear()
    .range([HEIGHT-MARGINS.top, MARGINS.bottom])
    .domain([lambdaMetricScores(d3.min), lambdaMetricScores(d3.max)]);
  var xAxis = d3.svg.axis()
    .scale(xRange)
    .tickSize(1)
    .tickSubdivide(true);
  var yAxis = d3.svg.axis()
    .scale(yRange)
    .tickSize(1)
    .orient('left')
    .tickSubdivide(true);
  vis.append('svg:g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
    .call(xAxis);
  vis.append('svg:g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
    .call(yAxis);
  for (var i = 0; i < metrics.length; i++) {
    var lineFunc = d3.svg.line()
      .x(function(record) {
        return xRange(new Date(record.timeInMillis));
      })
      .y(function(record) {
        var base = metrics[i].records[0].score;
        if (base < 0) {
          base = 1;
        }
        return yRange((record.score - base) / base);
      })
      .interpolate('basis');

    vis.append('svg:path')
      .attr('d', lineFunc(metrics[i].records))
      .attr('stroke', colors[i])
      .attr('stroke-width', 1)
      .attr('fill', 'none');
  }
}

// see https://color.adobe.com/create/color-wheel/?base=2&rule=Custom&selected=4&name=My%20Kuler%20Theme&mode=rgb&rgbvalues=0.40444180404398655,0.6725490196078432,0.45853240133030854,0.6335547122074636,0.8324633531966306,0.9771241830065359,0.9725490196078431,0.9725490196078431,0.5333333333333333,0.7725490196078431,0.46604636520506193,0.4738693335377751,0.6725490196078432,0.5722356791202101,0.4052827283171662&swatchOrder=0,1,2,3,4
// and use F8E71C on http://www.59times.com/times/color-palette-generator/color-palette-generator.aspx?r=121&g=108&b=17
var colors = [
  'red',
  'blue',
  'green',
  'yellow'
];

var metrics = [{
  name: 'Squats',
  records: []
}, {
  name: 'Bench press',
  records: []
}];


// Generate sample data
var time = 1378076400000;
var spacing = 2*24*60*60*1000;
var squat = 80;
var bench = 60;

for (var i = 0; i < 80; i++) {
  metrics[0].records.push({
    timeInMillis: time,
    score: squat
  });
  squat += 5 * Math.random() - 1;
  if (i % 2 == 0) {
    metrics[1].records.push({
      timeInMillis: time,
      score: bench
    });
    bench += 5 * Math.random() - 1;
  }
  time += spacing;
}
