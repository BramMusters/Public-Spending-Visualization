'use strict';

angular.module('myApp')

	.service('barChart', ['dataModel', function (dataModel) {
		this.chartConfig = {
			hide: true,
			sort: 'false',
			options: {
				chart: {
					type: 'bar',
					zoomType: 'x'
				},
				xAxis: {
					categories: [],
					title: {
						text: null
					}
				},
				yAxis: {
					title: {
						text: null
					}
				},
				legend: {
					enabled: false
				},
				plotOptions: {
					bar: {
						turboThreshold: 0
					}
				},
				tooltip: {
					useHTML: true,
					headerFormat: '<table><tr><th colspan="2"><h5>{point.key} ',
					pointFormatter: function() {
						var value = 0;
						if ( this.y > 1000000 ){ value = Highcharts.numberFormat( this.y/1000000, 3) + "M";}
						else {value = Highcharts.numberFormat(this.y,2);}
						return '(' + this.year +')</h5></th></tr> <tr><th style="color:' + this.series.color+ ';">' + this.series.name + ': </th><td>' + value + '</td></tr>';
					},
					footerFormat: '</table>',
					followPointer: true
				}
			}
		};
		this.chartConfigs = [this.chartConfig, angular.copy(this.chartConfig), angular.copy(this.chartConfig)];
		var self = this;

		var compare = function (a,b) {
			if (a.document.government.name < b.document.government.name)
				return -1;
			else if (a.document.government.name > b.document.government.name)
				return 1;
			else
				return 0;
		};

		this.mapData = function (firstValues, secondValues, thirdValues) {
			// Sort on government name
			firstValues.sort(compare);
			var categories = [];
			var data = self.chartConfigs[0].series[0].data;
			for (var i = 0; i < firstValues.length; i++) {
				categories.push(firstValues[i].document.government.name);
				data.push({
					y: firstValues[i].total,
					year: firstValues[i].document.year
				});
			}
			self.chartConfigs[0].options.xAxis.categories = categories;
			if (secondValues) {
				var categories = [];
				data = self.chartConfigs[1].series[0].data;
				secondValues.sort(compare);
				for (var i = 0; i < secondValues.length; i++) {
					categories.push(secondValues[i].document.government.name);
					data[i] = {
						y: secondValues[i].total,
						year: secondValues[i].document.year
					};
				}
				self.chartConfigs[1].options.xAxis.categories = categories;
			}
			if (thirdValues) {
				var categories = [];
				data = self.chartConfigs[2].series[0].data;
				thirdValues.sort(compare);
				for (var i = 0; i < thirdValues.length; i++) {
					categories.push(thirdValues[i].document.government.name);
					data[i] = {
						y: thirdValues[i].total,
						year: thirdValues[i].document.year
					};
				}
				self.chartConfigs[2].options.xAxis.categories = categories;
			}
		};

		var getSubList = function(combined, idx) {
			var list = [];
			for (var i = 0; i < combined.length; i++) {
				list.push(combined[i][idx]);
			}
			return list;
		};

		this.sort = function (idx) {
			var values = self.chartConfigs[idx].series[0].data;
			var cat1 = self.chartConfigs[idx].options.xAxis.categories;
			if (self.chartConfigs[(idx+1)%3].series != null) {
				var values2 = self.chartConfigs[(idx+1)%3].series[0].data;
				var cat2 = self.chartConfigs[(idx+1)%3].options.xAxis.categories;
			}
			if (self.chartConfigs[(idx+2)%3].series != null) {
				var values3 = self.chartConfigs[(idx + 2) % 3].series[0].data;
				var cat3 = self.chartConfigs[(idx+2)%3].options.xAxis.categories;
			}
			var combined = [];
			// Combine all values for sorting
			for (var i = 0; i < values.length; i++) {
				// 3 bar charts
				if (values2 && values3) {
					if (cat1[i] == cat2[i] && cat1 == cat3[i]) {
						combined.push([cat1[i], values[i], values2[i], values3[i]]);
					} else {
						// If an equal government was not found at the same index, search for it at other indices.
						for (var j = 0; j < values2.length; j++) {
							if (cat2[j] == cat1[i]) {
								// Found a matching 2nd, now find zValue
								for (var k = 0; k < values3.length; k++) {
									if (cat3[k] == cat1[i]) {
										combined.push([cat1[i], values[i], values2[j], values3[k]]);
										break;
									}
								}
							}
						}
					}
				//	2 Bar charts
				} else if (values2) {
					if (cat1[i] == cat2[i]) {
						combined.push([cat1[i], values[i], values2[i]]);
					} else {
						// If an equal government was not found at the same index, search for it at other indices.
						for (var j = 0; j < values2.length; j++) {
							if (cat2[j] == cat1[i]) {
								combined.push([cat1[i], values[i], values2[j]]);
								break;
							}
						}
					}
				} else if (values3) {
					if (cat1[i] == cat3[i]) {
						combined.push([cat1[i], values[i], values3[i]]);
					} else {
						// If an equal government was not found at the same index, search for it at other indices.
						for (var j = 0; j < values3.length; j++) {
							if (cat3[j] == cat1[i]) {
								combined.push([cat1[i], values[i], values3[j]]);
								break;
							}
						}
					}
				} else {
					combined.push([cat1[i], values[i]]);
				}
			}
			// Sort according to index
			if (self.chartConfigs[idx].sort == "false") {
				combined.sort(function(a, b) {
					return b[idx+1].y - a[idx + 1].y;
				});
				self.chartConfigs[idx].sort = "descending";
				self.chartConfigs[(idx+1)%3].sort = "false";
				self.chartConfigs[(idx+2)%3].sort = "false";
			} else if (self.chartConfigs[idx].sort == "descending") {
				combined.sort(function (a, b) {
					return a[idx + 1].y - b[idx + 1].y;
				});
				self.chartConfigs[idx].sort = "ascending";
				self.chartConfigs[(idx+1)%3].sort = "false";
				self.chartConfigs[(idx+2)%3].sort = "false";
			} else if (self.chartConfigs[idx].sort == "ascending") {
				combined.sort(function (a, b) {
					if ( a[0] < b[0] )
						return -1;
					if ( a[0] > b[0] )
						return 1;
					return 0;
				});
				self.chartConfigs[idx].sort = "false";
				self.chartConfigs[(idx+1)%3].sort = "false";
				self.chartConfigs[(idx+2)%3].sort = "false";
			}
			self.chartConfigs[idx].options.xAxis.categories = getSubList(combined, 0);
			self.chartConfigs[idx].series[0].data = getSubList(combined, idx + 1);
			if (values2) {
				self.chartConfigs[(idx+1)%3].series[0].data = getSubList(combined, (idx+1)%3 + 1);
				self.chartConfigs[(idx+1)%3].options.xAxis.categories = self.chartConfigs[idx].options.xAxis.categories
			}
			if (values3) {
				self.chartConfigs[(idx+2)%3].series[0].data = getSubList(combined, (idx+2)%3 + 1);
				self.chartConfigs[(idx+2)%3].options.xAxis.categories = self.chartConfigs[idx].options.xAxis.categories
			}
		};

		this.render = function () {
			if (dataModel.chartDimensions[0] != null) {
				var codeFirst = dataModel.chartDimensions[0].value.code;
				var directionX = dataModel.chartDimensions[0].value.direction;
				var firstValues = dataModel.returnDimensionPoints(codeFirst, directionX);
				var label1 = dataModel.metaData[codeFirst + directionX].label;
				self.chartConfigs[0].options.yAxis.title.text = label1;
				self.chartConfigs[0].chartSize = 12;
				self.chartConfigs[0].series = [
					{
						name: dataModel.metaData[codeFirst + directionX].label,
						data: []
					}
				];
				self.chartConfigs[1].series = null;
				self.chartConfigs[2].series = null;
				self.chartConfigs[0].title = {
					text: label1
				};
				if (directionX == "in") {
					self.chartConfigs[0].options.plotOptions.bar.color = "#00C851";
				} else {
					self.chartConfigs[0].options.plotOptions.bar.color = "#ff4444";
				}
				if (dataModel.chartDimensions[1]) {
					var code2nd = dataModel.chartDimensions[1].value.code;
					var direction2nd = dataModel.chartDimensions[1].value.direction;
					var secondValues = dataModel.returnDimensionPoints(code2nd, direction2nd);
					var label2 = dataModel.metaData[code2nd + direction2nd].label;
					self.chartConfigs[1].options.yAxis.title.text = label2;
					self.chartConfigs[1].title = {
						text: label2
					};
					self.chartConfigs[0].chartSize = 6;
					self.chartConfigs[1].series = [{
						name: dataModel.metaData[code2nd + direction2nd].label,
						data: []
					}];
					if (direction2nd == "in") {
						self.chartConfigs[1].options.plotOptions.bar.color = "#00C851";
					} else {
						self.chartConfigs[1].options.plotOptions.bar.color = "#ff4444";
					}
					self.chartConfigs[1].hide = false;
				}
				if (dataModel.chartDimensions[2]) {
					if (!dataModel.chartDimensions[1]) {
						dataModel.alerts.push({type: "danger", text: "Groep 2 moet gevuld zijn om groep 3 te laten zien."});
						self.chartConfigs[0].hide = true;
						return self.chartConfigs;
					}
					var code3rd = dataModel.chartDimensions[2].value.code;
					var direction3rd = dataModel.chartDimensions[2].value.direction;
					var thirdValues = dataModel.returnDimensionPoints(code3rd, direction3rd);
					var label3 = dataModel.metaData[code3rd + direction3rd].label;
					self.chartConfigs[2].options.yAxis.title.text = label3;
					self.chartConfigs[2].title = {
						text: label3
					};
					self.chartConfigs[0].chartSize = 4;
					self.chartConfigs[2].series = [{
						name: dataModel.metaData[code3rd + direction3rd].label,
						data: []
					}];
					if (direction3rd == "in") {
						self.chartConfigs[2].options.plotOptions.bar.color = "#00C851";
					} else {
						self.chartConfigs[2].options.plotOptions.bar.color = "#ff4444";
					}
					self.chartConfigs[2].hide = false;
				}
				self.mapData(firstValues, secondValues, thirdValues);
				self.chartConfigs[0].hide = false;
				return self.chartConfigs;
			} else {
				dataModel.alerts.push({type: "danger", text: "Eén of meerdere verplichte dimensies zijn niet gevuld."});
				self.chartConfigs[0].hide = true;
				return self.chartConfigs;
			}
		};
	}]);