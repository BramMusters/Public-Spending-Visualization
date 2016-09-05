'use strict';
angular
	.module('myApp', [
		'ui.bootstrap',
		'pascalprecht.translate',
		'restangular',
		'ivh.treeview',
		'rzModule',
		'ang-drag-drop',
		'angularSpinner',
		'highcharts-ng'
	])
	.run(function ($templateCache, $http) {
		$http.get('templates/dimension.html', {cache:$templateCache});
		$http.get('templates/barDropzones.html', {cache:$templateCache});
		$http.get('templates/geoDropzones.html', {cache:$templateCache});
		$http.get('templates/lineDropzones.html', {cache:$templateCache});
		$http.get('templates/scatterDropzones.html', {cache:$templateCache});
		$http.get('templates/treeMapDropzones.html', {cache:$templateCache});
	})

	.config(function (RestangularProvider) {
		var baseUrl = "http://www.openspending.nl/api/v1";
		RestangularProvider.setBaseUrl(baseUrl);
		// Handle incoming Restangular Objects
		RestangularProvider.addResponseInterceptor(function (data, operation, what, url, response, deferred) {
			return [data];
		});
	})

	.config(['$translateProvider', function($translateProvider) {
		$translateProvider
			.translations('nl', {
				'false': 'Geef het selecteren van waarden weer',
				'true': 'Verberg het selecteren van waarden',
				'data_title': 'Wat wil je zien?',
				'work_title': 'Welke waarden wil je zien?',
				'chart_title': 'Hoe wil je de waarden zien?',
				'norm': 'Normalisatie:',
				'norm_no': 'Geen',
				'norm_yes': 'Per inwoner',
				'agg_time': 'Aggregeer over tijd',
				'agg_loc': 'Aggregeer over locatie',
				'size': 'Grootte',
				'color': 'Kleur',
				'x_axes': 'X waarde',
				'y_axes': 'Y waarde',
				'drag': 'Sleep hier',
				'group1': 'Groep 1',
				'group2': 'Groep 2',
				'group3': 'Groep 3',
				'generate': 'Genereer',
				'clear': 'Wis',
			})
			.translations('en', {
				'false': 'Show selection of values',
				'data_title': 'What do you want to see?',
				'work_title': 'What values do you want to see?',
				'chart_title': 'How do you want to see the values?',
				'norm': 'Normalization:',
				'norm_no': 'None',
				'norm_yes': 'Per capita',
				'agg_time': 'Aggregate over time',
				'agg_loc': 'Aggregate over location',
				'size': 'Size',
				'color': 'Color',
				'x_axes': 'X value',
				'y_axes': 'Y value',
				'drag': 'Drag here',
				'group1': 'Group 1',
				'group2': 'Group 2',
				'group3': 'Group 3',
				'true': 'Hide selection of values',
				'generate': 'Generate',
				'clear': 'Clear'
			})
			.preferredLanguage('nl');
		$translateProvider.useSanitizeValueStrategy('escape');
	}]);
