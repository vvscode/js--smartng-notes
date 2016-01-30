angular.module('LfDemoApp', [])
    .service('ReportsLoader', function($http) {
        this.loadReports = function() {
            return $http.get('http://notification.systems/api/filterReports', {
                headers: {'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.IjUzZjMzYzhkMjk0N2NkNDU2ZmI5NGJjMyI.jY0oeE2D3-D14d6Z2WqILKfWR5PTduau6R492czGJ80'}
            }).then((resp) => {
                var reports = resp.data.reports;
                reports.forEach((report) => report.date = new Date(report.date));
                reports.sort((a, b) => (+a.date > +b.date) ? 1 : (+a.date === +b.date) ? 0 : -1);
                return reports;
            });
        }
    })
    .service('ReportsUtils', function() {
        this._getDateRange = function(reports) {
            reports = reports || [];
            const reportsCount = reports.length;
            if(!reportsCount) {
                return [0, 0];
            }
            var minDate = reports[0].date;
            var maxDate = reports[reportsCount - 1].date;
            return [minDate, maxDate];
        };
        this.getStepsCount = function(reports, size) {
            reports = reports || [];
            var dateRange = this._getDateRange(reports);
            return Math.ceil((+dateRange[1] - +dateRange[0])/((size || 1)*24*60*60*1000));
        };
        this.getStepReports = function(reports, size, stepNumber) {
            reports = reports || [];
            var dateRange = this._getDateRange(reports);
            var stepsCount = this.getStepsCount(reports, size);
            var stepRange = (+dateRange[1] - +dateRange[0]) / stepsCount;
            var minStepDateTime = +dateRange[0] + stepNumber * stepRange;
            var maxStepDateTime = minStepDateTime + stepRange;
            var ret = reports.filter((report) => ((+report.date >= minStepDateTime) && (+report.date < maxStepDateTime)));
            return ret;
        };
    })
    .directive('leafletMap', function() {
        return {
            template: '<div class="map"></div>',
            restrict: 'E',
            scope: {
                allReports: '=reports',
                boundingRect: '=',
                mode: '='
            },
            controller: function($interval, ReportsUtils) {
                this._animationTimer = null;
                this.reports = [];
                this._animationDelay = 200;

                this.stopAnimation = () => $interval.cancel(this._animationTimer);
                this.startAnimation = () => {
                    this.stopAnimation();
                    this._animationTimer  = $interval(() => {
                        this.mode.options.position++;
                        if(this.mode.options.position >= (this.maxStepNumber + 1)){
                            this.stopAnimation();
                        }
                    }, this._animationDelay);
                };
                this.recalculateStepsNumber = () => this.maxStepNumber = ReportsUtils.getStepsCount(this.allReports, this.mode.options.size) - 1;
                this.updatePositionReports = () => this.reports = ReportsUtils.getStepReports(this.allReports, this.mode.options.size, this.mode.options.position);
            },
            controllerAs: 'leafletMapCtrl',
            bindToController: true,
            link: function postLink(scope, $el, $attrs, leafletMapCtrl) {
                var boundingRect = leafletMapCtrl.boundingRect;
                var zoom = boundingRect.zoom || 13;
                var lat = boundingRect.latitude || 50;
                var lng = boundingRect.longitude || 50;
                var map = L.map($el[0].querySelector('.map')).setView([lat, lng], zoom);
                var reportMarkers = [];
                var reports = [];

                // modes
                var MAP_MODES = {
                    normal: {
                        init() {
                            console.log('normal mode init');
                            this.addReportMarkers(reports);
                        },
                        clearReportMarkers() {
                            reportMarkers.forEach((marker) => map.removeLayer(marker));
                            reportMarkers.length = 0;
                        },
                        addReportMarkers(reports) {
                            (reports || [])
                            .map((report) => [report.location.latitude, report.location.longitude])
                            .forEach((markerLatLng) => {
                                var marker = L.marker(markerLatLng);
                                map.addLayer(marker);
                                reportMarkers.push(marker);
                            });
                            if(reportMarkers.length) {
                                var group = new L.featureGroup(reportMarkers);
                                map.fitBounds(group.getBounds());
                            }
                        },
                        destruct() {
                            console.log('normal mode destruct');
                            this.clearReportMarkers();
                        }
                    },
                    heatmap: {
                        init() {
                            console.log('heatmap mode init');
                            this.heatLayer = L.heatLayer([], {blur: 10, maxZoom: 10});
                            map.addLayer(this.heatLayer);
                            this.addReportMarkers(reports);
                        },
                        clearReportMarkers() {
                            this.heatLayer.setLatLngs([]);
                            reportMarkers.length = 0;
                        },
                        addReportMarkers(reports) {
                            this.heatLayer.setLatLngs(
                                (reports || [])
                                .map((report) => {
                                    var markerLatLng = [report.location.latitude, report.location.longitude];
                                    var marker = L.marker(markerLatLng);
                                    reportMarkers.push(marker);
                                    return markerLatLng;
                                }));
                            if(reportMarkers.length) {
                                var group = new L.featureGroup(reportMarkers);
                                map.fitBounds(group.getBounds());
                            }
                        },
                        destruct() {
                            console.log('heatmap mode destruct');
                            this.clearReportMarkers();
                            map.removeLayer(this.heatLayer);
                            this.heatLayer = null;
                        }
                    }
                };
                var currentMapMode = MAP_MODES[leafletMapCtrl.mode.type] || MAP_MODES.normal;
                currentMapMode.init();

                // update bounding rect
                var updateBoundingRect = function(ev) {
                    var center = ev.target.getCenter();
                    boundingRect.zoom = ev.target.getZoom();
                    boundingRect.latitude = center.lat;
                    boundingRect.longitude = center.lng;
                    scope.$applyAsync();
                };

                map.on({
                    viewreset: updateBoundingRect,
                    zoomend: updateBoundingRect,
                    moveend: updateBoundingRect
                });

                L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                    id: 'examples.map-9ijuk24y'
                }).addTo(map);

                scope.$watch('leafletMapCtrl.mode', function(newVal){
                    var newCurrentMapMode = MAP_MODES[leafletMapCtrl.mode.type] || MAP_MODES.normal;
                    if(newCurrentMapMode !== currentMapMode) {
                        currentMapMode.destruct();
                        newCurrentMapMode.init();
                    }
                    currentMapMode = newCurrentMapMode;
                }, true);

                scope.$watch('leafletMapCtrl.boundingRect', function(newVal){
                    map.setView([newVal.latitude, newVal.longitude], newVal.zoom);
                }, true);

                // update report markers
                scope.$watch('leafletMapCtrl.allReports', function(newReports, oldReports) {
                    leafletMapCtrl.recalculateStepsNumber();
                    leafletMapCtrl.updatePositionReports();
                });

                scope.$watch('leafletMapCtrl.reports', function(newReports, oldReports) {
                    currentMapMode.clearReportMarkers();
                    reports = newReports;
                    currentMapMode.addReportMarkers(newReports);
                });

                scope.$watch(() => leafletMapCtrl.mode.options.isPlaying, (newValue) => {
                    leafletMapCtrl[newValue ? 'startAnimation' : 'stopAnimation']();
                });

                scope.$watch(() => leafletMapCtrl.mode.options.size, () => leafletMapCtrl.recalculateStepsNumber());
                scope.$watch(() => leafletMapCtrl.mode.options.position, () => leafletMapCtrl.updatePositionReports());
            }
        };
    })
    .controller('DemoMapCtrl', function($scope, $interval, ReportsLoader, ReportsUtils) {
        this.allReports = [];
        this._animationDelay = 500;
        this.boundingRect = {
            latitude: 20,
            longitude: 20,
            zoom: 5
        };
        this.mode = {
            type: 'normal',
            options: {
                size: 365, // 10 years
                isPlaying: false,
                position: 0
            }
        };

        ReportsLoader.loadReports().then((reports) => {
            this.allReports = reports;
            this.maxStepNumber = ReportsUtils.getStepsCount(this.allReports, this.mode.options.size) - 1;
        });
    });