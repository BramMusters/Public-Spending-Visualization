'use strict';

angular.module('myApp')

	.service('dataModel', [function () {
		this.chartReady = false;

		this.kind = "county";
		this.plan = "spending";

		this.countyList = [];
		this.countyNameList = [];
		this.provinceList = [];
		this.provinceNameList = [];
		this.governmentsMap = {};
		this.selectedGovernment = null;

		// dataSpace holds all dimensions, including expenditures and revenues
		this.dataSpace = [
			{
				label: "Uitgaven",
				value: {
					code: "totaal",
					label: "totaal",
					direction: "out"
				},
				type: "measure",
				children: []
			},
			{
				label: "Inkomsten",
				value: {
					code: "totaal",
					label: "totaal",
					direction: "in"
				},
				type: "measure",
				children: []
			},
			{
				label: "Provincie",
				value: "province",
				type: "dimension",
				children: []
			},
			{
				label: "Gemeente",
				value: "county",
				type: "dimension",
				children: []
			},
			{
				label: "Tijd",
				value: "year",
				type: "dimension",
				children: []
			}
		];
		// workspaceDimensions holds all dimensions that are selected from dataspace
		this.workspaceDimensions = [];
		// chartDimensions holds all dimensions that are dragged into the chart Dimensions
		this.chartDimensions = {};
		this.metaData = {};
		this.dataPoints = [];
		this.filteredDataPoints = [];
		this.aggregatedDataPoints = [];


		this.provinceFilter = null;
		this.countyFilter = null;
		this.normalisation = "false";
		this.aggregateTime = false;
		this.aggregateLocation = false;

		this.alerts = [];
		this.controlCollapsed = false;
		var self = this;

		this.chartType = "treeMap";

		var calc_min = function(min, current) {
			if (min == -1 || min > current) {
				min = Math.floor(current);
			}
			return min;
		};

		var calc_max = function(max, current) {
			if (max < current) {
				max = Math.ceil(current);
			}
			return max;
		};

		// Store all query results in dataPoints
		this.storeDataPoints = function (resultPromise, dim) {
			var code = dim.value.code;
			var direction = dim.value.direction;
			var label = dim.value.label;
			dim.slider.norm_min = -1;
			dim.slider.pop_min = -1;
			dim.slider.norm_max = 1;
			dim.slider.pop_max = -1;
			if (direction == "in") {
				label = "Inkomsten " + label;
			} else {
				label = "Uitgave " + label;
			}
			self.metaData[code+direction] = {
				code: code,
				direction: direction,
				promise: resultPromise,
				filter: dim.slider,
				label: label
			};
			return resultPromise.then(function(resultsList) {
				if (self.metaData[code+direction].promise.$$state.status == 1) {
					// Only store the result if the same query is not waiting
					for (var i = 0; i < resultsList.length; ++i) {
						var results = resultsList[i][0].facets.document.terms;
						for (var j = 0; j < results.length; ++j) {
							var item = results[j];
							// Map document to result
							var document = self.governmentsMap[item.term];
							if (document != null) {
								// Don't add missing values
								if (item.total <= 0) {
									continue;
								}
								item.norm_total = item.total
								item.pop_total = self.normalize(item.total, document);
								if (self.normalisation == "true") {
									item.total = item.pop_total;
								}
								// Calculate min and max for both normalized and normal
								dim.slider.norm_min = calc_min(dim.slider.norm_min, item.norm_total);
								dim.slider.pop_min = calc_min(dim.slider.pop_min, item.pop_total);
								dim.slider.norm_max = calc_max(dim.slider.norm_max, item.norm_total);
								dim.slider.pop_max = calc_max(dim.slider.pop_max, item.pop_total);

								// Append needed information to each item
								item.code = dim.value.code;
								item.direction = dim.value.direction;
								item.id = item.term;
								item.document = document;
								self.dataPoints.push(item);
							}
						}
					}
					dim.slider.options.disabled = false;
					if (self.normalisation == "true") {
						dim.slider.min = dim.slider.options.floor = dim.slider.pop_min;
						dim.slider.max = dim.slider.options.ceil = dim.slider.pop_max;
					} else {
						dim.slider.min = dim.slider.options.floor = dim.slider.norm_min;
						dim.slider.max = dim.slider.options.ceil = dim.slider.norm_max;
					}
				}
			});
		};

		// Normalize all dataPoints according to population / don't normalize
		this.normalizeDataPoints = function() {
			if (self.normalisation == "true") {
				self.setCorrectNormalisationValues("pop_total", "pop_min", "pop_max");
			} else {
				self.setCorrectNormalisationValues("norm_total", "norm_min", "norm_max");
			}
		};

		// returns true if needs to be filtered according to province/county filter
		var provinceCountyFilter = function(government) {
			// Filter counties
			if (self.countyFilter != null && (self.countyNameList[self.countyFilter.min] > government.name || self.countyNameList[self.countyFilter.max] < government.name)) {
				return true;
			}
			// Filter provinces
			if (self.provinceFilter != null && (self.provinceNameList[self.provinceFilter.min] > government.state || self.provinceNameList[self.provinceFilter.max] < government.state)) {
				return true;
			}
			return false;
		};

		this.locationFilter = function() {
			self.filteredDataPoints = [];
			for (var i = 0; i < self.dataPoints.length; ++i) {
				var dataPoint = self.dataPoints[i];
				// provinceCountyFilter returns true if it should be filtered according to location filters
				if (!provinceCountyFilter(dataPoint.document.government)) {
					self.filteredDataPoints.push(dataPoint);
				}
			}
		};

		this.calculateMinMax = function() {
			// Calculate min and max for both normalized and normal
			for (var key in self.metaData) {
				if (self.metaData.hasOwnProperty(key)) {
					var filter = self.metaData[key].filter;
					filter.norm_min = -1;
					filter.pop_min = -1;
					filter.norm_max = 0;
					filter.pop_max = 0;
				}
			}
			for (var i = 0; i < self.filteredDataPoints.length; i++) {
				var point = self.filteredDataPoints[i];
				var filter = self.metaData[point.code+point.direction].filter;
				filter.norm_min = calc_min(filter.norm_min, point.norm_total);
				filter.pop_min = calc_min(filter.pop_min, point.pop_total);
				filter.norm_max = calc_max(filter.norm_max, point.norm_total);
				filter.pop_max = calc_max(filter.pop_max, point.pop_total);
			}
			for (var key in self.metaData) {
				if (self.metaData.hasOwnProperty(key)) {
					var filter = self.metaData[key].filter;
					if (self.normalisation == "true") {
						filter.min = filter.options.floor = filter.pop_min;
						filter.max = filter.options.ceil = filter.pop_max;
					} else {
						filter.min = filter.options.floor = filter.norm_min;
						filter.max = filter.options.ceil = filter.norm_max;
					}
				}
			}

		};

		// Filter dataPoints according to all filters
		this.filterDataPoints = function() {
			var filtered = [];
			// Object that holds for each id a boolean, whether a datapoint should be filtered or not
			var isFiltered = {};
			for (var i = 0; i < self.filteredDataPoints.length; ++i) {
				var dataPoint = self.filteredDataPoints[i];
				if (isFiltered[dataPoint.id] == undefined) {
					// default is false
					isFiltered[dataPoint.id] = false;
				} else if (isFiltered[dataPoint.id] == true) {
					// if filtered by one, keep it filtered
					continue;
				}
				// Perform filter
				var filter = self.metaData[dataPoint.code+dataPoint.direction].filter;
				if (filter.min > dataPoint.total || filter.max < dataPoint.total) {
					isFiltered[dataPoint.id] = true;
				}
			}
			// Perform actual filter
			for (var i = 0; i < self.filteredDataPoints.length; ++i) {
				var dataPoint = self.filteredDataPoints[i];
				if (!isFiltered[dataPoint.id]) {
					filtered.push(dataPoint);
				}
			}
			self.filteredDataPoints = filtered;
		};

		// aggregate filteredDataPoints over location/year
		this.aggregateDataPoints = function() {
			if (self.aggregateTime == false && self.aggregateLocation == true) {
				self.aggregatePointsLocation();
			} else if(self.aggregateTime == true && self.aggregateLocation == false) {
				self.aggregatePointsYear();
			} else if(self.aggregateTime == true && self.aggregateLocation == true) {
				self.aggregatePointsLocationYear();
			} else {
				self.aggregatedDataPoints = self.filteredDataPoints;
				var test = self.aggregatedDataPoints;
			}
		};

		// Remove all points with code/direction combination
		this.removeResults = function(code, direction) {
			self.dataPoints = self.dataPoints.filter(function (item) {
				return !(item.code == code && item.direction == direction);
			});
		};

		// Calculate mean for year aggregation
		var setAverage = function(aggregatedPoints) {
			for (var i = 0; i < aggregatedPoints.length; i++) {
				var point = aggregatedPoints[i];
				var sum = 0;
				var norm_sum = 0;
				var pop_sum = 0;
				var len = point.total.length;
				for (var j = 0; j < len; j++) {
					pop_sum += point.pop_total[j];
					norm_sum += point.norm_total[j];
					sum += point.total[j];
				}
				point.pop_total = pop_sum / len;
				point.norm_total = norm_sum / len;
				point.total = sum / len;
			}
			return aggregatedPoints;
		};

		this.aggregatePointsLocation = function() {
			self.aggregatedDataPoints = [];
			var agPoint = null;
			var dataPoint = null;
			for (var i = 0; i < self.filteredDataPoints.length; i++) {
				dataPoint = self.filteredDataPoints[i];
				var isAdded = false;
				for (var j = 0; j < self.aggregatedDataPoints.length; j++) {
					agPoint = self.aggregatedDataPoints[j];
					// Equal point, sum values
					if (dataPoint.document.government.state == agPoint.document.government.state
					&& dataPoint.code == agPoint.code
					&& dataPoint.direction == agPoint.direction
					&& dataPoint.document.year == agPoint.document.year) {
						agPoint.total.push(dataPoint.total);
						agPoint.norm_total.push(dataPoint.norm_total);
						agPoint.pop_total.push(dataPoint.pop_total);
						isAdded = true;
						break;
					}
				}
				// Combination of State,year,code, direction not found yet. Create new object
				if (isAdded == false ) {
					var newPoint = {
						code: dataPoint.code,
						direction: dataPoint.direction,
						id: dataPoint.id,
						total: [dataPoint.total],
						norm_total: [dataPoint.norm_total],
						pop_total: [dataPoint.pop_total],
						document: {
							government: {
								name: dataPoint.document.government.state,
								state: dataPoint.document.government.state
							},
							year: dataPoint.document.year
						}
					};
					self.aggregatedDataPoints.push(newPoint);
				}
			}
			self.aggregatedDataPoints = setAverage(self.aggregatedDataPoints);
		};

		this.aggregatePointsYear = function() {
			self.aggregatedDataPoints = [];
			var agPoint = null;
			var dataPoint = null;
			for (var i = 0; i < self.filteredDataPoints.length; i++) {
				dataPoint = self.filteredDataPoints[i];
				var isAdded = false;
				for (var j = 0; j < self.aggregatedDataPoints.length; j++) {
					agPoint = self.aggregatedDataPoints[j];
					// Equal point, sum values
					if (dataPoint.document.government.name == agPoint.document.government.name
						&& dataPoint.code == agPoint.code
						&& dataPoint.direction == agPoint.direction) {
						agPoint.total.push(dataPoint.total);
						agPoint.norm_total.push(dataPoint.norm_total);
						agPoint.pop_total.push(dataPoint.pop_total);
						isAdded = true;
						break;
					}
				}
				// Combination of State,year,code, direction not found yet. Create new object
				if (isAdded == false ) {
					var newPoint = {
						code: dataPoint.code,
						direction: dataPoint.direction,
						id: dataPoint.id,
						total: [dataPoint.total],
						norm_total: [dataPoint.norm_total],
						pop_total: [dataPoint.pop_total],
						document: {
							government: {
								name: dataPoint.document.government.name,
								state: dataPoint.document.government.state
							},
							year: "Meerdere jaren"
						}
					};
					self.aggregatedDataPoints.push(newPoint);
				}
			}
			self.aggregatedDataPoints = setAverage(self.aggregatedDataPoints);
		};

		this.aggregatePointsLocationYear = function() {
			self.aggregatedDataPoints = [];
			var agPoint = null;
			var dataPoint = null;
			for (var i = 0; i < self.filteredDataPoints.length; i++) {
				dataPoint = self.filteredDataPoints[i];
				var isAdded = false;
				for (var j = 0; j < self.aggregatedDataPoints.length; j++) {
					agPoint = self.aggregatedDataPoints[j];
					// Equal point, sum values
					if (dataPoint.document.government.state == agPoint.document.government.state
						&& dataPoint.code == agPoint.code
						&& dataPoint.direction == agPoint.direction) {
						agPoint.total.push(dataPoint.total);
						agPoint.norm_total.push(dataPoint.norm_total);
						agPoint.pop_total.push(dataPoint.pop_total);
						isAdded = true;
						break;
					}
				}
				// Combination of State,year,code, direction not found yet. Create new object
				if (isAdded == false ) {
					var newPoint = {
						code: dataPoint.code,
						direction: dataPoint.direction,
						id: dataPoint.id,
						total: [dataPoint.total],
						norm_total: [dataPoint.norm_total],
						pop_total: [dataPoint.pop_total],
						document: {
							government: {
								name: dataPoint.document.government.state,
								state: dataPoint.document.government.state
							},
							year: "Meerdere jaren"
						}
					};
					self.aggregatedDataPoints.push(newPoint);
				}
			}
			self.aggregatedDataPoints = setAverage(self.aggregatedDataPoints);
		};

		// Return all points with code/direction combination
		this.returnDimensionPoints = function(code, direction) {
			return self.aggregatedDataPoints.filter(function (d) {
				return (d.code == code && d.direction == direction);
			});
		};

		// Normalize a specific total according to that population
		this.normalize = function(total, document) {
			for (var i = 0; i < document.government.metrics.length; ++i) {
				var metrics = document.government.metrics[i];
				if (metrics.metric == "population" && metrics.year == document.year) {
					if (metrics.factor > 0) {
						var num = total / (metrics.factor * 1.0);
						return Math.round(num * 100) / 100;
					}
				}
			}
			return 0;
		};

		// Set all dataPoint totals to correct normalisation
		this.setCorrectNormalisationValues = function(totalName, minName, maxName) {
			for (var i = 0; i < self.dataPoints.length; ++i) {
				var dataPoint = self.dataPoints[i];
				dataPoint.total = dataPoint[totalName];
			}
			// Set all min and max to correct normalisation
			for (var key in self.metaData) {
				if (self.metaData.hasOwnProperty(key)) {
					var filter = self.metaData[key].filter;
					filter.min = filter.options.floor = filter[minName];
					filter.max = filter.options.ceil = filter[maxName];
				}
			}
		};

		// Returns true if location is filtered
		this.isLocationFiltered = function() {
			if (self.countyFilter != null && (self.countyNameList[0] != self.countyNameList[self.countyFilter.min] || self.countyNameList[self.countyNameList.length] != self.countyNameList[self.countyFilter.max])) {
				return true;
			}
			if (self.provinceFilter != null && (self.provinceNameList[0] != self.provinceNameList[self.provinceFilter.min] || self.provinceNameList[self.provinceNameList.length] != self.provinceNameList[self.provinceFilter.max])) {
				return true;
			}
			return false;
		}
	}]);