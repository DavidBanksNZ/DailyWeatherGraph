(function() {

'use strict';

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
    var container = d3.select(config.container);
    container.html('');

    // Insert the SVG element and apply the margins
    var svgEl = container.append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .attr('class',  _className('root'));

    // Background rect for whole SVG area
    svgEl.append('rect')
        .attr('class',  _className('graph-background'))
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', config.width)
        .attr('height', config.height);

    // Background rect for whole plot area
    var plotArea = svgEl.append('rect')
        .attr('class',  _className('plot-area-background'))
        .attr('x', dim.marginLeft)
        .attr('y', dim.marginTop)
        .attr('width', dim.plotAreaWidth)
        .attr('height', dim.plotAreaHeight)
        .attr('pointer-events', 'all');

    // Key function for binding data to elements
    var keyFunc = function(d) {
        return d.date;
    };

    // Create definitions for wind icons & arrows
    var defs = svgEl.append('defs');
    _createWindIndicatorDefs(defs, dim);

    // Get the SVG context we will be drawing in (simply applies the margins).
    var svg = svgEl.append('g')
        .attr('class', _className('plot-area'))
        .attr('transform', 'translate(' + dim.marginLeft + ',' + dim.marginTop + ')')
        .attr('pointer-events', 'none');

    // The x scale. Make sure there is good spacing between points.
    var xScale = d3.scaleBand()
        .domain(_mapVariable(config.data, 'date'))
        .rangeRound([0, dim.plotAreaWidth])
        .paddingInner(0.25)
        .paddingOuter(0);

    _drawWindRegion(svg, xScale, config, dim, keyFunc);
    _drawTemperatureRegion(svg, xScale, config, dim, keyFunc);
    _drawRainRegion(svg, xScale, config, dim, keyFunc);

    // Insert day separator(s) between months. To do so, need to get the positions
    // of the two points and average them, then add half the interval width.

    var dateFormat = d3.timeFormat(config.dateFormat);
    var dateParser = d3.timeParse(dateFormat);

    var daysOfMonth = config.data.map(function(d) {
        return dateParser(d.date).getDate();
    });

    var indexOfNewMonth = daysOfMonth.indexOf(1);

    while (indexOfNewMonth !== -1) {

        if (indexOfNewMonth < numPoints && indexOfNewMonth > 0) {

            var prevMonthDate = data[indexOfNewMonth - 1].date,
                currMonthDate = data[indexOfNewMonth].date,
                newMonthLineX = (xScale(prevMonthDate) + xScale(currMonthDate)) / 2 + xScale.bandwidth() / 2;

            svg.append('line')
                .attr('class', _className('vertical-separator'))
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
        .style('stroke', '#BBB')
        .style('stroke-width', '1px')
        .style('stroke-opacity', 0);

    // Create the x axis, with no ticks showing.
    var xAxis = d3.axisBottom()
        .scale(xScale)
        .tickSizeInner(0)
        .tickSizeOuter(0.5) // seems to be a D3 bug, need to set to 0.5 to get no tick at the left side of the axis
        .tickFormat(function(date) {
            return parseInt(date.substr(-2), 10);
        });

    // Draw the x axis and labels
    // Draw the x axis and labels
    svg.append('g')
        .attr('class', _className('axis') + ' ' + _className('x-axis'))
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
        .attr('cx', dim.windSize / 2)
        .attr('cy', dim.windSize / 2)
        .attr('stroke-width', '1.3px')
        .attr('r', dim.windCircleRadius);

    var indicator_y0 = dim.windSize / 2 - dim.windCircleRadius + 4,
        indicator_length = 8,
        indicator_y1 = indicator_y0 - indicator_length,
        indicator_x0 = dim.windSize / 2 - indicator_length / 2,
        indicator_x1 = dim.windSize / 2 + indicator_length / 2;

    defs.append('g')
        .attr('id', 'daily-weather-graph-wind-indicator')
        .append('path')
        .attr('d', 'M' + indicator_x0 + ',' + indicator_y1 +
            ' L' + indicator_x1 + ',' + indicator_y1 +
            ' L' + dim.windSize / 2 + ',' + indicator_y0 +
            ' L' + indicator_x0 + ',' + indicator_y1);

}



function _drawRainRegion(svg, xScale, config, dim, keyFunc) {

    var lowestRainScaleMax = config.rainUnit === 'inches' ? 0.4 : 10,
        rainDecimals = (config.rainUnit === 'inches' ? 2 : 1);

    // Filter any NA values
    var rainTotals = _mapVariable(config.data, 'rainfall').filter(function(r) {
        return r !== config.missingValue;
    });

    // The rain scale. Leave space at top for labels.
    var rainScale = d3.scaleLinear()
        .range([0, dim.rainRegionHeight - 30])
        .domain([0, Math.max(lowestRainScaleMax, d3.max(rainTotals))])
        .clamp(true);

    var rainInterpolator = _getRainInterpolator(config),
        rainRegion = svg.append('g').attr('class', _className('rain-region'));

    rainRegion.append('rect')
        .attr('class',  _className('rain-region-background'))
        .attr('x', 0)
        .attr('y', dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing / 2)
        .attr('width', dim.plotAreaWidth)
        .attr('height', dim.rainRegionHeight + dim.regionSpacing / 2);

    var rainBars = rainRegion.append('g').attr('class',  _className('rain-bars')),
        rainLabels = rainRegion.append('g').attr('class',  _className('rain-labels'));

    // Insert the rainfall bars
    rainBars.selectAll('rect.rain-bar')
        .data(config.data, keyFunc)
        .enter()
        .append('rect')
        .attr('class',  _className('rain-bar'))
        .style('fill', function(d) {
            return (d.rainfall === 0 || d.rainfall === config.missingValue ?
                'none' :
                rainInterpolator(d.rainfall));
        })
        .style('stroke', function(d) {
            if (d.rainfall === 0 || d.rainfall === config.missingValue)
                return 'none';
            var col = rainInterpolator(d.rainfall);
            return d3.rgb(col).darker(0.8);
        })
        .attr('x', function(d) { return xScale(d.date);})
        .attr('y', function(d) {
            return dim.plotAreaHeight - (d.rainfall === config.missingValue ?
                0 :
                rainScale(d.rainfall));
        })
        .attr('width', xScale.bandwidth())
        .attr('height', function(d) {
            return (d.rainfall === config.missingValue ?
                0 :
                rainScale(d.rainfall));
        });

    // Insert the bar labels
    // For zero rainfall, insert a small dot instead, and increase its font size.
    // Remember to check values are all at least 0.
    rainLabels.selectAll('text.rain-label')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class', function(d) {
            return (d.rainfall === config.missingValue ?
                _className('missing-label') :
                _className('rain-label'));
        })
        .attr('text-anchor', 'middle')
        .attr('x', function(d) {return xScale(d.date) + xScale.bandwidth() / 2;})
        .attr('y', function(d) {
            var r = (d.rainfall === config.missingValue ? 0 : d.rainfall);
            return dim.plotAreaHeight - rainScale(r) - 8;
        })
        .style('font-size', function(d) {
            return d.rainfall === 0 ? '15px' : '';
        })
        .text(function(d) {
            if (d.rainfall > 0) {
                var z = Math.pow(10, rainDecimals);
                var label = Math.round(z * d.rainfall) / z;
                // For 2 dp values, remove leading zero
                //  so labels are not too crammed together
                if (label < 0.1) {
                    label = ('' + label).substring(1);
                }
                return label;
            }
            return d.rainfall === 0 ? '.' : config.missingValueText;
        });

    // Draw rainfall label in top left of rain region
    rainRegion.append('text')
        .attr('class',  _className('section-label'))
        .attr('x', 5)
        .attr('y', dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing / 2)
        .attr('dy', '1.3em')
        .text('Daily rainfall (' + config.rainfallUnit + ')');

    // Draw rain total label at top-right of rain region
    rainRegion.append('text')
        .attr('class',  _className('statistic-label'))
        .attr('x', dim.plotAreaWidth - 5)
        .attr('y', dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing / 2)
        .attr('text-anchor', 'end')
        .attr('dy', '1.3em')
        .text('Total: ' + d3.sum(rainTotals).toFixed(rainDecimals));

    // Add line to separate rain region from temperature region
    rainRegion.append('line')
        .attr('class',  _className('region-separator'))
        .attr('transform', 'translate(0,' + (dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing / 2) + ')')
        .attr('x1', 0)
        .attr('x2', dim.plotAreaWidth)
        .attr('y1', 0)
        .attr('y2', 0);

}



function _drawTemperatureRegion(svg, xScale, config, dim, keyFunc) {

    // The temperature scale
    var tempScale = d3.scaleLinear()
        .range([dim.plotAreaHeight - dim.rainRegionHeight - dim.regionSpacing,
                dim.windRegionHeight + dim.regionSpacing]);

    // Calculate the range of the temperature data.
    var highTemps = _mapVariable(config.data, 'highTemperature'),
        lowTemps = _mapVariable(config.data, 'lowTemperature');

    var validTemps = highTemps.concat(lowTemps).filter(function(t) {
        return t !== config.missingValue;
    });

    var tempScaleLimits = d3.extent(validTemps),
        tempScaleRange = tempScaleLimits[1] - tempScaleLimits[0];

    // Pad out the temperature axis limits, more so at the top.
    // If there is no variation throughout the period, use +/- 1 degree
    tempScaleLimits[0] = Math.floor(tempScaleLimits[0]) - Math.max(1, 0.15 * tempScaleRange);
    tempScaleLimits[1] = Math.ceil(tempScaleLimits[1]) + Math.max(1, 0.25 * tempScaleRange);

    // Set the domain of the temperature scale
    tempScale.domain(tempScaleLimits);

    // D3 line function for calculating temperature path coordinates
    var lowTemperatureLine = d3.line()
        .x(function(d) { return xScale(d.date) + xScale.bandwidth() / 2; })
        .y(function(d) { return tempScale(d.lowTemperature); });

    var highTemperatureLine = d3.line()
        .x(function(d) { return xScale(d.date) + xScale.bandwidth() / 2; })
        .y(function(d) { return tempScale(d.highTemperature); });

    lowTemperatureLine.defined(function(d) {
        return d.lowTemperature !== config.missingValue;
    });

    highTemperatureLine.defined(function(d) {
        return d.highTemperature !== config.missingValue;
    });

    var tempRegion = svg.append('g').attr('class',  _className('temperature-region'));

    tempRegion.append('rect')
        .attr('class',  _className('temperature-region-background'))
        .attr('x', 0)
        .attr('y', dim.windRegionHeight + dim.regionSpacing / 2)
        .attr('width', dim.plotAreaWidth)
        .attr('height', dim.tempRegionHeight + dim.regionSpacing);

    // Draw the temperature lines
    tempRegion.append('path')
        .attr('class',  _className('temperature-low-path'))
        .attr('d', lowTemperatureLine(config.data));

    tempRegion.append('path')
        .attr('class',  _className('temperature-high-path'))
        .attr('d', highTemperatureLine(config.data));

    var tempHighLabels = tempRegion.append('g').attr('class',  _className('temperature-high-labels')),
        tempLowLabels = tempRegion.append('g').attr('class',  _className('temperature-low-labels'));

    // Draw the high temperature labels
    tempHighLabels.append('g')
        .selectAll('text')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class',  _className('temperature-high-label'))
        .attr('x', function(d) { return xScale(d.date) + xScale.bandwidth() / 2; })
        .attr('y', function(d) { return tempScale(d.highTemperature); })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return (d.highTemperature === config.missingValue ? '' : d.highTemperature);
        });

    // Draw the low temperature labels
    tempLowLabels.append('g')
        .selectAll('text')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class',  _className('temperature-low-label'))
        .attr('x', function(d) { return xScale(d.date) + xScale.bandwidth() / 2; })
        .attr('y', function(d) { return tempScale(d.lowTemperature); })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return (d.lowTemperature === config.missingValue ? '' : d.lowTemperature);
        });

    // Draw the temperature region and wind region separator
    tempRegion.append('line')
        .attr('class',  _className('region-separator'))
        .attr('transform', 'translate(0,' + (dim.windRegionHeight + dim.regionSpacing / 2) + ')')
        .attr('x1', 0)
        .attr('x2', dim.plotAreaWidth)
        .attr('y1', 0)
        .attr('y2', 0);

    // Draw temperature label in top left of temperature region
    tempRegion.append('text')
        .attr('class',  _className('section-label'))
        .attr('x', 5)
        .attr('y', dim.windRegionHeight + dim.regionSpacing / 2)
        .attr('dy', '1.3em')
        .text('High and low temperatures (°' + config.temperatureUnit + ')');

}



