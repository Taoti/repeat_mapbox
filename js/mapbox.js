(function ($, Drupal) {
  Drupal.behaviors.repeat_mapbox = {
    attach: function (context, settings) {
      if (Drupal.repeat_map === undefined) {
        Drupal.repeat_map = {};
      }
      if ($('#map', context).length && Drupal.repeat_map.map === undefined) {
        mapboxgl.accessToken = ''; // enter token
        Drupal.repeat_map.map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/', // enter mapbox url
          center: [-99.999, 55.555],
          scrollZoom: false,
          zoom: 5
        });

        var nav = new mapboxgl.NavigationControl();
        Drupal.repeat_map.map.addControl(nav, 'top-left');
        Drupal.repeat_map.hash = '';
      }
      if (settings.repeat_mapbox.geojson && Drupal.repeat_map.map) {
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
})(jQuery, Drupal);
