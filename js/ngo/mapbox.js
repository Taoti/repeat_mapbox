(function ($, Drupal) {
  Drupal.repeatMap = {
    markers: [],
    map: null,
    currentPopup: null,
    hoveredStateId: null,
    hoverPopup: new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'ngo-hover-popup',
      offset: 30,
    }),

    clearMarkers: function () {
      for (var i = this.markers.length - 1; i >= 0; i--) {
        this.markers[i].remove();
      }
      this.markers = [];
    },


    createMap: function () {
      const that = this;
      mapboxgl.accessToken = 'pk.eyJ1IjoidmdyZWVuZmllbGQiLCJhIjoiY2tudWg1aTNpMGF6ZDJwczdyMGR3a3VzeSJ9.PYSvmUHMJhmBEkct9jTsjw';
      let mapOptions = {
        container: 'map',
        style: 'mapbox://styles/vgreenfield/cknuhbbxb0k2k17qh83cqwe1c',
        center: [21, 10],
        scrollZoom: false,
        zoom: 2,
      };
      if (drupalSettings.path.isFront) {
        mapOptions.interactive = false;
        mapOptions.pitch = 60;
      }
      this.map = new mapboxgl.Map(mapOptions);
      this.map.on('load', function() {
        that.map.addSource('ngo-countries', {
          type: 'vector',
          url: 'mapbox://mapbox.country-boundaries-v1',
          promoteId: {country_boundaries: 'iso_3166_1'}
        });
        if (drupalSettings.repeatMap.showControls) {
          const nav = new mapboxgl.NavigationControl();
          that.map.addControl(nav, 'bottom-right');
        }
        $('#map').css({'z-index': 20, position: 'relative' });
        if (window.location.pathname === "/") {
          setTimeout(function(){
            that.map.flyTo({
              zoom: 2,
              pitch:0,
              maxDuration:5000,
              curve: 1,
              speed: 0.3,
              easing: (t) => t,
            });
          }, 1000);
        }
        that.setCountryFill();
        that.addMarkers();

      });
      this.map.dragRotate.disable();
      this.map.on('mousemove', 'ngo-countries-fill', (e) => {
        if ($(e.originalEvent.target).hasClass('ngo-map-marker') && !that.currentPopup) {
          if (that.hoverPopup.isOpen()) {
            return;
          }
          let content = '';
          if ($(e.originalEvent.target).hasClass('ngo-map-marker--crisis')) {
            content = '<b>Crisis:</b> InterAction is addressing an ongoing crisis in this country.';
          }
          else if($(e.originalEvent.target).hasClass('ngo-map-marker--multiple')){
            content = 'Updates from InterAction Members working in this country.';
          }else{
            return;
          }
          that.hoverPopup.setHTML(content).setLngLat(e.lngLat).addTo(that.map);
        }
        else {
          that.hoverPopup.remove();
        }
        if (e.features.length > 0) {
          if (that.hoveredStateId !== null) {
            try {
              that.map.setFeatureState(
                {
                  source: 'ngo-countries',
                  sourceLayer: 'country_boundaries',
                  id: that.hoveredStateId
                },
                {hover: null}
              );
            }
            catch (error) {
              console.log(that.hoveredStateId)
              return;
            }
          }
          if (e.features[0].state.popup) {
            that.hoveredStateId = e.features[0].id;
            that.map.setFeatureState(
              {
                source: 'ngo-countries',
                sourceLayer: 'country_boundaries',
                id: that.hoveredStateId
              },
              {hover: true}
            );
          }
        }
      });
      this.map.on('mouseleave', 'ngo-countries-fill', () => {
        that.hoverPopup.remove();
        if (that.hoveredStateId !== null) {
          that.map.setFeatureState(
            {
              source: 'ngo-countries',
              sourceLayer: 'country_boundaries',
              id: that.hoveredStateId
            },
            { hover: null }
          );
        }
        that.hoveredStateId = null;
      });
      this.map.on('click', (e) => {
        if (that.currentPopup) {
          that.currentPopup.remove();
          that.currentPopup = null;
        }
        if (that.hoverPopup) {
          that.hoverPopup.remove();
        }
        // Don't show popup for jurisdiction if clicking on a marker.
        if ($(e.originalEvent.target).hasClass('mapbox-marker')) {
            return;
        }
        // Set `bbox` as 5px rectangle area around clicked point.
        const bbox = [
          [e.point.x - 5, e.point.y - 5],
          [e.point.x + 5, e.point.y + 5]
        ];
        let feature = null;
        if (that.map.getLayer('ngo-countries-fill')) {
          // Find features intersecting the bounding box.
          feature = that.map.queryRenderedFeatures(bbox, {
            layers: ['ngo-countries-fill']
          }).shift();
        }
        if (feature && feature.state.popup) {
          that.currentPopup = new mapboxgl.Popup({className: 'area-popup'})
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setHTML(feature.state.popup).on("open",function() {
              $('.ngo-map-marker').css('z-index','unset')
              $(".menu-overlay")
                .css({"display":"block","opacity":"1","transition":"0.5s"})
                .click(function() {
                areaPopup.remove();
              });
              $("#map").addClass('popup-active');
              $('.landing-page__controls').addClass('page-controls-active');
            }).on("close",function(){
              $(".menu-overlay").css({"display":"none","opacity":"0","transition":"0.5s"});
              $("#map").removeClass('popup-active');
              $('.landing-page__controls').removeClass('page-controls-active');
            })
            .addTo(that.map);
        }
        var areaPopup = that.currentPopup;
      });

    },

    setCountryFill: function() {
      const that = this;
      if (!drupalSettings.repeatMap.countries) {
        return;
      }
      if (!this.map.getLayer('ngo-countries-fill')) {
        this.map.addLayer(
          {
            id: 'ngo-countries-fill',
            type: 'fill',
            source: 'ngo-countries',
            'source-layer': 'country_boundaries',
            paint: {
              'fill-color': [
                'case',
                ['==', ['feature-state', 'hover'], true],
                'rgb(170, 45, 92)',
                ['==', ['feature-state', 'crisis'], "1"],
                'rgb(170,45,92)',
                'rgb(255, 255, 255)' //fallback
              ],
              'fill-opacity': [
                'case',
                ['==', ['feature-state', 'hover'], true],
                0.4,
                ['==', ['feature-state', 'crisis'], "1"],
                0.6,
                0 //fallback
              ]
            }
          },
          'road-label'
        );
        // Only show US worldview to prevent overlapping fills.
        this.map.setFilter('ngo-countries-fill', [
          'all',
          ['match', ['get', 'worldview'], ['all', 'US'], true, false]
        ])
      }
      drupalSettings.repeatMap.countries.features.forEach(function (country) {
        if (!country.properties.field_country_id) {
          return;
        }
        that.map.setFeatureState(
          {
            source: 'ngo-countries',
            sourceLayer: 'country_boundaries',
            id: country.properties.field_country_id
          }, {
            crisis: country.properties.field_in_crisis,
            popup: country.properties.description,
          }
        );
      });
    },

    addMarkers: function() {
      const that = this;
      if (!drupalSettings.repeatMap.member_updates) {
        return;
      }
      this.clearMarkers();
      drupalSettings.repeatMap.member_updates.forEach(function(country) {
        that.createMarker(country)
      });
      Drupal.attachBehaviors(document.getElementsByClassName('mapboxgl-canvas-container')[0], drupalSettings);
    },

    createMarker: function(country) {
      const el = document.createElement('div');
      el.className = 'mapbox-marker ngo-map-marker';
      if (country.properties.crisis === '1') {
        el.className += ' ngo-map-marker--crisis';
      }
      if (country.properties.count === 1) {
        el.className += ' ngo-map-marker--single';
      }
      else {
        el.className += ' ngo-map-marker--multiple';
      }
      el.innerText = country.properties.count;
      $('.ngo-map-marker').click(function(){
        $('.ngo-map-marker').css('z-index','unset')
        $(this).css('z-index','999')
      })
      var makerPopup = new mapboxgl.Popup({offset: 25, className: 'ngo-marker-popup'})
      .setHTML('<div class="marker-title"><p title='+ country.properties.title +'>'+country.properties.title+'</p></div>' + country.properties.description).on("open",function(){
        $(".menu-overlay").css({"display":"block","opacity":"1","transition":"0.5s"});
        $(".menu-overlay").click(function(){
          makerPopup.remove()
        });
        $('.landing-page__controls').addClass('page-controls-active');
        // hide scroll
        jQuery('.mapboxgl-popup-content').on("scroll",function(){
          if(jQuery(this).scrollTop() > 470 ){
              jQuery(this).parents('.ngo-marker-popup').find('.mapboxgl-scroll').fadeOut('slow')
          }else{
            jQuery(this).parents('.ngo-marker-popup').find('.mapboxgl-scroll').fadeIn('slow')
          }
        })
      }).on("close",function(){
        if(window.location.pathname == '/explore' || window.location.pathname == '/filter'){
          $(".menu-overlay").css({"display":"none","opacity":"0","transition":"0.5s"})
        }else if(localStorage.getItem('filterPageVisited') == true ){
          $(".menu-overlay").css({"display":"none","opacity":"0","transition":"0.5s"})
        }
        $('.landing-page__controls').removeClass('page-controls-active');
      })

      const marker = new mapboxgl.Marker(el)
        .setLngLat(country.geometry)
        .setPopup(
          makerPopup
        )
        .addTo(Drupal.repeatMap.map);
      Drupal.repeatMap.markers.push(marker);
    }

  }

  Drupal.behaviors.LotusBehavior = {
    attach: function (context, settings) {
      if ($('#map', context).length && !Drupal.repeatMap.map) {
        Drupal.repeatMap.createMap();
      }
    }
  };
})(jQuery, Drupal);
