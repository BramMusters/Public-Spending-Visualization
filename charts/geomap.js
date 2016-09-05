'use strict';

angular.module('myApp')

	.service('geoMap', ['dataModel', 'apiHandler', function (dataModel, apiHandler) {
		this.chartConfig = {
			hide: true,
			options: {
				plotOptions: {
					map: {
						mapData: Highcharts.maps['countries/nl/nl-all-all'],
						joinBy: 'name'
					}
				},
				mapNavigation: {
					enabled: true,
					enableMouseWheelZoom: false,
					buttonOptions: {
						verticalAlign: 'bottom'
					}
				},
				subtitle: {
					text: 'Source map: <a href="https://code.highcharts.com/mapdata/countries/nl/nl-all-all.js">The Netherlands, admin2</a>'
				},
				states: {
					hover: {
						color: '#BADA55'
					}
				},
				legend: {
					layout: 'horizontal'
				},
				colorAxis: {
					minColor: '#ffffff',
					min: 0,
					max: 1,
					endOnTick: false
				},
				tooltip: {
					headerFormat: '<span style="font-size:10px">{series.name}</span><br/>',
					pointFormatter: function() {
						var value = 0;
						if ( this.value > 1000000 ){ value = Highcharts.numberFormat( this.value/1000000, 3) + "M";}
						else {value = Highcharts.numberFormat(this.value,2);}
						return this.name + ": " + value;
					}
				},
				dataLabels: {
					enabled: true,
					format: '{point.name}'
				}
			},
			chartType: 'map',
			title: {
				text: 'Geografische kaart'
			},
			series: [{
				data: []
			}]
		};
		var self = this;

		this.mapData = function (values) {
			var data = self.chartConfig.series[0].data;
			var max = 0;
			var min = -1;
			for (var i = 0; i < values.length; i++) {
				var point = values[i];
				var name = point.document.government.name;
				// Change some names because the highmaps names and keys are not the same as data API
				if (name.substring(name.length-1) == ")") {
					if (name == "Bergen (Limburg)") {
						name = "Bergen (L,)";
					} else if (name == "Bergen (Noord-Holland)") {
						name = "Bergen (NH,)";
					} else if (name == "Den Haag (gemeente)") {
						name = "'s-Gravenhage";
					} else {
						name = name.substring(0, name.indexOf(' '));
					}
				}
				if (name == "Margraten") {
					name = "Eijsden-Margraten";
				} else if (name == "Den Bosch") {
					name = "'s-Hertogenbosch";
				}
				if (point.total < min || min == -1) {
					min = point.total;
				}
				if (point.total > max) {
					max = point.total;
				}
				data.push({
					name: name,
					value: point.total
				});
			}
			self.chartConfig.options.colorAxis.min = min;
			self.chartConfig.options.colorAxis.max = max;
		};
		this.render = function () {
			self.chartConfig.series[0].data = [];
			if (dataModel.chartDimensions[0] != null) {
				var codeFirst = dataModel.chartDimensions[0].value.code;
				var directionX = dataModel.chartDimensions[0].value.direction;
				var firstValues = dataModel.returnDimensionPoints(codeFirst, directionX);
				self.chartConfig.options.legend.title = {
					text: dataModel.metaData[codeFirst + directionX].label
				};
				self.chartConfig.title = {
					text: dataModel.metaData[codeFirst + directionX].label
				};
				self.chartConfig.series[0].name = dataModel.metaData[codeFirst + directionX].label;
				self.mapData(firstValues);
				if (apiHandler.period.min != apiHandler.period.max && dataModel.aggregateTime == false) {
					dataModel.alerts.push({type: "warning", text: "Meerdere jaren worden weergegeven, kies één jaar of aggregeer over tijd."});
				}
				if (directionX == "in") {
					self.chartConfig.options.colorAxis.maxColor = '#007E33';
				} else {
					self.chartConfig.options.colorAxis.maxColor = '#CC0000';
				}
				self.chartConfig.hide = false;
				return self.chartConfig;
			} else {
				dataModel.alerts.push({type: "danger", text: "Eén of meerdere verplichte dimensies zijn niet gevuld."});
				self.chartConfig.hide = true;
				return self.chartConfig;
			}
		};
	}])
;