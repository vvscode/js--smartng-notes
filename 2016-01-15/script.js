angular.module('LfDemoApp', [])
    .directive('leafletMap', function() {
        return {
            template: '<div class="map"></div>',
            restrict: 'E',
            scope: {
                reports: '=',
                boundingRect: '=',
                mode: '@'
            },
            link: function postLink(scope, $el, $attrs) {
                var boundingRect = scope.boundingRect;
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
                            .map((report) => [report.latitude, report.longitude])
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
                                    var markerLatLng = [report.latitude, report.longitude];
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
                var currentMapMode = MAP_MODES[scope.mode] || MAP_MODES.normal;
                currentMapMode.init();

                scope.$watch('mode', function(newVal){
                    var newCurrentMapMode = MAP_MODES[scope.mode] || MAP_MODES.normal;
                    if(newCurrentMapMode !== currentMapMode) {
                        currentMapMode.destruct();
                        newCurrentMapMode.init();
                    }
                    currentMapMode = newCurrentMapMode;
                }, true);


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

                scope.$watch('boundingRect', function(newVal){
                    map.setView([newVal.latitude, newVal.longitude], newVal.zoom);
                }, true);

                // update report markers
                scope.$watch('reports', function(newReports, oldReports) {
                    currentMapMode.clearReportMarkers();
                    reports = newReports;
                    currentMapMode.addReportMarkers(newReports);
                });

                L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                    id: 'examples.map-9ijuk24y'
                }).addTo(map);
            }
        };
    })
    .controller('DemoMapCtrl', function($http) {
        this.reports = [];
        this.boundingRect = {
            latitude: 20,
            longitude: 20,
            zoom: 5
        };
        this.mapMode = 'normal';

        this.refresh = function() {
            var reports = [];
            for(var i = 0; i<100; i++) {
                reports.push({
                    latitude: this.boundingRect.latitude + Math.random() * 10,
                    longitude: this.boundingRect.longitude + Math.random() * 10
                });
            }
            this.reports = reports;
        };

        $http.get('http://notification.systems/api/filterReports', {
            headers: {'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.IjUzZjMzYzhkMjk0N2NkNDU2ZmI5NGJjMyI.jY0oeE2D3-D14d6Z2WqILKfWR5PTduau6R492czGJ80'}
        }).then((resp) => {
            this.reports = resp.data.reports.map((item) => item.location);
        });

        window.cboundingRect = this.boundingRect;
    });