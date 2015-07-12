(function() {

'use-strict';

window.DailyWeatherGraph = function DailyWeatherGraph(cfg) {

    var defaults = {

        width: 800,
        height: 375,
        dateFormat: '%Y-%m-%d',
        missingValue: null,
        missingValueText: 'n/a',

        temperatureUnit: 'C',
        rainfallUnit: 'mm',
        windUnit: 'km/h'

    };

    // Clone config object
    var config = _cloneShallow(cfg);

    // Merge defaults with provided config object
    for (var prop in defaults) {
        if (!_hasOwn(config, prop))
            config[prop] = defaults[prop];
    }

    var numPoints = config.data.length;

    // Dimension settings: widths, heights, margins, etc.
    var dim = {

        marginTop: 10,
        marginRight: 10,
        marginBottom: 30,
        marginLeft: 10,

        regionSpacing: 30,
        windRegionHeight: 70,
        rainRegionHeightProp: 0.375,
        tempRegionHeightProp: 0.625,

        windSize: 50,
        windCircleRadius: 12

    };

    // Calculate dimensions of actual plot area
    dim.plotAreaWidth = config.width - dim.marginLeft - dim.marginRight;
    dim.plotAreaHeight = config.height - dim.marginTop - dim.marginBottom;

    var remainingHeight = (config.height - dim.marginTop -
        dim.marginBottom - 2 * dim.regionSpacing -
        dim.windRegionHeight);

    dim.rainRegionHeight = remainingHeight * dim.rainRegionHeightProp;
    dim.tempRegionHeight = remainingHeight * dim.tempRegionHeightProp;

    // Make sure the graph container is empty
    config.container.html('');

    // Insert the SVG element and apply the margins
    var svgEl = config.container.append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .attr('class', 'daily-weather-graph');

    // Background rect for whole SVG area
    svgEl.append('rect')
        .attr('class', 'graph-background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', config.width)
        .attr('height', config.height);

    // Background rect for whole plot area
    var plotArea = svgEl.append('rect')
        .attr('class', 'plot-area-background')
        .attr('x', dim.marginLeft)
        .attr('y', dim.marginTop)
        .attr('width', dim.plotAreaWidth)
        .attr('height', dim.plotAreaHeight)
        .attr('pointer-events', 'all');

    // Key function for binding data to elements
    var keyFunc = function(d) {
        return d.Date;
    };

    // Create definitions for wind icons & arrows
    var defs = svgEl.append('defs');
    _createWindIndicatorDefs(defs, dim);

    // Get the SVG context we will be drawing in (simply applies the margins).
    var svg = svgEl.append('g')
        .attr('class', 'plot-area')
        .attr('transform', 'translate(' + dim.marginLeft + ',' + dim.marginTop + ')')
        .attr('pointer-events', 'none');

    // The x scale. Make sure there is good spacing between points.
    var xScale = d3.scale.ordinal()
        .domain(_pluck(config.data, 'Date'))
        .rangeRoundBands([0, dim.plotAreaWidth], 0.25);

    _drawWindRegion(svg, xScale, config, dim, keyFunc);
    _drawTemperatureRegion(svg, xScale, config, dim, keyFunc);
    _drawRainRegion(svg, xScale, config, dim, keyFunc);

    // Insert day separator(s) between months. To do so, need to get the positions
    // of the two points and average them, then add half the interval width.

    var dateFormat = d3.time.format(config.dateFormat);

    var daysOfMonth = config.data.map(function(d) {
        return dateFormat.parse(d.Date).getDate();
    });

    var indexOfNewMonth = daysOfMonth.indexOf(1);

    while (indexOfNewMonth !== -1) {

        if (indexOfNewMonth < numPoints && indexOfNewMonth > 0) {

            var prevMonthDate = data[indexOfNewMonth - 1].Date,
                currMonthDate = data[indexOfNewMonth].Date,
                newMonthLineX = (xScale(prevMonthDate) + xScale(currMonthDate))/2 + xScale.rangeBand()/2;

            svg.append('line')
                .attr('class', 'vertical-separator')
                .attr('x1', newMonthLineX)
                .attr('x2', newMonthLineX)
                .attr('y1', dim.marginTop)
                .attr('y2', dim.plotAreaHeight + 20);
        }

        indexOfNewMonth = daysOfMonth.indexOf(1, indexOfNewMonth + 1);

    }

    // Draw cursor (vertical guideline when mousing over)
    var cursor = svg.append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', dim.marginTop)
        .attr('y2', dim.plotAreaHeight)
        .attr('id', 'graph-cursor')
        .style('stroke', '#BBB')
        .style('stroke-width', '1px')
        .style('stroke-opacity', 0);

    // Create the x axis, with no ticks showing.
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .outerTickSize(0)
        .innerTickSize(0)
        .tickFormat(function(x) {
            var xp = x.split('-');
            return parseInt(xp[2], 10);
        });

    // Draw the x axis and labels
    svg.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', 'translate(0,' + dim.plotAreaHeight + ')')
        .call(xAxis)
        .selectAll('text')
        .attr('dy', '1.4em')
        .style('font-size', '11px');

    plotArea.on('mousemove', function() {

        // On mousemove, move the graph cursor to follow the mouse pointer
        var pos = d3.mouse(svgEl.node());
        var pt = svgEl.node().createSVGPoint();
        pt.x = pos[0];
        pt.y = pos[1];

        var point = pt.matrixTransform(svgEl.node().getScreenCTM().inverse());

        cursor.attr('x1', point.x);
        cursor.attr('x2', point.x);

    });

    plotArea.on('mouseover', function() {
        // On mouseover, show the graph cursor
        cursor.style('stroke-opacity', 0.8);
    });

    plotArea.on('mouseout', function() {
        // On mouseout, hide the graph cursor
        cursor.style('stroke-opacity', 0);
    });

};




function _createWindIndicatorDefs(defs, dim) {

    var windSymbol = defs.append('g')
        .attr('id', 'daily-weather-graph-wind-icon');

    // Use circle shape
    windSymbol.append('circle')
        .attr('cx', dim.windSize/2)
        .attr('cy', dim.windSize/2)
        .attr('stroke-width', '1.3px')
        .attr('r', dim.windCircleRadius);

    var indicator = defs.append('g')
        .attr('id', 'daily-weather-graph-wind-indicator');

    var indicator_y0 = dim.windSize/2 - dim.windCircleRadius + 4;
    var indicator_length = 8;
    var indicator_y1 = indicator_y0 - indicator_length;
    var indicator_x0 = dim.windSize/2 - indicator_length/2;
    var indicator_x1 = dim.windSize/2 + indicator_length/2;

    indicator.append('path')
        .attr('d', 'M' + indicator_x0 + ',' + indicator_y1 +
            ' L' + indicator_x1 + ',' + indicator_y1 +
            ' L' + dim.windSize/2 + ',' + indicator_y0 +
            ' L' + indicator_x0 + ',' + indicator_y1);

}



function _drawRainRegion(svg, xScale, config, dim, keyFunc) {

    var lowestRainScaleMax = 10;
    var rainDecimals = (config.rainUnit == 'inches' ? 2 : 1);

    if (config.rainUnit == 'inches')
        lowestRainScaleMax = lowestRainScaleMax / 25.4;

    // Filter any NA values
    var rainTotals = _pluck(config.data, 'Rainfall').filter(function(r) {
        return r !== config.missingValue;
    });

    // The rain scale. Leave space at top for labels.
    var rainScale = d3.scale.linear()
        .range([0, dim.rainRegionHeight - 30])
        .domain([0, Math.max(lowestRainScaleMax, d3.max(rainTotals))])
        .clamp(true);

    var rainInterpolator = _getRainInterpolator(config);

    var rainRegion = svg.append('g').attr('class', 'rain-region');

    rainRegion.append('rect')
        .attr('class', 'rain-region-background')
        .attr('x', 0)
        .attr('y', dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing/2)
        .attr('width', dim.plotAreaWidth)
        .attr('height', dim.rainRegionHeight + dim.regionSpacing/2);

    var rainBars = rainRegion.append('g').attr('class', 'rain-bars'),
        rainLabels = rainRegion.append('g').attr('class', 'rain-labels');

    // Insert the rainfall bars
    rainBars.selectAll('rect.rain-bar')
        .data(config.data, keyFunc)
        .enter()
        .append('rect')
        .attr('class', 'rain-bar')
        .style('fill', function(d) {
            return (d.Rainfall === 0 || d.Rainfall === config.missingValue ?
                'none' :
                rainInterpolator(d.Rainfall));
        })
        .style('stroke', function(d) {
            if (d.Rainfall === 0 || d.Rainfall === config.missingValue)
                return 'none';
            var col = rainInterpolator(d.Rainfall);
            return d3.rgb(col).darker(0.8);
        })
        .attr('x', function(d) { return xScale(d.Date);})
        .attr('y', function(d) {
            return dim.plotAreaHeight - (d.Rainfall === config.missingValue ?
                0 :
                rainScale(d.Rainfall));
        })
        .attr('width', xScale.rangeBand())
        .attr('height', function(d) {
            return (d.Rainfall === config.missingValue ?
                0 :
                rainScale(d.Rainfall));
        });

    // Insert the bar labels
    // For zero rainfall, insert a small dot instead, and increase its font size.
    // Remember to check values are all at least 0.
    rainLabels.selectAll('text.rain-label')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class', function(d) {
            return (d.Rainfall === config.missingValue ?
                'missing-label' :
                'rain-label');
        })
        .attr('text-anchor', 'middle')
        .attr('x', function(d) {return xScale(d.Date) + xScale.rangeBand()/2;})
        .attr('y', function(d) {
            var r = (d.Rainfall === config.missingValue ? 0 : d.Rainfall);
            return dim.plotAreaHeight - rainScale(r) - 8;
        })
        .style('font-size', function(d) {
            return d.Rainfall === 0 ? '15px' : '';
        })
        .text(function(d) {
            if (d.Rainfall > 0) {
                var z = Math.pow(10, rainDecimals);
                var label = Math.round(z * d.Rainfall) / z;
                // For 2 dp values, remove leading zero
                //  so labels are not too crammed together
                if (label < 0.1) {
                    label = ('' + label).substring(1);
                }
                return label;
            }
            if (d.Rainfall === 0) {
                return '.';
            }
            return config.missingValueText;
        });

    // Draw rainfall label in top left of rain region
    rainRegion.append('text')
        .attr('class', 'section-label')
        .attr('x', 5)
        .attr('y', dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing/2)
        .attr('dy', '1.3em')
        .text('Daily rainfall (' + config.rainfallUnit + ')');

    // Draw rain total label at top-right of rain region
    rainRegion.append('text')
        .attr('class', 'statistic-label')
        .attr('x', dim.plotAreaWidth - 5)
        .attr('y', dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing/2)
        .attr('text-anchor', 'end')
        .attr('dy', '1.3em')
        .text('Total: ' + d3.sum(rainTotals).toFixed(rainDecimals));

    // Add line to separate rain region from temperature region
    rainRegion.append('line')
        .attr('class', 'region-separator')
        .attr('transform', 'translate(0,' + (dim.plotAreaHeight -
            dim.rainRegionHeight - dim.regionSpacing/2) + ')')
        .attr('x1', 0)
        .attr('x2', dim.plotAreaWidth)
        .attr('y1', 0)
        .attr('y2', 0);

}




