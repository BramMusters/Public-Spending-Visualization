'use strict';

angular.module('myApp')

	.service('apiHandler', ['Restangular', 'dataModel', '$q', function (Restangular, dataModel, $q) {
		this.period = null;
		this.spending = "spending";
		this.activeQuery = null;
		var self = this;

		var getAll = function (type, params) {
			// customGET('.' adds a '/' before the parameters, removing a redirect from API request.
			return Restangular.all(type).customGET('.', params);
		};

		this.sortLabels = function (labels) {
			dataModel.labelList = labels.sort(function(a,b){
				return a.label.localeCompare(b.label);
			});
		};

		this.filterLabels = function (labels, direction) {
			labels = labels.filter(function (label) {
				return (label.direction == direction);
			});
			return labels;
		};

		// Fill the CountyList and provinceList
		this.getAllGovernments = function() {
			return Restangular.all("governments").customGET('.', {"limit":1000})
				.then(function (item) {
					angular.forEach(item[0].objects, function(government) {
						if (government.kind == "county") {
							dataModel.countyList.push(government);
							dataModel.countyNameList.push(government.name);
						} else if (government.kind == "province") {
							dataModel.provinceList.push(government);
							// Cut off "Provincie "
							dataModel.provinceNameList.push(government.name.substr(10));
						}
					});
					if (dataModel.provinceFilter != null) {
						dataModel.provinceFilter.options.disabled = false;
					}
					if (dataModel.countyFilter != null) {
						dataModel.countyFilter.options.disabled = false;
					}
				});
		};

		this.getSpecificDocument = function(government_kind) {
			// Get a specific document, returns a promise
			return getAll('documents', {
				"government__kind": government_kind,
				"year": 2012,
				"period": 1,
				"plan": "spending",
				"limit": 1
			});
		};

		// Get all labels that are used for the DataSpacetree.
		this.getAllLabels = function (government_kind) {
			return this.getSpecificDocument(government_kind)
				.then(function (result) {
					if (result[0].objects.length > 0) {
						var doc_id = result[0].objects[0].id;
						// Get the labels of the returned doc_id taken from the document
						return getAll('labels', {
							"document_id": doc_id,
							"limit": 500
						});
					}
				});
		};

		// mapDocuments is used to create a object that holds all identifiers used for mapping from ID's to Governments
		this.mapDocuments = function (year) {
			return getAll('documents', {
				"government__kind": dataModel.kind,
				"year": year,
				"period": 5,
				"plan": dataModel.plan,
				"limit": 1000
			})
				.then(function (documentsList) {
					// Store all documents using their id's as identifiers
					angular.forEach(documentsList[0].objects, function (document) {
						dataModel.governmentsMap[document.id] = document;
					});
				});
		};

		// Create governmentsMap using all selected years
		this.createGovernmentsMap = function () {
			var promises = [];
			for (var year = self.period.min; year <= self.period.max; ++year) {
				promises.push(self.mapDocuments(year));
			}
			return $q.all(promises);
		};

		// Remove dimension from Workspace
		this.removeDimension = function (ivhNode) {
			angular.forEach(dataModel.workspaceDimensions, function (item, index) {
				if (item == ivhNode) {
					dataModel.workspaceDimensions.splice(index, 1);
					if (item.value == "year") {
						self.period.min = self.period.options.floor;
						self.period.max = self.period.options.ceil;
						self.updateResults();
					} else {
						// Expenditure or Revenue
						dataModel.removeResults(item.value.code, item.value.direction);
						if (dataModel.isLocationFiltered()) {
							dataModel.locationFilter();
							dataModel.calculateMinMax();
						} else {
							dataModel.filteredDataPoints = dataModel.dataPoints;
						}
						dataModel.filterDataPoints();
						dataModel.aggregateDataPoints();
					}
				}
			});
		};

		// Initialize period values
		this.initPeriodTerm = function () {
			return Restangular.all('aggregations').all('documents').customGET('.', {limit: 0, period: 5})
				.then(function (result) {
					var yearList = [];
					angular.forEach(result[0].facets.years.terms, function (obj) {
						yearList.push(obj.term);
					});
					var min = Math.min.apply(null,yearList);
					var max = Math.max.apply(null,yearList);
					self.period = {
						min: min,
						max: max,
						options: {
							floor: min,
							ceil: max,
							showTicks: true,
							onEnd: self.updateResults
						}
					};
				});
		};

		// Update the values when period is changed.
		this.updateResults = function() {
			dataModel.dataPoints = [];
			var promises = [];
			angular.forEach(dataModel.workspaceDimensions, function(dim) {
				if (dim.value != "year" && dim.value != "province" && dim.value != "county") {
					dim.slider.options.disabled = true;
					promises.push(self.queryResults(dim));
				}
			});
			self.activeQuery = $q.all(promises);
			self.queryCallback();
		};

		// queryResults sends several API calls and stores the result in dataPoints.
		this.queryResults = function (dim) {
			var resultPromises = [];
			for (var year = self.period.min; year <= self.period.max; ++year) {
				// Period: 5 is whole year
				var params = {
					"year": year,
					"period": 5,
					"direction": dim.value.direction
				};
				if (dim.value.type != undefined) {
					var code_string = "code_" + dim.value.type;
					params[code_string] = dim.value.code;
				}
				var tmpPromise = Restangular.all('aggregations').all('entries')
					.customGET('.', params);
				tmpPromise.year = year;
				resultPromises.push(tmpPromise);
			}
			var promise = $q.all(resultPromises);
			return dataModel.storeDataPoints(promise, dim);
		};

		this.queryCallback = function() {
			self.activeQuery.then(function () {
				// Only filter if no other queries are waiting
				if (!self.busy()) {
					if (dataModel.isLocationFiltered()) {
						dataModel.locationFilter();
						dataModel.calculateMinMax();
					} else {
						dataModel.filteredDataPoints = dataModel.dataPoints;
					}
					dataModel.filterDataPoints();
					dataModel.aggregateDataPoints();
				}
			});
		};

		// return true if apiHandler is busy
		this.busy = function() {
			if (self.activeQuery == null) {
				return false;
			} else if (self.activeQuery.$$state.status == 0) {
				return true;
			}
			return false;
		}
	}]);
