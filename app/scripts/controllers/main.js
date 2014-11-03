'use strict';

var colors = [
  "#F8E71C",
  "#F71C9B",
  "#1CADF7",
  "#1CF779",
  "#DD3A39",
  "#FF8600",
  "#7654F9"
];

function bgColorFrom(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return "rgba(" +
    parseInt(result[1], 16).toString() + ", " +
    parseInt(result[2], 16).toString() + ", " +
    parseInt(result[3], 16).toString() + ", " +
    (0.5).toString() + ");";
}


/**
 * @ngdoc function
 * @name dougGetsFitApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dougGetsFitApp
 */
app.controller('MainCtrl', function ($scope) {
  var authData = firebase.getAuth();
  $scope.profileUrl = authData.facebook.cachedUserProfile.picture.data.url;
  $scope.displayName = authData.facebook.cachedUserProfile.first_name.toUpperCase();
  var displayMetrics = [];
  console.log(metrics);
  var fitnessScoreName = $scope.displayName + " FITNESS SCORE";
  displayMetrics.push({
    name: fitnessScoreName,
    score: fitnessScore(metrics, Date.now()),
    background: "",
    classes: "fitness-score yellow"
  });
  displayMetrics.push({
    name: "Weight",
    score: _.last(metrics.weight).score,
    background: bgColorFrom(colors[1])
  });
  _.each(metrics.numerators, function(numerator, index) {
    var record = _.last(numerator.records);
    displayMetrics.push({
      name: numerator.name,
      score: numerator.c * record.score + numerator.k,
      background: bgColorFrom(colors[index + 2])
    });
  });

  // Do rounding
  displayMetrics = _.map(displayMetrics, function(displayMetric, index) {
    if (index == 0) {
      displayMetric.score = (Math.round(displayMetric.score * 100) / 100).toFixed(2);
    } else {
      displayMetric.score = (Math.round(displayMetric.score * 10) / 10).toFixed(1);
    }
    return displayMetric;
  });
  $scope.metrics = displayMetrics;
  $(window).resize(function() {
    renderGraph(metrics, fitnessScoreName);
  });
  renderGraph(metrics, fitnessScoreName);
});

function constructFitnessScores(metricsData, fitnessScoreName) {
  var dates = [];
  _.each(metricsData.weight, function(record) {
    dates.push(record.timeInMillis);
  });

  _.each(metricsData.numerators, function(numerator) {
    _.each(numerator.records, function(record) {
      dates.push(record.timeInMillis);
    });
  });
  dates = _.uniq(_.sortBy(dates, function(date) { return date; }), true);
  return {
    name: fitnessScoreName,
    records: _.map(dates, function(date) {
      return {
        score: fitnessScore(metricsData, date),
        timeInMillis: date
      }
    })
  }
}

function lastRecordBefore(records, timeInMillis, baseScore) {
  var retVal = _.reduce(records, function(bestRecord, record) {
    var diff = timeInMillis - record.timeInMillis;
    if (diff < 0) {
      return bestRecord;
    }
    if (!bestRecord) {
      return record;
    }
    if (diff < timeInMillis - bestRecord.timeInMillis) {
      return record;
    }
    return bestRecord;
  });
  if (!retVal) {
    retVal = {
      timeInMillis: 0,
      score: baseScore
    }
  }
  return retVal;
}

function fitnessScore(metrics, timeInMillis) {
  var sum = 0;
  _.each(metrics.numerators, function(numerator) {
    sum += (lastRecordBefore(numerator.records, timeInMillis, numerator.k).score * numerator.c + numerator.k) * numerator.factor;
  });
  return sum / lastRecordBefore(metrics.weight, timeInMillis, 0).score;
}

function renderGraph(metricsData, fitnessScoreName) {
  var metrics = _.clone(metricsData.numerators);
  metrics.unshift({
    name: "Weight",
    records: metricsData.weight
  });
  metrics.unshift(constructFitnessScores(metricsData, fitnessScoreName));
  console.log(metrics);
  var vis = d3.select('#visualization');
  vis.selectAll('*').remove();
  var WIDTH = $("#visualization").width();
  var HEIGHT = $("#visualization").height();
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
    .domain([lambdaMetricScores(metrics, d3.min), lambdaMetricScores(metrics, d3.max)]);
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
    .attr('stroke', 'white')
    .attr('stroke-opacity', 0.5)
    .attr('fill-opacity', 0.5)
    .attr('fill', 'white')
    .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
    .call(xAxis);
  vis.append('svg:g')
    .attr('class', 'y axis')
    .attr('stroke', 'white')
    .attr('stroke-opacity', 0.5)
    .attr('fill-opacity', 0.5)
    .attr('fill', 'white')
    .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
    .call(yAxis);
  for (var i = metrics.length - 1; i >= 0; i--) {
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
      .interpolate('step');

    vis.append('svg:path')
      .attr('d', lineFunc(metrics[i].records))
      .attr('stroke', colors[i])
      .attr('stroke-width', i == 0 ? 2 : 1)
      .attr('fill', 'none');
  }
}

function lambdaMetricScores(metrics, func) {
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


// TODO delete
// generates dummy data
var metrics = {
  weight: [],
  numerators: [
    {
      name: 'Squats',
      records: [],
      c: 2,
      k: 45,
      factor: 3
    }, {
      name: 'Bench press',
      records: [],
      c: 2,
      k: 45,
      factor: 2
    }
  ]
};


// Generate sample data
var time = 1384066400000;
var spacing = 15*24*60*60*1000;
var squat = 30;
var bench = 30;
var weight = 160;
var expectedChange = 0.0;
var dev = 0.75;

for (var i = 0; i < 10; i++) {
  metrics.weight.push({
    timeInMillis: time,
    score: weight
  });
  weight += Math.random() * 2 - 1;
  metrics.numerators[0].records.push({
    timeInMillis: time,
    score: squat
  });
  squat += (dev * 2) * Math.random() - dev + expectedChange;
  if (i % 2 == 0) {
    metrics.numerators[1].records.push({
      timeInMillis: time,
      score: bench
    });
    bench += (dev * 2) * Math.random() - dev + expectedChange;
  }
  time += spacing;
}