function _drawWindRegion(svg, xScale, config, dim, keyFunc) {

    // Draw the arrows with <use> elements. They need to be rotated according to the
    // wind direction at a particular point.

    var windInterpolator = _getWindInterpolator(config);
    var y = 35;

    var windRegion = svg.append('g').attr('class',  _className('wind-region'));

    windRegion.append('rect')
        .attr('class',  _className('wind-region-background'))
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', dim.plotAreaWidth)
        .attr('height', dim.windRegionHeight + dim.regionSpacing / 2);

    var windIcons = windRegion.append('g').attr('class',  _className('wind-icons')),
        windArrows = windRegion.append('g').attr('class',  _className('wind-arrows')),
        windGustLabels = windRegion.append('g').attr('class',  _className('wind-gust-labels')),
        windDirLabels = windRegion.append('g').attr('class',  _className('wind-direction-labels'));

    windIcons.selectAll('wind-icon')
        .data(config.data, keyFunc)
        .enter()
        .append('use')
        .attr('xlink:href', '#daily-weather-graph-wind-icon')
        .attr('transform', function(d) {
            if (d.highWindGustBearing === config.missingValue)
                return '';
            var trans_x = (xScale(d.date) + xScale.bandwidth() / 2);
            return 'translate(' + (trans_x - dim.windSize / 2) + ',' + y + ')';
        })
        .style('fill', function(d) {
            return (d.highWindGust === config.missingValue ?
                'none' :
                windInterpolator(d.highWindGust));
        })
        .style('stroke', function(d) {
            if (d.highWindGust === config.missingValue)
                return 'none';
            var col = windInterpolator(d.highWindGust);
            return d3.rgb(col).darker(1.25);
        });

    // Draw wind indicators

    windArrows.selectAll('wind-arrow')
        .data(config.data, keyFunc)
        .enter()
        .append('use')
        .attr('xlink:href', '#daily-weather-graph-wind-indicator')
        .attr('transform', function(d) {
            if (d.highWindGustBearing === config.missingValue)
                return '';
            var trans_x = (xScale(d.date) + xScale.bandwidth() / 2),
                rotate = 45 * Math.round(d.highWindGustBearing / 45);
            return 'translate(' + (trans_x - dim.windSize / 2) + ',35) rotate(' +
                rotate + ' ' + dim.windSize / 2 + ' ' + dim.windSize / 2 + ')';
        })
        .style('fill', function(d) {
            return (d.highWindGustBearing === config.missingValue || Math.round(d.highWindGust) === 0 ?
                'none' :
                '#000000');
        })
        .style('stroke', function(d) {
            return (d.highWindGustBearing === config.missingValue || Math.round(d.highWindGust) === 0 ?
                'none' :
                '#FFFFFF');
        });

    // Draw the labels for wind direction and speed
    windGustLabels.selectAll('text.wind-gust-label')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class', function(d) {
            return (d.highWindGust === config.missingValue ?
                _className('na-label') :
                _className('wind-gust-label'));
        })
        .attr('x', function(d) { return xScale(d.date) + xScale.bandwidth() / 2; })
        .attr('y', y + dim.windSize / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return (d.highWindGust === config.missingValue ?
                config.missingValueText :
                Math.round(d.highWindGust));
        });

    windDirLabels.selectAll('text.wind-direction-label')
        .data(config.data, keyFunc)
        .enter()
        .append('text')
        .attr('class',  _className('wind-direction-label'))
        .attr('x', function(d) { return xScale(d.date) + xScale.bandwidth() / 2; })
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return (d.highWindGustBearing === config.missingValue || Math.round(d.highWindGust) === 0 ?
                '' :
                _getWindDirection(d.highWindGustBearing));
        });

    // Draw wind label in top left of wind region
    windRegion.append('text')
        .attr('class',  _className('section-label'))
        .attr('x', 5)
        .attr('y', 5)
        .attr('dy', '0.8em')
        .text('Peak wind gust (' + config.windUnit + ')');

}



