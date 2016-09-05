'use strict';

angular.module('myApp')

	.service('scatterChart', ['dataModel', function (dataModel) {
		this.chartConfig = {
			hide: true,
			options: {
				chart: {
					type: 'bubble',
					plotBorderWidth: 1,
					zoomType: 'xy'
				},

				xAxis: {
					title: {
						text: 'Test'
					}
				},
				yAxis: {
					title: {
						text: 'Hallo'
					}
				},

				plotOptions: {
					scatter: {
						marker: {
							radius: 5
						},
						turboThreshold: 0
					},
					bubble: {
						minSize: 2,
						maxSize: 60,
						turboThreshold: 0
					}
				},

				tooltip: {
					useHTML: true,
					headerFormat: '<table>',
					pointFormatter: function() {
						var x;
						if ( this.x > 1000000000 ){ x = Highcharts.numberFormat( this.x/1000000000, 2) + "B";}
						else if ( this.x > 1000000 ){ x = Highcharts.numberFormat( this.x/1000000, 2) + "M";}
						else { x = Highcharts.numberFormat(this.x,2);}
						var y;
						if ( this.y > 1000000000 ){ y = Highcharts.numberFormat( this.y/1000000000, 2) + "B";}
						else if ( this.y > 1000000 ){ y = Highcharts.numberFormat( this.y/1000000, 2) + "M";}
						else { y = Highcharts.numberFormat(this.y,2);}
						var z;
						if (z == 0) {
							return '<tr><th colspan="2"><h5>' + this.name + '</h5></th></tr>' +
								'<tr><th>X waarde:</th><td>' + x + '</td></tr>' +
								'<tr><th>Y waarde:</th><td>' + y + '</td></tr>';
						}
						if ( this.z > 1000000000 ){ z = Highcharts.numberFormat( this.z/1000000000, 2) + "B";}
						else if ( this.z > 1000000 ){ z = Highcharts.numberFormat( this.z/1000000, 2) + "M";}
						else { z = Highcharts.numberFormat(this.z,2);}
						return '<tr><th colspan="2"><h5>' + this.name + '</h5></th></tr>' +
							'<tr><th>X waarde:</th><td>' + x + '</td></tr>' +
							'<tr><th>Y waarde:</th><td>' + y + '</td></tr>' +
							'<tr><th>Grootte:</th><td>' + z + '</td></tr>';
					},
					footerFormat: '</table>',
					followPointer: true
				}
			}
		};
		var self = this;

		var createTooltip = function(xLabel, yLabel, zLabel, groupBy) {
			self.chartConfig.options.tooltip.pointFormat =
				'<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
				'<tr><th>' + xLabel + ': </th><td>{point.x}</td></tr>' +
				'<tr><th>' + yLabel + ': </th><td>{point.y}</td></tr>';
			if (zLabel != null) {
				self.chartConfig.options.tooltip.pointFormat += '<tr><th>' + zLabel + ': </th><td>{point.z}</td></tr>';
			}
			if (groupBy != "year") {
				self.chartConfig.options.tooltip.pointFormat += '<tr><th>Jaar: </th><td>{point.year}</td></tr>';
			}
		};

		// Set correct name for data series according to groupBy
		var getSeriesName = function (item, groupBy) {
			var seriesName = item.document.government.name;
			if (groupBy == "year") {
				seriesName = item.document.year;
			} else if (groupBy == "province") {
				seriesName = item.document.government.state;
			}
			return seriesName;
		};

		// Adds Scatter data point to total dataset
		var addPoint = function (xItem, yVal, series, groupBy, zVal) {
			// Don't add 0,0 values
			if ((xItem.total != 0 || yVal != 0)) {
				var newPoint = {
						x: xItem.total,
						y: yVal,
						name: xItem.document.government.name
					};
				if (zVal != null) {
					// Don't add point with size 0
					if (zVal == 0) {
						return;
					}
					newPoint.z = zVal;
				}
				if (groupBy != "year") {
					newPoint.year = xItem.document.year;
				}
				if (groupBy) {
					// set name for series of data according to groupBy
					var seriesName = getSeriesName(xItem, groupBy);
					var isAdded = false;
					// Search for correct series.
					for (var i = 0; i < series.length; ++i) {
						if (series[i].name == seriesName) {
							series[i].data.push(newPoint);
							isAdded = true;
							break;
						}
					}
					// Add new series if didn't exist yet
					if (isAdded == false) {
						series.push({
							name: seriesName,
							data: [newPoint]
						});
					}
				} else {
					// No groupBy is specified, each point same series.
					series[0].data.push(newPoint);
				}
			}
			return;
		};

		// Map data without size
		this.mapScatterData = function (xValues, yValues, groupBy) {
			var series = [];
			if (groupBy == null) {
				series.push({
					name: 'Alles',
					data: []
				});
			}
			for (var i = 0; i < xValues.length; ++i) {
				if (yValues[i] != null && yValues[i].id == xValues[i].id) {
					addPoint(xValues[i], yValues[i].total, series, groupBy);
				} else {
					// If an equal id was not found at the same index, search for it at other indices.
					for (var j = 0; j < yValues.length; j++) {
						if (yValues[j].id == xValues[i].id) {
							addPoint(xValues[i], yValues[j].total, series, groupBy);
							break;
						}
					}
				}
			}
			return series;
		};

		this.mapBubbleData = function(xValues, yValues, zValues, groupBy) {
			var series = [];
			if (groupBy == null) {
				series.push({
					name: 'Alles',
					data: []
				});
			}
			for (var i = 0; i < xValues.length; ++i) {
				if (yValues[i] != null && yValues[i].id == xValues[i].id
					&& zValues[i] != null && zValues[i].id == xValues[i].id) {
					addPoint(xValues[i], yValues[i].total, series, groupBy, zValues[i].total);
				} else {
					// If an equal id was not found at the same index, search for it at other indices.
					for (var j = 0; j < yValues.length; j++) {
						if (yValues[j].id == xValues[i].id) {
							// Found a matching yValue, now find zValue
							for (var k = 0; k < zValues.length; k++) {
								if (zValues[k].id == xValues[i].id) {
									addPoint(xValues[i], yValues[j].total, series, groupBy, zValues[k].total);
									break;
								}
							}
						}
					}
				}
			}
			return series;
		};

		this.render = function () {
			if (dataModel.chartDimensions[0] != null && dataModel.chartDimensions[1] != null) {
				var codeX = dataModel.chartDimensions[0].value.code;
				var directionX = dataModel.chartDimensions[0].value.direction;
				var xValues = dataModel.returnDimensionPoints(codeX, directionX);

				var codeY = dataModel.chartDimensions[1].value.code;
				var directionY = dataModel.chartDimensions[1].value.direction;
				var yValues = dataModel.returnDimensionPoints(codeY, directionY);

				var xLabel = dataModel.metaData[codeX + directionX].label;
				self.chartConfig.options.xAxis.title.text = xLabel;
				var yLabel = dataModel.metaData[codeY + directionY].label;
				self.chartConfig.options.yAxis.title.text = yLabel;

				self.chartConfig.title = {
					text: xLabel + " en " + yLabel + " geplot"};
				// Check if color coding should be used
				var groupBy = null;
				if (dataModel.chartDimensions[3]) {
					groupBy = dataModel.chartDimensions[3].value;
					var groupLabel = dataModel.chartDimensions[3].label;
					self.chartConfig.title.text += ", gekleurd door " + groupLabel;
				}
				var zLabel = null;
				// Set size according to zValues
				if (dataModel.chartDimensions[2]) {
					self.chartConfig.options.chart.type = "bubble";
					var codeZ = dataModel.chartDimensions[2].value.code;
					var directionZ = dataModel.chartDimensions[2].value.direction;
					var zValues = dataModel.returnDimensionPoints(codeZ, directionZ);
					self.chartConfig.series = self.mapBubbleData(xValues, yValues, zValues, groupBy);
					var zLabel = dataModel.metaData[codeZ + directionZ].label;
					self.chartConfig.title.text += ", de grootte bepaald door " + zLabel;
				} else {
					// No size set, render a scatter chart
					self.chartConfig.options.chart.type = "scatter";
					self.chartConfig.series = self.mapScatterData(xValues, yValues, groupBy);
				}
				self.chartConfig.title.text += ".";
				createTooltip(xLabel, yLabel, zLabel, groupBy);
				self.chartConfig.hide = false;
				return self.chartConfig;
			} else {
				dataModel.alerts.push({type: "danger", text: "Eén of meerdere verplichte dimensies zijn niet gevuld."});
				self.chartConfig.hide = true;
				return self.chartConfig;
			}
		};
	}]);