function _drawTemperatureRegion(svg, xScale, config, dim, keyFunc) {

    // The temperature scale
    var tempScale = d3.scale.linear()
        .range([dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing,
                dim.windRegionHeight + dim.regionSpacing]);

    // Calculate the range of the temperature data.
    var highTemps = _pluck(config.data, 'HighTemperature');
    var lowTemps = _pluck(config.data, 'LowTemperature');

    var validTemps = highTemps.concat(lowTemps).filter(function(t) {
        return t !== config.missingValue;
    });

    var tempScaleLimits = d3.extent(validTemps);
    var tempScaleRange = tempScaleLimits[1] - tempScaleLimits[0];

    // Pad out the temperature axis limits, more so at the top.
    // If there is no variation throughout the period, use +/- 1 degree
    tempScaleLimits[0] = Math.floor(tempScaleLimits[0]) - Math.max(1, 0.15 * tempScaleRange);
    tempScaleLimits[1] = Math.ceil(tempScaleLimits[1]) + Math.max(1, 0.25 * tempScaleRange);

    // Set the domain of the temperature scale
    tempScale.domain(tempScaleLimits);

    // D3 line function for calculating temperature path coordinates
    var lowTemperatureLine = d3.svg.line()
        .x(function(d) { return xScale(d.Date) + xScale.rangeBand()/2; })
        .y(function(d) { return tempScale(d.LowTemperature); });

    var highTemperatureLine = d3.svg.line()
        .x(function(d) { return xScale(d.Date) + xScale.rangeBand()/2; })
        .y(function(d) { return tempScale(d.HighTemperature); });

    lowTemperatureLine.defined(function(d) {
        return d.LowTemperature !== config.missingValue;
    });

    highTemperatureLine.defined(function(d) {
        return d.HighTemperature !== config.missingValue;
    });

    var tempRegion = svg.append('g').attr('class', 'temperature-region');

    tempRegion.append('rect')
        .attr('class', 'temperature-region-background')
        .attr('x', 0)
        .attr('y', dim.windRegionHeight + dim.regionSpacing/2)
        .attr('width', dim.plotAreaWidth)
        .attr('height', dim.tempRegionHeight + dim.regionSpacing);

    // Draw the temperature lines
    tempRegion.append('path')
        .attr('class', 'temperature-low-path')
        .attr('d', lowTemperatureLine(config.data));

    tempRegion.append('path')
        .attr('class', 'temperature-high-path')
        .attr('d', highTemperatureLine(config.data));

    var tempHighLabels = tempRegion.append('g').attr('class', 'temperature-high-labels'),
        tempLowLabels = tempRegion.append('g').attr('class', 'temperature-low-labels');

    // Draw the high temperature labels
    tempHighLabels.append('g')
        .selectAll('text')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class', 'temperature-high-label')
        .attr('x', function(d) { return xScale(d.Date) + xScale.rangeBand()/2; })
        .attr('y', function(d) { return tempScale(d.HighTemperature); })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return (d.HighTemperature === config.missingValue ? '' : d.HighTemperature);
        });

    // Draw the low temperature labels
    tempLowLabels.append('g')
        .selectAll('text')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class', 'temperature-low-label')
        .attr('x', function(d) { return xScale(d.Date) + xScale.rangeBand()/2; })
        .attr('y', function(d) { return tempScale(d.LowTemperature); })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return (d.LowTemperature === config.missingValue ? '' : d.LowTemperature);
        });

    // Draw the temperature region and wind region separator
    tempRegion.append('line')
        .attr('class', 'region-separator')
        .attr('transform', 'translate(0,' + (dim.windRegionHeight + dim.regionSpacing/2) + ')')
        .attr('x1', 0)
        .attr('x2', dim.plotAreaWidth)
        .attr('y1', 0)
        .attr('y2', 0);

    // Draw temperature label in top left of temperature region
    tempRegion.append('text')
        .attr('class', 'section-label')
        .attr('x', 5)
        .attr('y', dim.windRegionHeight + dim.regionSpacing/2)
        .attr('dy', '1.3em')
        .text('High and low temperatures (°' + config.temperatureUnit + ')');

}



