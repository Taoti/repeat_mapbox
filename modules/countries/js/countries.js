(function ($, Drupal, mapboxgl) {

  window.repeatMap.load.repeat_mapbox_countries = function(map) {
    map.hoveredStateId = null;
    map.mapbox.addSource('repeat_mapbox_countries', {
      type: 'vector',
      url: 'mapbox://mapbox.country-boundaries-v1',
      promoteId: {country_boundaries: 'iso_3166_1'}
    });
    map.mapbox.addLayer(
      {
        id: 'repeat_mapbox_countries_fill',
        type: 'fill',
        source: 'repeat_mapbox_countries',
        'source-layer': 'country_boundaries',
        paint: {
          'fill-color': [
            'case',
            ['==', ['feature-state', 'hover'], true],
            'rgb(00, 00, 00)',
            'rgb(255, 255, 255)'
          ],
          'fill-opacity': [
            'case',
            ['==', ['feature-state', 'hover'], true],
            0.2,
            0
          ]
        }
      },
      'road-label'
    );
    // Only show US worldview to prevent overlapping fills.
    map.mapbox.setFilter('repeat_mapbox_countries_fill', [
      'all',
      ['match', ['get', 'worldview'], ['all', 'US'], true, false]
    ]);
    map.mapbox.on('mousemove', 'repeat_mapbox_countries_fill', (e) => {
      if (e.features.length > 0) {
        if (map.hoveredStateId !== null) {
          try {
            map.mapbox.setFeatureState(
              {
                source: 'repeat_mapbox_countries',
                sourceLayer: 'country_boundaries',
                id: map.hoveredStateId
              },
              {hover: null}
            );
          }
          catch (error) {
            console.log(map.hoveredStateId)
            return;
          }
        }
        map.hoveredStateId = e.features[0].id;
        map.mapbox.setFeatureState(
          {
            source: 'repeat_mapbox_countries',
            sourceLayer: 'country_boundaries',
            id: map.hoveredStateId
          },
          {hover: true}
        );
      }

    });
    map.mapbox.on('mouseleave', 'repeat_mapbox_countries_fill', () => {
      if (map.hoveredStateId !== null) {
        map.mapbox.setFeatureState(
          {
            source: 'repeat_mapbox_countries',
            sourceLayer: 'country_boundaries',
            id: map.hoveredStateId
          },
          { hover: null }
        );
      }
      map.hoveredStateId = null;
    });
  }

})(jQuery, Drupal);
