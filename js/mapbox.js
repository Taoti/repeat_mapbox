(function ($, Drupal, mapboxgl) {
  class RepeatMap {
    constructor(element) {
      this.element = element;
      this.controls = {};
      let $element = $(element);
      const settings = drupalSettings.repeatMapbox.settings;
      let options = $.extend({}, {
          container: element,
          style: settings.url,
          center: [21, 10],
          scrollZoom: false,
          zoom: 2
        },
        $element.data());
      mapboxgl.accessToken = settings.token;
      const map = this;
      this.mapbox = new mapboxgl.Map(options);
      this.mapbox.on('load', $.proxy(this.load, this));
      this.mapbox.on('idle',function(){
        map.mapbox.resize()
      });
    }

    load() {
      const map = this;
      $.each(repeatMap.load, function(id, fn){
        fn(map);
      });
    }
  }
  window.repeatMap = {
    instances: [],
    load: {
      addNavigation: function(map) {
        map.controls.nav = new mapboxgl.NavigationControl();
        map.mapbox.addControl(map.controls.nav, 'top-right');
      }
    },

  }
  Drupal.behaviors.repeat_mapbox = {
    attach: function (context, settings) {
      $('.repeat_mapbox').once().each(function() {
        repeatMap.instances.push(new RepeatMap(this));
      });

      if (settings.repeat_mapbox && settings.repeat_mapbox.geojson && Drupal.repeat_map.map) {
        if (Drupal.repeat_map.hash !== settings.repeat_mapbox.hash) {
          if (Drupal.repeat_map.markers !== undefined) {
            for (var i = Drupal.repeat_map.markers.length - 1; i >= 0; i--) {
              Drupal.repeat_map.markers[i].remove();
            }
          }
          Drupal.repeat_map.markers = [];
          settings.repeat_mapbox.geojson.features.forEach(function (marker) {
            var el = document.createElement('div');
            el.className = 'mapbox-marker';
            if (marker.properties.field_pathway) {
              el.className += ' pathway--' + marker.properties.field_pathway.toLowerCase();
            }
            // Make a marker for each feature and add to the map.
            var status_with_label = (marker.properties.field_status) ? 'Status: ' + marker.properties.field_status : '';
            var temp_marker = new mapboxgl.Marker(el)
                .setLngLat(marker.geometry.coordinates)
                .setPopup(new mapboxgl.Popup({offset: 25})
                    .setHTML('<span class="status">' + status_with_label + '</span><div class="properties"><h3>' + marker.properties.name + '</h3><p>' + marker.properties.description + '</p></div>'))
                .addTo(Drupal.repeat_map.map);
            Drupal.repeat_map.markers.push(temp_marker);
          });
          Drupal.repeat_map.hash = settings.repeat_mapbox.hash;
          drupalSettings.repeat_mapbox.geojson = settings.repeat_mapbox.geojson = null;
        }
      }
    }
  };
})(jQuery, Drupal, mapboxgl);
