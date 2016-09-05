'use strict';

angular.module('myApp')

	.controller('dataSpaceCtrl', ['$scope', '$q', '$timeout', '$translate', 'apiHandler', 'dataModel', function ($scope, $q, $timeout, $translate, apiHandler, dataModel) {
		$scope.dataModel = dataModel;
		$scope.apiHandler = apiHandler;
		$scope.lang = 'nl';

		// Creates the tree.
		this.createDimensionList = function () {
			return apiHandler.getAllLabels(dataModel.kind)
				.then(function (result) {
					var labels = result[0].objects;
					labels = labels.sort(function (a, b) {
						if (a.code > b.code) {
							return 1;
						} else if (a.code < b.code) {
							return -1;
						} else {
							return 0;
						}
					});
					labels.map(function (label) {
						if (label.type != "cat") {
							var index;
							if (label.direction == "out") {
								index = 0;
							} else if (label.direction == "in") {
								index = 1;
							}
							if (label.type == "main") {
								dataModel.dataSpace[index].children.push({
									'label': label.label,
									'value': label,
									'type': "measure",
									'children': []
								});
							} else if (label.type == "sub") {
								var main_code = label.code.charAt(0);
								if (!isNaN(main_code)) {
									dataModel.dataSpace[index].children[main_code].children.push({
										'label': label.label,
										'value': label,
										'type': "measure",
										'children': []
									});
								}
							}
						}
					});
				});
		};

		// Creates the sliders
		$scope.updateWorkspaceDimensions = function (ivhNode, ivhIsSelected, ivhTree) {
			if (ivhIsSelected == true && ivhNode.value != "") {
				var dim = ivhNode;
				dataModel.workspaceDimensions.push(dim);
				if (ivhNode.value == "year") {
					dim.slider = apiHandler.period;
				} else if (ivhNode.value == "county") {
					dataModel.countyFilter = {
						min: 0,
						max: 441,
						options: {
							stepsArray: dataModel.countyNameList,
							disabled: dataModel.countyNameList.length == 0,
							onEnd: $scope.locationFilterCallback
						}
					};
					dim.slider = dataModel.countyFilter;
				} else if (ivhNode.value == "province") {
					dataModel.provinceFilter = {
						min: 0,
						max: 11,
						options: {
							showTicks: true,
							stepsArray: dataModel.provinceNameList,
							disabled: dataModel.provinceNameList.length == 0,
							onEnd: $scope.locationFilterCallback
						}
					};

					dim.slider = dataModel.provinceFilter;
				} else {
					// Expenditure or Revenue
					dim.slider = {
						min: 0,
						max: 1,
						options: {
							floor: 0,
							ceil: 1,
							onEnd: $scope.filterCallback,
							disabled: true,
							translate: function(value) {
								return '€' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ',00';
							}
						}
					};
					apiHandler.activeQuery = apiHandler.queryResults(dim);
					apiHandler.queryCallback();
				}
			} else if (ivhIsSelected == false && ivhNode.value != "") {
				apiHandler.removeDimension(ivhNode);
			}
			$scope.$apply();
		};

		// Initialize DimensionList and some sliders
		this.createDimensionList().then(function () {
			apiHandler.initPeriodTerm().then(function () {
				apiHandler.getAllGovernments();
				$timeout(function () {
					$scope.$broadcast('rzSliderForceRender');
				});
				apiHandler.createGovernmentsMap();
			});
		});

		$scope.locationFilterCallback = function () {
			dataModel.locationFilter();
			dataModel.calculateMinMax();
			dataModel.filterDataPoints();
			dataModel.aggregateDataPoints();
		};

		$scope.filterCallback = function () {
			dataModel.filteredDataPoints = dataModel.dataPoints;
			dataModel.filterDataPoints();
			dataModel.aggregateDataPoints();
		};

		$scope.changeLanguage = function (lang) {
			$scope.lang = lang;
			$translate.use(lang);
		};
	}]);