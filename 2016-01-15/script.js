angular.module('LfDemoApp', [])
    .directive('leafletMap', function() {
        return {
            template: '<div class="map"></div>',
            restrict: 'E',
            scope: {
                reports: '@',
                boundingRect: '='
            },
            link: function postLink(scope, $el, $attrs) {
                var boundingRect = scope.boundingRect;
                var zoom = boundingRect.zoom || 13;
                var lat = boundingRect.latitude || 50;
                var lng = boundingRect.longitude || 50;
                var map = L.map($el[0].querySelector('.map')).setView([lat, lng], zoom);

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

                L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                    id: 'examples.map-9ijuk24y'
                }).addTo(map);
            }
        };
    })
    .controller('DemoMapCtrl', function() {
        this.test = 'test string';
        this.reports = [];
        this.boundingRect = {
            latitude: 20,
            longitude: 20,
            zoom: 5
        };
        window.cboundingRect = this.boundingRect;
    });