/*---------------------------- Utility functions ----------------------------*/

function _className(className) {
    return 'dwg-' + className;
}

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

function _mapVariable(objects, prop) {
    return objects.map(function(obj) {
        return obj[prop];
    });
}

function _getWindDirection(bearing) {
    var directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    return directions[Math.round(bearing / 45)];
}

function _getRainInterpolator(config) {

    var maxAt = config.rainUnit === 'inches' ? 2 : 50,
        interpolator = d3.interpolateRgb('#4BA7EB', '#0023AD');

    return function(value) {
        var x = Math.max(0, Math.min(value / maxAt, 1));
        return interpolator(x);
    };

}

function _getWindInterpolator(config) {

    var multiplier,
        strongAt = 50,
        maxAt = 100;

    switch (config.windUnit) {
        case 'knots':
           multiplier = 1 / 0.54;
           break;
        case 'mph':
           multiplier = 1 / 0.62137;
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
        var interpolatorName, interpolatorMin, interpolatorMax;

        if (kmh < strongAt) {
            interpolatorName = 'light';
            interpolatorMin = 0;
            interpolatorMax = strongAt;
        } else {
            interpolatorName = 'strong';
            interpolatorMin = strongAt;
            interpolatorMax = maxAt;
        }

        var x = (value - interpolatorMin) / (interpolatorMax - interpolatorMin);
        x = Math.max(0, Math.min(x, 1));
        return interpolators[interpolatorName](x);

    };

}

})();
