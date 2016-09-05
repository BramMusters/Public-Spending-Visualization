'use strict';

angular.module('myApp')

	.controller('workspaceCtrl', ['$scope', '$timeout', 'dataModel', function ($scope, $timeout, dataModel) {
		$scope.dataModel = dataModel;
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


		$scope.$watch(dataModel.controlCollapsed, function () {
			$timeout(function () {
				$scope.$broadcast('rzSliderForceRender');
			});
		}, true);
	}]);