function _drawWindRegion(svg, xScale, config, dim, keyFunc) {

    // Draw the arrows with <use> elements. They need to be rotated according to the
    // wind direction at a particular point.

    var windInterpolator = _getWindInterpolator(config);
    var y = 35;

    var windRegion = svg.append('g').attr('class', 'wind-region');

    windRegion.append('rect')
        .attr('class', 'wind-region-background')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', dim.plotAreaWidth)
        .attr('height', dim.windRegionHeight + dim.regionSpacing/2);

    var windIcons = windRegion.append('g').attr('class', 'wind-icons'),
        windArrows = windRegion.append('g').attr('class', 'wind-arrows'),
        windGustLabels = windRegion.append('g').attr('class', 'wind-gust-labels'),
        windDirLabels = windRegion.append('g').attr('class', 'wind-direction-labels');

    windIcons.selectAll('wind-icon')
        .data(config.data, keyFunc)
        .enter()
        .append('use')
        .attr('xlink:href', '#daily-weather-graph-wind-icon')
        .attr('transform', function(d) {
            if (d.HighWindGustBearing === config.missingValue)
                return '';
            var trans_x = (xScale(d.Date) + xScale.rangeBand()/2);
            return 'translate(' + (trans_x - dim.windSize/2) + ',' + y + ')';
        })
        .style('fill', function(d) {
            return (d.HighWindGust === config.missingValue ?
                'none' :
                windInterpolator(d.HighWindGust));
        })
        .style('stroke', function(d) {
            if (d.HighWindGust === config.missingValue)
                return 'none';
            var col = windInterpolator(d.HighWindGust);
            return d3.rgb(col).darker(1.25);
        });

    // Draw wind indicators

    windArrows.selectAll('wind-arrow')
        .data(config.data, keyFunc)
        .enter()
        .append('use')
        .attr('xlink:href', '#daily-weather-graph-wind-indicator')
        .attr('transform', function(d) {
            if (d.HighWindGustBearing === config.missingValue)
                return '';
            var trans_x = (xScale(d.Date) + xScale.rangeBand()/2),
                rotate = 45 * Math.round(d.HighWindGustBearing/45);
            return 'translate(' + (trans_x - dim.windSize/2) + ',35) rotate(' +
                rotate + ' ' + dim.windSize/2 + ' ' + dim.windSize/2 + ')';
        })
        .style('fill', function(d) {
            return (d.HighWindGustBearing === config.missingValue || Math.round(d.HighWindGust) === 0 ?
                'none' :
                '#000000');
        })
        .style('stroke', function(d) {
            return (d.HighWindGustBearing === config.missingValue || Math.round(d.HighWindGust) === 0 ?
                'none' :
                '#FFFFFF');
        });

    // Draw the labels for wind direction and speed
    windGustLabels.selectAll('text.wind-gust-label')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class', function(d) {
            return (d.HighWindGust === config.missingValue ?
                'na-label' :
                'wind-gust-label');
        })
        .attr('x', function(d) { return xScale(d.Date) + xScale.rangeBand()/2; })
        .attr('y', y + dim.windSize/2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return (d.HighWindGust === config.missingValue ?
                config.missingValueText :
                Math.round(d.HighWindGust));
        });

    windDirLabels.selectAll('text.wind-direction-label')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class', 'wind-direction-label')
        .attr('x', function(d) { return xScale(d.Date) + xScale.rangeBand()/2; })
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return (d.HighWindGustBearing === config.missingValue || Math.round(d.HighWindGust) === 0 ?
                '' :
                _getWindDirection(d.HighWindGustBearing));
        });

    // Draw wind label in top left of wind region
    windRegion.append('text')
        .attr('class', 'section-label')
        .attr('x', 5)
        .attr('y', 5)
        .attr('dy', '0.8em')
        .text('Peak wind gust (' + config.windUnit + ')');

}







