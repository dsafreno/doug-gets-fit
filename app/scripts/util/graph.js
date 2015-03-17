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

  function arrVersion(records) {
    arr = [];
    _.each(records, function(val, time) {
      arr.push({
        val: parseFloat(val),
        time: parseInt(time)
      })
    })
    arr.sort(function(a, b) {
      return a.time - b.time;
    })
    return arr;
  }

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
      score: lastRecordBefore(metrics.weight, time, 0).val,
      background: colors.get(1, 0.5)
    });
    var index = 0;
    _.each(metrics.numerators, function(numerator, name) {
      var record = lastRecordBefore(numerator.records, time);
      displayMetrics.push({
        name: name,
        score: numerator.multiplier * record.val + numerator.nullVal,
        background: colors.get(index + 2, 0.5)
      });
      index += 1;
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
    $scope.date = moment(time).format('MM/DD/YY hh:mm A');
    $scope.$apply();
  }

  function constructFitnessScores(metricsData, fitnessScoreName) {
    var dates = [];
    _.each(metricsData.weight, function(recordVal, recordTime) {
      dates.push(parseInt(recordTime));
    });
    _.each(metricsData.numerators, function(numerator) {
      _.each(numerator.records, function(recordVal, recordTime) {
        dates.push(parseInt(recordTime));
      });
    });
    dates = _.uniq(_.sortBy(dates, function(date) { return date; }), true);
    return {
      multiplier: 1,
      nullVal: 0,
      name: fitnessScoreName,
      records: _.map(dates, function(date) {
        return {
          val: fitnessScore(metricsData, date),
          time: date
        }
      })
    }
  }

  function lastRecordBefore(records, targetTime, baseScore) {
    if (baseScore === undefined) {
      var baseTime = -1
      baseScore = 0;
      _.each(records, function(val, time) {
        if (baseTime < 0 || baseTime > time) {
          baseTime = time;
          baseScore = val;
        }
      });
    }
    var bestTime = 0
    var bestVal = baseScore
    _.each(records, function(val, time) {
      time = parseInt(time);
      val = parseFloat(val);
      if (time <= targetTime && time > bestTime) {
        bestTime = time
        bestVal = val
      }
    });
    return {
      time: bestTime,
      val: bestVal
    };
  }

  function fitnessScore(metrics, targetTime) {
    var sum = 0;
    _.each(metrics.numerators, function(numerator, name) {
      sum += (lastRecordBefore(numerator.records, targetTime).val * numerator.multiplier + numerator.nullVal) * numerator.weighting;
    });
    var dfs = sum / lastRecordBefore(metrics.weight, targetTime, 0).val;
    if (metrics.weighting) {
      dfs *= metrics.weighting;
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
    var metrics = []
    _.each(metricsData.numerators, function(numerator, name) {
      metrics.push({
        name: name,
        records: arrVersion(numerator.records),
        multiplier: numerator.multiplier,
        nullVal: numerator.nullVal
      })
    })
    metrics.unshift({
      name: "Weight",
      records: arrVersion(metricsData.weight),
      multiplier: 1,
      nullVal: 0
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
        return new Date(record.time);
      });
    }), now]);
    _.each(metrics, function(metric) {
      metric.records.push({
        time: now.getTime(),
        val: _.last(metric.records).val
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
          return xRange(new Date(record.time));
        })
        .y(function(record) {
          var base = metrics[i].records[0].val;
          base = base * metrics[i].multiplier + metrics[i].nullVal;
          if (base < 0) {
            base = 1;
          }
          return yRange((metrics[i].multiplier * record.val + metrics[i].nullVal - base) / base);
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
        base = metric.records[0].val;
      }
      base = base * metric.multiplier + metric.nullVal;
      if (base < 1) {
        base = 1;
      }
      return func(metric.records, function(record) {
        return (metric.multiplier * record.val + metric.nullVal - base) / base;
      });
    });
  }

  return ret;
})()
