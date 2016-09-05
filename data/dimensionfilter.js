'use strict';

angular.module('myApp')

	.directive('dimensionFilter', ['dataModel', 'apiHandler', 'ivhTreeviewMgr', function (dataModel, apiHandler, ivhTreeviewMgr) {
		return {
			restrict: 'E',
			scope: {
				dimension: '='
			},
			templateUrl: 'templates/dimension.html',
			link: function(scope, elem, attrs) {
				scope.removeDimension = function (dim) {
					ivhTreeviewMgr.deselect(dataModel.dataSpace, dim);
					for (var i = 0; i < dataModel.workspaceDimensions.length; ++i) {
						if (dataModel.workspaceDimensions[i] == dim) {
							apiHandler.removeDimension(dim);
							break;
						}
					}
				};
			}
		}
	}]);