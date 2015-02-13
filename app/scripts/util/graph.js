var GraphUtil = (function() {
  var ret = {
    displayMetrics: function(metrics, fitnessScoreName, $scope) {
      chooseDisplayMetrics(metrics, fitnessScoreName, $scope);
      $(window).resize(function() {
        renderGraph($scope, metrics, fitnessScoreName, $(window).width() - 400);
      });
      renderGraph($scope, metrics, fitnessScoreName, 2000);
      $(window).resize();
    }
  };

  function chooseDisplayMetrics(metrics, fitnessScoreName, $scope, time) {
    if (time === undefined) {
      time = Date.now();
    }
    var displayMetrics = [];
    displayMetrics.push({
      name: fitnessScoreName,
      score: fitnessScore(metrics, time),
      background: colors.get(0, 0.5)
    });
    displayMetrics.push({
      name: "Weight",
      score: lastRecordBefore(metrics.weight, time, 0).score,
      background: colors.get(1, 0.5)
    });
    _.each(metrics.numerators, function(numerator, index) {
      var record = lastRecordBefore(numerator.records, time, numerator.k);
      displayMetrics.push({
        name: numerator.name,
        score: numerator.c * record.score + numerator.k,
        background: colors.get(index + 2, 0.5)
      });
    });
    displayMetrics = _.map(displayMetrics, function(displayMetric, index) {
      if (index === 0) {
        displayMetric.score = (Math.round(displayMetric.score * 100) / 100).toFixed(2);
      } else {
        displayMetric.score = (Math.round(displayMetric.score * 10) / 10).toFixed(1);
      }
      return displayMetric;
    });
    $scope.metrics = displayMetrics;
    $scope.$apply();
  }

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
      c: 1,
      k: 0,
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
    var dfs = sum / lastRecordBefore(metrics.weight, timeInMillis, 0).score;
    if (metrics.factor) {
      dfs *= metrics.factor;
    }
    return dfs;
  }

  function renderGraph($scope, metricsData, fitnessScoreName, width, focusedIndex) {
    var MARGINS = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 45
    };
    $('#visualization').width(width);
    $('#visualization').height($(window).height() - 70);
    var metrics = _.clone(metricsData.numerators);
    metrics.unshift({
      name: "Weight",
      records: metricsData.weight,
      c: 1,
      k: 0
    });
    metrics.unshift(constructFitnessScores(metricsData, fitnessScoreName));
    var vis = d3.select('#visualization');
    vis.selectAll('*').remove();
    var WIDTH = $("#visualization").width();
    var HEIGHT = $("#visualization").height();
    var xMin = MARGINS.left;
    var xMax = WIDTH - MARGINS.right;
    var now = new Date();
    var xRange = d3.time.scale()
    .range([xMin, xMax])
    .domain([d3.min(metrics, function(metric) {
      return d3.min(metric.records, function(record) {
        return new Date(record.timeInMillis);
      });
    }), now]);
    _.each(metrics, function(metric) {
      metric.records.push({
        timeInMillis: now.getTime(),
        score: _.last(metric.records).score
      });
    });
    var yMin = HEIGHT - MARGINS.top;
    var yMax = MARGINS.bottom;
    var yRange = d3.scale.linear()
    .range([yMin, yMax])
    .domain([lambdaMetricScores(metrics, d3.min), lambdaMetricScores(metrics, d3.max)]);
    var xAxis = d3.svg.axis()
    .scale(xRange)
    .tickSize(1)
    .tickSubdivide(true);
    var yAxis = d3.svg.axis()
    .scale(yRange)
    .tickSize(1)
    .orient('left')
    .tickFormat(d3.format(".0%"))
    .tickSubdivide(true);
    vis.append('svg:line')
      .attr('class', 'mousemove')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.9);

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
          base = base * metrics[i].c + metrics[i].k;
          if (base < 0) {
            base = 1;
          }
          return yRange((metrics[i].c * record.score + metrics[i].k - base) / base);
        })
        .interpolate('step-after');

      var strokeWidth = 1;
      if (focusedIndex) {
        strokeWidth = focusedIndex === i ? 2 : 1;
      }

      var color = colors.get(i, 1);
      if (focusedIndex) {
        colors.get(i, focusedIndex === i ? 1 : 0.3)
      }

      vis.append('svg:path')
      .attr('d', lineFunc(metrics[i].records))
      .attr('stroke', color)
      .attr('stroke-width', strokeWidth)
      .attr('fill', 'none');
      vis.append('svg:path')
      .attr('d', lineFunc(metrics[i].records))
      .attr('stroke', 'rgba(0, 0, 0, 0)')
      .attr('stroke-width', 10)
      .attr('fill', 'none')
      .on('click', function() {
        renderGraph($scope, metricsData, fitnessScoreName, width, i);
      });
    }
    vis.on("mouseout", function() {
      var line = d3.select('#visualization > .mousemove');
      line.attr("visibility", "hidden");
      chooseDisplayMetrics(metricsData, fitnessScoreName, $scope);
    });
    vis.on("mousemove", function() {
      var line = d3.select('#visualization > .mousemove');
      var rX = d3.mouse(this)[0];
      if (rX < xMin) {
        line.attr("visibility", "hidden");
        chooseDisplayMetrics(metricsData, fitnessScoreName, $scope);
      } else {
        line
          .attr("visibility", "visible")
          .attr("x1", rX)
          .attr("x2", rX)
          .attr("y1", yMin)
          .attr("y2", yMax);
        chooseDisplayMetrics(metricsData, fitnessScoreName, $scope, xRange.invert(rX));
      }
    });
  }

  function lambdaMetricScores(metrics, func) {
    return func(metrics, function(metric) {
      var base = 0;
      if (metric.records.length > 0) {
        base = metric.records[0].score;
      }
      base = base * metric.c + metric.k;
      if (base < 1) {
        base = 1;
      }
      return func(metric.records, function(record) {
        return (metric.c * record.score + metric.k - base) / base;
      });
    });
  }

  return ret;
})()
