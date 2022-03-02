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
      this.update();
    }

    update() {
      const map = this;
      $.each(repeatMap.update, function(id, fn){
        fn(map);
      });
    }
  }
  window.repeatMap = {
    instances: [],
    update: {},
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
      if (settings.repeat_mapbox && settings.repeat_mapbox.update) {
        $.each(repeatMap.instances, function(n, map){
          map.update();
        });
        settings.repeat_mapbox.update = false;
      }
    }
  };
})(jQuery, Drupal, mapboxgl);