/*---------------------------- Utility functions ----------------------------*/

function _hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function _cloneShallow(obj) {

    var clone = {};

    for (var prop in obj) {
        if (_hasOwn(obj, prop))
            clone[prop] = obj[prop];
    }

    return clone;

}

function _pluck(objects, prop) {

    var values = [];

    objects.forEach(function(o) {
        values.push(o[prop]);
    });

    return values;

}

function _getWindDirection(bearing) {
	var directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
	return directions[Math.round(bearing/45)];
}

function _getRainInterpolator(config) {

    var maxAt = 50,
        minAt = 0;

    if (config.rainUnit === 'inches')
        maxAt = maxAt/25.4;

    var interpolator = d3.interpolateRgb('#4BA7EB', '#0023AD');

    return function(value) {
        var x = (value - minAt) / (maxAt - minAt);
        x = Math.max(0, Math.min(x, 1));
        return interpolator(x);
    };

}

function _getWindInterpolator(config) {

    var multiplier,
        minAt = 0,
        strongAt = 50,
        maxAt = 100;

    switch (config.windUnit) {
        case 'knots':
           multiplier = 1/0.54;
           break;
        case 'mph':
           multiplier = 1/0.62137;
           break;
        case 'm/s':
           multiplier = 3.6;
           break;
        default:
            multiplier = 1;
    }

    var interpolators = {
        light: d3.interpolateRgb('#222222', '#808080'),
        strong: d3.interpolateRgb('#C76100', '#C70000')
    };

    return function(value) {

        var kmh = value * multiplier;
        var interpName;
        var interpMin;
        var interpMax;

        if (kmh < strongAt) {
            interpName = 'light';
            interpMin = minAt;
            interpMax = strongAt;
        } else {
            interpName = 'strong';
            interpMin = strongAt;
            interpMax = maxAt;
        }

        var x = (value - interpMin) / (interpMax - interpMin);
        x = Math.max(0, Math.min(x, 1));
        return interpolators[interpName](x);

    };

 }


})();
