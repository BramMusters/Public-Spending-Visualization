'use strict';

angular.module('myApp')

	// Remove the built in  ivhTreeviewCheckbox directive
	.config(function($provide) {
		$provide.decorator('ivhTreeviewCheckboxDirective', function($delegate) {
			$delegate.shift();
			return $delegate;
		});
	})
	.config(function (ivhTreeviewOptionsProvider) {
		ivhTreeviewOptionsProvider.set({
			twistieCollapsedTpl: '<span class="glyphicon glyphicon-chevron-right"></span>',
			twistieExpandedTpl: '<span class="glyphicon glyphicon-chevron-down"></span>',
			twistieLeafTpl: '&#9679;'
		});
	})

	// Supply your own checkbox directive that does nothing other than bind to the selected state of the node
	.directive('ivhTreeviewCheckbox', function() {
		return {
			scope: false,
			template: '<input type="checkbox" ng-model="node.selected" />',
			link: function(scope, element, attrs) {
				element.on('click', function(event) {
					scope.trvw.onCbChange(scope.node, scope.node.selected);
				});
			}
		};
	});