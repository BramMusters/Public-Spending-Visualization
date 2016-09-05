'use strict';

angular.module('myApp')

	.controller('chartCtrl', ['$http', '$scope', '$timeout', 'dataModel', 'apiHandler', 'scatterChart', 'barChart', 'treeMap', 'lineChart','geoMap', function ($http, $scope, $timeout, dataModel, apiHandler, scatterChart, barChart, treeMap, lineChart, geoMap) {
		$scope.dataModel = dataModel;
		$scope.chartReady = 'disabled';
		$scope.barChart = barChart;

		// Set Highcharts options
		Highcharts.setOptions({
			lang: {
				thousandsSep: ".",
				decimalPoint: ","
			},
			colors: ['#2196f3', '#00bcd4', '#009688', '#4caf50', '#cddc39', '#ffeb3b',
				'#ff9800', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5'],
			chart: {
				style: {
					fontFamily: '   "Roboto","Helvetica Neue",Helvetica,Arial,sans-serif'
				}
			},
			title: {
				text: "",
				style: {
					"color": "#666666",
					"fontSize": "13px"
				}
			}
		});
		// Funtion that gets triggered when radio button is changed
		$scope.normalizeCallback = function() {
			dataModel.normalizeDataPoints();
			if (dataModel.isLocationFiltered()) {
				dataModel.locationFilter();
				dataModel.calculateMinMax();
			} else {
				dataModel.filteredDataPoints = dataModel.dataPoints;
			}
			dataModel.filterDataPoints();
			dataModel.aggregateDataPoints();
		};

		// Handles label dropped in dropzone, if the dimensions are filled, update is done
		$scope.droppedInDropzone = function ($data, $channel, index) {
			dataModel.chartDimensions[index] = $data;
			$scope.checkChartReady();
		};

		$scope.aggregateCallback = function() {
			dataModel.aggregateDataPoints();
		};

		$scope.removeChartDimension = function (index) {
			dataModel.chartDimensions[index] = null;
			$scope.checkChartReady();
		};

		$scope.resetChartDimensions = function() {
			dataModel.chartDimensions = {};
			$scope.checkChartReady();
			$scope.clearChart();
		};


		$scope.showResults = function() {
			if (apiHandler.busy()) {
				dataModel.alerts.push({type: "danger", text: "Eén of meerdere queries zijn nog aan het laden, probeer opnieuw."});
			} else {
				if (dataModel.chartType == "scatterChart") {
					$scope.chartConfig = scatterChart.render();
				} else if (dataModel.chartType == "barChart") {
					var chartConfigs = barChart.render();
					$scope.chartConfig = chartConfigs[0];
					$scope.chartConfig1 = chartConfigs[1];
					$scope.chartConfig2 = chartConfigs[2];
					if (dataModel.normalisation == "true") {
						$scope.chartConfig1.options.subtitle = {
							text: "waardes genormaliseerd naar aantal inwoners per "
						};
					} else {
						$scope.chartConfig1.options.subtitle = {
							text: "totaal bedragen per "
						};
					}
					if (apiHandler.period.min == apiHandler.period.max) {
						$scope.chartConfig1.options.subtitle.text = 
							"Jaar " + apiHandler.period.min + ": " + $scope.chartConfig1.options.subtitle.text;
					} else {
						$scope.chartConfig1.options.subtitle.text = 
							"Jaren " + apiHandler.period.min + " tot en met " + apiHandler.period.max + ": " + $scope.chartConfig1.options.subtitle.text;
					}
					if (dataModel.aggregateLocation == true) {
						$scope.chartConfig1.options.subtitle.text += "provincie."
					} else {
						$scope.chartConfig1.options.subtitle.text += "gemeente."
					}
					$scope.chartConfig2.options.subtitle = $scope.chartConfig1.options.subtitle;
					$timeout(function() {
						$scope.chartConfig1.getHighcharts().reflow();
						$scope.chartConfig2.getHighcharts().reflow();
					}, 0);
				} else if (dataModel.chartType == "treeMap") {
					$scope.chartConfig = treeMap.render();
				} else if (dataModel.chartType == "geoMap") {
					$scope.chartConfig = geoMap.render();
				} else if (dataModel.chartType == "lineChart") {
					$scope.chartConfig = lineChart.render();
				}
				if (dataModel.normalisation == "true") {
					$scope.chartConfig.options.subtitle = {
						text: "waardes genormaliseerd naar aantal inwoners per "
					};
				} else {
					$scope.chartConfig.options.subtitle = {
						text: "totaal bedragen per "
					};
				}
				if (apiHandler.period.min == apiHandler.period.max) {
					$scope.chartConfig.options.subtitle.text = 
						"Jaar " + apiHandler.period.min + ": " + $scope.chartConfig.options.subtitle.text;
				} else {
					$scope.chartConfig.options.subtitle.text = 
						"Jaren " + apiHandler.period.min + " tot en met " + apiHandler.period.max + ": " + $scope.chartConfig.options.subtitle.text;
				}
				if (dataModel.aggregateLocation == true) {
					$scope.chartConfig.options.subtitle.text += "provincie."
				} else {
					$scope.chartConfig.options.subtitle.text += "gemeente."
				}
				$timeout(function() {
						$scope.chartConfig.getHighcharts().reflow();
				}, 0);
			}
		};

		$scope.closeAlert = function ($index) {
			dataModel.alerts.splice($index, 1);
		};

		// Used for setting generate button to disabled
		$scope.checkChartReady = function() {
			if (dataModel.chartType == "scatterChart") {
				if (dataModel.chartDimensions[0] != null && dataModel.chartDimensions[1] != null) {
					$scope.chartReady = '';
				} else {
					$scope.chartReady = 'disabled';
				}
			} else if (dataModel.chartType == "barChart") {
				if (dataModel.chartDimensions[0] != null) {
					$scope.chartReady = '';
				} else {
					$scope.chartReady = 'disabled';
				}
			} else if (dataModel.chartType == "treeMap") {
				if (dataModel.chartDimensions[0] != null && dataModel.chartDimensions[2] != null) {
					$scope.chartReady = '';
				} else {
					$scope.chartReady = 'disabled';
				}
			} else if (dataModel.chartType == "geoMap") {
				if (dataModel.chartDimensions[0] != null) {
					$scope.chartReady = '';
				} else {
					$scope.chartReady = 'disabled';
				}
			} else if (dataModel.chartType == "lineChart") {
				if (dataModel.chartDimensions[0] != null) {
					$scope.chartReady = '';
				} else {
					$scope.chartReady = 'disabled';
				}
			}
		};

		$scope.clearChart = function() {
			dataModel.chartDimensions = {};
			if ($scope.chartConfig != null) {
				$scope.chartConfig.hide = true;
			}
		};

		$scope.setDropZoneColor = function(idx) {
			// Dont assign a class if chartDimension not filled
			var chartDim = dataModel.chartDimensions[idx];
			if (chartDim == null) {
				return "";
			}
			if (chartDim.type == "measure") {
				if (chartDim.value.direction == "in") {
					return "in";
				} else if (chartDim.value.direction == "out") {
					return "out";
				}
			} else {
				return "chartDimension";
			}
		};

		$scope.showChart = function() {
			if ($scope.chartConfig == null) {
				return false;
			}
			if (dataModel.chartType == 'barChart' || $scope.chartConfig.hide == true) {
				return false;
			} else {
				return true;
			}
		};

		$scope.showBarChart = function() {
			if ($scope.chartConfig == null) {
				return false;
			}
			if (dataModel.chartType == 'barChart' && $scope.chartConfig.hide == false) {
				return true;
			} else {
				return false;
			}
		};
	}]);