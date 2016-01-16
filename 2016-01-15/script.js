angular.module('LfDemoApp', [])
    .directive('leafletMap', function() {
        return {
            template: '<div class="map"></div>',
            restrict: 'E',
            scope: {
                reports: '=',
                boundingRect: '='
            },
            link: function postLink(scope, $el, $attrs) {
                console.log(scope.reports);
                var boundingRect = scope.boundingRect;
                var zoom = boundingRect.zoom || 13;
                var lat = boundingRect.latitude || 50;
                var lng = boundingRect.longitude || 50;
                var map = L.map($el[0].querySelector('.map')).setView([lat, lng], zoom);
                var reportMarkers = [];

                // update bounding rect
                var updateBoundingRect = function(ev) {
                    var center = ev.target.getCenter();
                    boundingRect.zoom = ev.target.getZoom();
                    boundingRect.latitude = center.lat;
                    boundingRect.longitude = center.lng;
                    scope.$apply();
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
                var clearReportMarkers = function() {
                    reportMarkers.forEach((marker) => map.removeLayer(marker));
                    reportMarkers.length = 0;
                };

                var addReportMarkers = function(reports) {
                    (reports || []).forEach((report) => {
                        var marker = L.marker([report.latitude, report.longitude]);
                        map.addLayer(marker);
                        reportMarkers.push(marker);
                    });
                };

                scope.$watch('reports', function(newReports, oldReports) {
                    clearReportMarkers();
                    addReportMarkers(newReports);
                });
                addReportMarkers(scope.reports);

                L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                    id: 'examples.map-9ijuk24y'
                }).addTo(map);
            }
        };
    })
    .controller('DemoMapCtrl', function() {
        this.reports = [];
        this.boundingRect = {
            latitude: 20,
            longitude: 20,
            zoom: 5
        };

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
        this.refresh();

        window.cboundingRect = this.boundingRect;
    });