'use strict';

angular.module('myApp')

	.service('lineChart', ['dataModel', 'apiHandler', function (dataModel, apiHandler) {
		this.chartConfig = {
			options: {
				chart: {
					type: 'line'
				},
				plotOptions: {
					line: {
						turboThreshold: 0
					}
				},
				tooltip: {
					pointFormatter: function() {
						var value = this.y;
						if ( value > 1000000 ){ value = Highcharts.numberFormat( this.y/1000000, 3) + "M";}
						else { value = Highcharts.numberFormat(this.y,2); }
						return this.series.name + ': ' + value;
					}
				}
			},
			title: {
				text: "Line Chart"
			},
			xAxis: {
				categories: []
			},
			hide: true
		};
		var self = this;

		var createCategories = function () {
			var categories = self.chartConfig.xAxis.categories = [];
			for (var i = apiHandler.period.min; i <= apiHandler.period.max; i ++) {
				categories.push(i);
			}
		};
		
		this.mapData = function (values) {
			var categories = self.chartConfig.xAxis.categories;
			var series = [];
			for (var i = 0; i < values.length; i++) {
				var point = values[i];
				var isAdded = false;
				for (var j = 0; j < series.length; j++) {
					if (point.document.government.name == series[j].name) {
						// Append total at correct direction
						series[j].data[point.document.year - categories[0]] = point.total;
						isAdded = true;
						break;
					}
				}
				// Add new serie
				if (isAdded == false) {
					var data = new Array(categories.length).fill(0);
					data[point.document.year - categories[0]] = point.total;
					series.push(
						{
							name: point.document.government.name,
							data: data
						}
					)
				}
			}
			self.chartConfig.series = series;
		};

		this.render = function () {
			if (dataModel.chartDimensions[0] != null) {
				var codeFirst = dataModel.chartDimensions[0].value.code;
				var directionX = dataModel.chartDimensions[0].value.direction;
				var label1 = dataModel.metaData[codeFirst + directionX].label;
				createCategories();
				var firstValues = dataModel.returnDimensionPoints(codeFirst, directionX);
				self.chartConfig.title = {
					text: label1 + " over "
				};
				if (apiHandler.period.min == apiHandler.period.max) {
					self.chartConfig.title.text += "het jaar " + apiHandler.period.min + ".";
				} else {
					self.chartConfig.title.text += "de jaren " + apiHandler.period.min + " tot " + apiHandler.period.max + ".";
				}
				self.mapData(firstValues);
				self.chartConfig.hide = false;
				return self.chartConfig;
			} else {
				dataModel.alerts.push({type: "danger", text: "Eén of meerdere verplichte dimensies zijn niet gevuld."});
				self.chartConfig.hide = true;
				return self.chartConfig;
			}
		};
	}]);