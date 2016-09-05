'use strict';

angular.module('myApp')

	.service('treeMap', ['dataModel', 'apiHandler', function (dataModel, apiHandler) {
		this.chartConfig = {
			hide: true,
			options: {
				legend: {
					layout: 'horizontal'
				},
				plotOptions: {
					treemap: {
						color: '#33b5e5',
						turboThreshold: 0
					}
				},
				tooltip: {
					pointFormatter: function() {
						var value = this.value;
						if (this.value == null) {
							value = this.node.childrenTotal;
						}
						if ( value > 1000000 ){ value = Highcharts.numberFormat( value/1000000, 3) + "M";}
						else { value = Highcharts.numberFormat(value,2); }
						var idx = this.series.name.indexOf("&");
						var name = this.series.name;
						if (idx != -1) {name = this.series.name.substring(0, idx);}
						if (this.colorValue == null) {
							return name + ': ' + value;
						} else {
							var colorName = this.series.name.substring(idx+1);
							var colorValue = this.colorValue;
							if ( colorValue > 1000000 ){ colorValue = Highcharts.numberFormat( colorValue/1000000, 3) + "M";}
							else { colorValue = Highcharts.numberFormat(colorValue,2); }
							return name + ': ' + value + '<br>' + colorName + ': ' + colorValue;
						}
					}
				}
			},
			series: [{
				type: 'treemap',
				allowDrillToNode: true,
				dataLabels: {
					enabled: false
				},
				levelIsConstant: false,
				levels: [{
					level: 1,
					dataLabels: {
						enabled: true
					},
					borderWidth: 2
				}],
				layoutAlgorithm: 'squarified',
				data: []
			}]
		};
		var self = this;

		var createFirstLevel = function(level1) {
			// Add provinces for first level of treemap
			var data = self.chartConfig.series[0].data;
			if (level1 == "province") {
				for (var i = 0; i < dataModel.provinceNameList.length; i++) {
					var province = dataModel.provinceNameList[i];
					// Only include non-filtered provinces
					if (dataModel.provinceFilter == null || (dataModel.provinceNameList[dataModel.provinceFilter.min] <= province && dataModel.provinceNameList[dataModel.provinceFilter.max] >= province)) {
						data.push({
							id: dataModel.provinceNameList[i],
							name: dataModel.provinceNameList[i]
						});
					}
				}
			} else if (level1 == "year") {
				for (var year = apiHandler.period.min; year <= apiHandler.period.max; year ++) {
					data.push({
						id: "y" + year,
						name: year
					});
				}
			}
		};

		var createSecondLevel = function(level2) {
			var data = self.chartConfig.series[0].data;
			if (level2 == "province") {
				for (var i = 0; i < dataModel.provinceNameList.length; i++) {
					var province = dataModel.provinceNameList[i];
					// Only include non-filtered provinces
					if (dataModel.provinceFilter == null || (dataModel.provinceNameList[dataModel.provinceFilter.min] <= province && dataModel.provinceNameList[dataModel.provinceFilter.max] >= province)) {
						for (var year = apiHandler.period.min; year <= apiHandler.period.max; year++) {
							data.push({
								id: year + province,
								parent: "y" + year,
								name: province
							});
						}
					}
				}
			} else if (level2 == "year") {
				for (var year = apiHandler.period.min; year <= apiHandler.period.max; year ++) {
					for (var i = 0; i < dataModel.provinceNameList.length; i++) {
						var province = dataModel.provinceNameList[i];
						// Only include non-filtered provinces
						if (dataModel.provinceFilter == null || (dataModel.provinceNameList[dataModel.provinceFilter.min] <= province && dataModel.provinceNameList[dataModel.provinceFilter.max] >= province)) {
							data.push({
								id: year + dataModel.provinceNameList[i],
								parent: province,
								name: year
							});
						}
					}
				}
			}
		};

		var addPoint = function(data, sizeItem, colorValue, level1, level2) {
			if (level1 == "year" && level2 == null) {
				data.push({
					name: sizeItem.document.government.name,
					parent: "y" + sizeItem.document.year,
					value: sizeItem.total,
					colorValue: colorValue
				});
			} else if (level1 == "province" && level2 == null) {
				data.push({
					name: sizeItem.document.government.name,
					parent: sizeItem.document.government.state,
					value: sizeItem.total,
					colorValue: colorValue
				});
			} else if ((level1 == "province" && level2 == "year") || (level1 == "year" && level2 == "province") ) {
				data.push({
					name: sizeItem.document.government.name,
					parent: sizeItem.document.year + sizeItem.document.government.state,
					value: sizeItem.total,
					colorValue: colorValue
				});
			}
		};

		this.mapColoredData = function (sizeValues, colorValues, level1, level2) {
			var data = self.chartConfig.series[0].data;
			for (var i = 0; i < sizeValues.length; ++i) {
				if (colorValues[i] != null && colorValues[i].id == sizeValues[i].id) {
					addPoint(data, sizeValues[i], colorValues[i].total, level1, level2);
				} else {
					// If an equal id was not found at the same index, search for it at other indices.
					for (var j = 0; j < colorValues.length; j++) {
						if (colorValues[j].id == sizeValues[i].id) {
							addPoint(data, sizeValues[i], colorValues[j].total, level1, level2);
							break;
						}
					}
				}
			}
		};

		this.mapData = function (sizeValues, level1, level2) {
			var data = self.chartConfig.series[0].data;
			var key = null;
			for (var i = 0; i < sizeValues.length; ++i) {
				var sizeItem = sizeValues[i];
				if (level1 == "year" && level2 == null) {
					data.push({
						name: sizeItem.document.government.name,
						parent: "y" + sizeItem.document.year,
						value: sizeItem.total
					});
				} else if (level1 == "province" && level2 == null) {
					data.push({
						name: sizeItem.document.government.name,
						parent: sizeItem.document.government.state,
						value: sizeItem.total
					});
				} else if ((level1 == "province" && level2 == "year") || (level1 == "year" && level2 == "province") ) {
					data.push({
						name: sizeItem.document.government.name,
						parent: sizeItem.document.year + sizeItem.document.government.state,
						value: sizeItem.total
					});
				}
			}
		};

		this.render = function () {
			self.chartConfig.series[0].data = [];
			if (dataModel.chartDimensions[0] != null && dataModel.chartDimensions[2] != null) {
				var codeFirst = dataModel.chartDimensions[0].value.code;
				var directionX = dataModel.chartDimensions[0].value.direction;
				var firstValues = dataModel.returnDimensionPoints(codeFirst, directionX);
				self.chartConfig.series[0].name = dataModel.metaData[codeFirst + directionX].label;
				var level1 = dataModel.chartDimensions[2].value;
				var level1lb = dataModel.chartDimensions[2].label;
				self.chartConfig.title = {
					text: dataModel.metaData[codeFirst + directionX].label + ", gegroepeerd door " + level1lb
				};
				createFirstLevel(level1);
				if (dataModel.chartDimensions[3]) {
					var level2 = dataModel.chartDimensions[3].value;
					var level2lb = dataModel.chartDimensions[3].label;
					self.chartConfig.title.text += " en " + level2lb;
					createSecondLevel(level2);
				}
				self.chartConfig.title.text += ".";
				if (level1 == "county" || level2 == "county") {
					dataModel.alerts.push({type: "danger", text: "'Gemeente' is niet ondersteund als dimensie"});
					self.chartConfig.hide = true;
					return self.chartConfig;
				}
				if (dataModel.chartDimensions[1]) {
					var code2nd = dataModel.chartDimensions[1].value.code;
					var direction2nd = dataModel.chartDimensions[1].value.direction;
					var secondValues = dataModel.returnDimensionPoints(code2nd, direction2nd);
					var label2 = dataModel.metaData[code2nd + direction2nd].label;
					// Hack to get color value label in treemap
					self.chartConfig.series[0].name += "&" + label2;
					self.chartConfig.options.legend.title = {
						text: dataModel.metaData[code2nd + direction2nd].label
					};
					self.chartConfig.options.colorAxis = {
						minColor: '#ffffff',
						endOnTick: false
					};
					if (direction2nd == "in") {
						self.chartConfig.options.colorAxis.maxColor = '#007E33';
					} else {
						self.chartConfig.options.colorAxis.maxColor = '#CC0000';
					}
					self.chartConfig.title.text = dataModel.metaData[codeFirst + directionX].label + ", gekleurd door " + label2 + ", gegroepeerd door " + level1lb;
					if (dataModel.chartDimensions[3]) {
						var level2 = dataModel.chartDimensions[3].value;
						var level2lb = dataModel.chartDimensions[3].label;
						self.chartConfig.title.text += " en " + level2lb;
					}
					self.chartConfig.title.text += ".";
					self.mapColoredData(firstValues, secondValues, level1, level2);
				} else {
					self.mapData(firstValues, level1, level2);
				}
				self.chartConfig.hide = false;
				return self.chartConfig;
			} else {
				dataModel.alerts.push({type: "danger", text: "Eén of meerdere verplichte dimensies zijn niet gevuld."});
				self.chartConfig.hide = true;
				return self.chartConfig;
			}
		};
	}]);