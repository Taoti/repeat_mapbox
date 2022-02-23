(function ($, Drupal) {
    class SearchControl {
        onAdd(map) {
            this.map = map;
            this.container = $(`<div class="mapbox-ctrl zev-map--ctrl zev-map--ctrl--search">
                <svg fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.412 1.58a7.25 7.25 0 115.671 13.344A7.25 7.25 0 015.412 1.58zM13.373 13.377L18.997 19" stroke="#253D86" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <input type="text" placeholder="Find Location"/>
                </div>
            `);
            this.container.find('input').on('input', Drupal.debounce(this.search, 500));
            const search = Drupal.repeatMap.options.get('search');
            if (search) {
                this.container.find('input').val(search);
            }
            return this.container[0];
        }

        onRemove() {
            this.container.remove();
            this.map = undefined;
        }

        search(event) {
            const val = $(this).val();
            Drupal.repeatMap.addMarkers(val.toLowerCase());
            Drupal.repeatMap.options.set('search', val);
            history.pushState(null, '', window.location.pathname + '?' + Drupal.repeatMap.options.toString());
        }

    }

    class LocationsToggleControl {
        onAdd(map){
            this.map = map;
            this.container = document.createElement('div');
            this.container.className = 'mapboxgl-ctrl';
            this.container.className += ' zev-map--ctrl zev-map--ctrl--locations';
            this.container.textContent = 'Layer Companies';
            this.container.onclick = this.click;
            Drupal.repeatMap.search = new SearchControl();
            Drupal.repeatMap.segmentList = new SegmentListControl(Drupal.repeatMap.segments, Drupal.repeatMap.subSegments);
            if (Drupal.repeatMap.locations) {
                Drupal.repeatMap.addMarkers(Drupal.repeatMap.options.get('search'));
                this.container.className += ' zev-map--ctrl--active';
                this.map.addControl(Drupal.repeatMap.search, 'top-left');
                this.map.addControl(Drupal.repeatMap.segmentList, 'bottom-left');
            }
            return this.container;
        }
        onRemove(){
            this.container.parentNode.removeChild(this.container);
            Drupal.repeatMap.map.removeControl(this.search);
            Drupal.repeatMap.map.removeControl(this.segmentList);
            this.map = undefined;
        }
        click() {
            Drupal.repeatMap.locations = !Drupal.repeatMap.locations;
            const options = Drupal.repeatMap.options;
            options.set("locations", Drupal.repeatMap.locations);
            if (!Drupal.repeatMap.locations) {
                options.delete('segmentType');
                options.delete('subsegment');
                options.delete('segment');
                options.delete('marker')
                options.delete('search');
                Drupal.repeatMap.clearMarkers();
                Drupal.repeatMap.map.removeControl(Drupal.repeatMap.search);
                Drupal.repeatMap.map.removeControl(Drupal.repeatMap.segmentList);
            }
            else {
                Drupal.repeatMap.map.addControl(Drupal.repeatMap.search, 'top-left');
                Drupal.repeatMap.map.addControl(Drupal.repeatMap.segmentList, 'bottom-left');
                Drupal.repeatMap.addMarkers();
            }
            history.pushState(null, '', window.location.pathname + '?' + options.toString());
            $(this).toggleClass('zev-map--ctrl--active');
        }
    }
    class AboutControl {
        onAdd(map){
            this.map = map;
            this.container = document.createElement('div');
            this.container.className = 'mapboxgl-ctrl';
            this.container.className += ' zev-map--ctrl zev-map--ctrl--about';
            this.container.textContent = 'About the Project';
            this.container.onclick = this.click;
            return this.container;
        }
        onRemove(){
            this.container.parentNode.removeChild(this.container);
            this.map = undefined;
        }
        click(e) {
            new mapboxgl.Popup({className: 'zev-map--popup zev-map--popup--about'})
                .setHTML(`<h2>About The Project</h2><div>${drupalSettings.repeatMapbox.config.about}</div>`)
                .setLngLat(Drupal.repeatMap.map.getCenter())
                .addTo(Drupal.repeatMap.map);
        }
    }
    class JurisdictionToggleControl {
        onAdd(map){
            this.map = map;
            this.container = document.createElement('div');
            this.container.className = 'mapboxgl-ctrl zev-map--ctrl--jurisdiction';
            const stateControl = document.createElement('div')
            stateControl.className += 'mapboxgl-ctrl zev-map--ctrl  zev-map--ctrl--jurisdiction--state';
            if (Drupal.repeatMap.jurisdiction === "states") {
                stateControl.className += '  zev-map--ctrl--active';
            }
            stateControl.textContent = 'State';
            stateControl.onclick = this.clickState;
            this.container.appendChild(stateControl)

            const districtControl = document.createElement('div')
            districtControl.className += 'mapboxgl-ctrl zev-map--ctrl zev-map--ctrl--jurisdiction--district';
            if (Drupal.repeatMap.jurisdiction === "districts") {
                districtControl.className += '  zev-map--ctrl--active';
            }
            districtControl.textContent = 'District';
            districtControl.onclick = this.clickDistrict;
            this.container.appendChild(districtControl)

            return this.container;
        }
        onRemove(){
            this.container.parentNode.removeChild(this.container);
            this.map = undefined;
        }
        clickState() {
            if ($(this).hasClass('zev-map--ctrl--active')) {
                return;
            }
            $('.views-display-switch__link--block-states').click();
            Drupal.repeatMap.options.set("mode", 'block_' + Drupal.repeatMap.jurisdiction);
            history.pushState(null, '', window.location.pathname + '?' + Drupal.repeatMap.options.toString());
        }
        clickDistrict() {
            if ($(this).hasClass('zev-map--ctrl--active')) {
                return;
            }
            $('.views-display-switch__link--block-districts').click();
            Drupal.repeatMap.options.set("mode", 'block_' + Drupal.repeatMap.jurisdiction);
            history.pushState(null, '', window.location.pathname + '?' + Drupal.repeatMap.options.toString());

        }
    }
    class ValueToggleControl {

        constructor(minEmployees, maxEmployees, minInvestment, maxInvestment) {
            this.minEmployees = minEmployees;
            this.maxEmployees = maxEmployees;
            this.minInvestment = minInvestment; 
            this.maxInvestment = maxInvestment;
            this.colorEmployee = 'linear-gradient(90deg, rgba(128, 93, 155, 0.1) 0%, rgba(128, 93, 155, 0.95) 100%)';
            this.colorInvestment = 'linear-gradient(90deg, rgba(19, 149, 108, 0.1) 0%, rgba(19, 149, 108, 0.95) 100%)';
        }
        onAdd(map){
            this.map = map;
            this.container = document.createElement('div');
            this.container.className = 'mapboxgl-ctrl zev-map--ctrl--value-toggle';
            let color = '';
            let max = '';
            let min = '';
            const investmentControl = document.createElement('div')
            investmentControl.className += 'mapboxgl-ctrl zev-map--ctrl zev-map--ctrl--value-toggle--investment';
            if (Drupal.repeatMap.dataType === "investment") {
                investmentControl.className += ' zev-map--ctrl--active';
                color = this.colorInvestment;
                min = this.minInvestment;
                max = this.maxInvestment + 'M';
            }
            investmentControl.textContent = 'Investment';
            investmentControl.onclick = this.clickInvestment;
            investmentControl.onmouseover = this.helpInvestment;
            investmentControl.onmouseout = this.closeHelp;
            this.container.appendChild(investmentControl)

            const employmentControl = document.createElement('div')
            employmentControl.className += 'mapboxgl-ctrl zev-map--ctrl zev-map--ctrl--value-toggle--employment';
            if (Drupal.repeatMap.dataType === "employment") {
                employmentControl.className += ' zev-map--ctrl--active';
                color = this.colorEmployee;
                min = this.minEmployees;
                max = this.maxEmployees + 'K';
            }
            employmentControl.textContent = 'Employment';
            employmentControl.onclick = this.clickEmployment;
            employmentControl.onmouseover = this.helpEmployment;
            employmentControl.onmouseout = this.closeHelp;
            this.container.appendChild(employmentControl);

            const $slider = $(`<div class='mapbox-ctrl zev-map--ctrl--value-slider'>
            <span class='zev-map--value-slider-min'>$${min}k</span>
            <span class='zev-map--value-slider' style='background: ${color};'></span>
            <span class='zev-map--value-slider-max'>$${max}</span>
            </div>`);
            this.container.appendChild($slider.get(0));

            return this.container;
        }
        onRemove() {
            this.container.parentNode.removeChild(this.container);
            this.map = undefined;
        }
        clickInvestment = () => {
            if ($(this).hasClass('zev-map--ctrl--active')) {
                return;
            }
            $('.zev-map--ctrl--value-toggle .zev-map--ctrl').toggleClass('zev-map--ctrl--active');
            if (Drupal.repeatMap.map.getLayer('zev-states-fill')) {
                Drupal.repeatMap.map.removeLayer('zev-states-fill');
                Drupal.repeatMap.map.removeLayer('zev-states-line');
            }
            if (Drupal.repeatMap.map.getLayer('zev-districts-fill')) {
                Drupal.repeatMap.map.removeLayer('zev-districts-fill');
                Drupal.repeatMap.map.removeLayer('zev-districts-line');
            }
            $('.zev-map--value-slider-min').text("$"+this.minInvestment+"K");
            $('.zev-map--value-slider-max').text("$"+this.maxInvestment+"M");
            $('.zev-map--value-slider').css({
                'background': this.colorInvestment,
            });

            Drupal.repeatMap.dataType = 'investment'
            Drupal.repeatMap.options.set("dataType", Drupal.repeatMap.dataType);
            history.pushState(null, '', window.location.pathname + '?' + Drupal.repeatMap.options.toString());
            Drupal.repeatMap.showStates();
            Drupal.repeatMap.showDistricts();
            Drupal.repeatMap.setDistrictData();
            Drupal.repeatMap.setStateData();
        }
        clickEmployment = () => {
            if ($(this).hasClass('zev-map--ctrl--active')) {
                return;
            }
            $('.zev-map--ctrl--value-toggle .zev-map--ctrl').toggleClass('zev-map--ctrl--active');
            if (Drupal.repeatMap.map.getLayer('zev-states-fill')) {
                Drupal.repeatMap.map.removeLayer('zev-states-fill');
                Drupal.repeatMap.map.removeLayer('zev-states-line');
            }
            if (Drupal.repeatMap.map.getLayer('zev-districts-fill')) {
                Drupal.repeatMap.map.removeLayer('zev-districts-fill');
                Drupal.repeatMap.map.removeLayer('zev-districts-line');
            }
            $('.zev-map--value-slider-min').text("$"+this.minEmployees+"K");
            $('.zev-map--value-slider-max').text("$"+this.maxEmployees+"K");
            $('.zev-map--value-slider').css({
                'background': this.colorEmployee,
            });

            Drupal.repeatMap.dataType = 'employment'
            Drupal.repeatMap.options.set("dataType", Drupal.repeatMap.dataType);
            history.pushState(null, '', window.location.pathname + '?' + Drupal.repeatMap.options.toString());
            Drupal.repeatMap.showStates();
            Drupal.repeatMap.showDistricts();
            Drupal.repeatMap.setDistrictData();
            Drupal.repeatMap.setStateData();
        }
        helpInvestment(e) {
            if (!drupalSettings.repeatMapbox.config.investment) {
                return;
            }
            new mapboxgl.Popup({anchor: 'top', className:'zev-map--hover zev-map--popup--investment', maxWidth: '250px'})
                .setText(drupalSettings.repeatMapbox.config.investment)
                .setLngLat(Drupal.repeatMap.map.getCenter())
                .addTo(Drupal.repeatMap.map);
            let css = $('.zev-map--ctrl--value-toggle--investment').offset();
            css.position = 'relative';
            css.transform = '';
            css.top = 90;
            css.left -= 150;
            css.width = 300;
            $('.zev-map--hover').css(css);
        }
        helpEmployment(e) {
            if (!drupalSettings.repeatMapbox.config.employment) {
                return;
            }
            new mapboxgl.Popup({anchor: 'top', className:'zev-map--hover zev-map--popup--employment', maxWidth: '250px'})
                .setText(drupalSettings.repeatMapbox.config.employment)
                .setLngLat(Drupal.repeatMap.map.getCenter())
                .addTo(Drupal.repeatMap.map);
            let css = $('.zev-map--ctrl--value-toggle--employment').offset();
            css.position = 'relative';
            css.transform = '';
            css.top = 90;
            css.left -= 150;
            css.width = 300;
            $('.zev-map--hover').css(css);
        }
        closeHelp() {
            $('.zev-map--hover').hide();
        }
    }

    class SegmentControl {
        constructor(color, name, dataclass, parent, type) {
            this.color = color;
            this.name = name;
            this.class = dataclass;
            this.type = type;
            this.parent = parent;
        }
        onAdd(map){
            this.map = map;
            this.container = $(`<div class="mapboxgl-ctrl highlight--tag zev-map--ctrl--segment" style="background-color:#${this.color.hex}">${this.name}</div>`);
            this.container[0].addEventListener('click', this);
            $('.zev-map-segment--' + this.class).addClass('mapbox-marker--' + this.color.name)
            return this.container[0];
        }
        onRemove(){
            this.container.remove();
            this.map = undefined;
        }
        handleEvent() {
            this.map.removeControl(this.parent[this.type][this.class]);
            delete this.parent[this.type][this.class];
            this.parent.colors.push(this.color);
            $(`[data-class="${this.class}"]`, this.parent.container).toggleClass('active');
            $('.zev-map-segment--' + this.class).removeClass('mapbox-marker--' + this.color.name)
        }
    }

    class SegmentListControl {
        constructor(segments, subSegments) {
            this.segment = {};
            this.subsegment = {};
            this.colors = [
                {name: 'black', hex: '000'}, // Black
                {name: 'blue', hex: '253d86'}, // Blue
                {name: 'green', hex: '0c9b68'}, // Green
                {name: 'orange', hex: 'e17000'} // Orange
            ];
            this.segments = segments;
            this.subSegments = subSegments;
        }
        onAdd(map) {
            this.map = map;
            this.container = $(`
                <div class="mapboxgl-ctrl highlight--wrapper">
                    <a href="#" class="highlight-toggle" role="button">
                    Industry Segment
                    </a>
                    <div class="highlight--popup">
                        <div class="highlight--tabs">
                            <a href="#" class="highlight--tab" rel="segments">Segments</a>
                            <a href="#" class="highlight--tab" rel="subsegments">Subsegments</a>
                            <a href="#" class="zev-map-ctrl--segment--help">i</a>
                        </div>
                        <div class="highlight--content">
                            <ul class="highlight--list" id="segments">
                            </ul>
                            <ul class="highlight--list" id="subsegments">
                            </ul>
                        </div>
                    </div>
                </div>
            `);

            const that = this;
            this.segments.forEach(function(segment) {
                const segmentElement = $(
                    `<li class="mapboxgl-ctrl zev-map--ctrl zev-map--ctrl--segment" data-class="${segment.class}" data-type="segment">
                    ${segment.name}
                </li>`);
                segmentElement[0].addEventListener('click', that)
                $('#segments', that.container).append(segmentElement);
            });
            this.subSegments.forEach(function(segment) {
                const segmentElement = $(
                    `<li class="mapboxgl-ctrl zev-map--ctrl zev-map--ctrl--sub-segment" data-class="${segment.class}" data-type="subsegment">
                    ${segment.name}
                </li>`);
                segmentElement[0].addEventListener('click', that)
                $('#subsegments', that.container).append(segmentElement);
            });
            return this.container[0];
        }
        onRemove(){
            if (this.container) {
                this.container.remove();
                Object.values(this.segment).forEach(function (segment) {
                    segment.handleEvent();
                });
                Object.values(this.subsegment).forEach(function (segment) {
                    segment.handleEvent();
                });
            }
            this.map = undefined;
        }

        handleEvent(event) {
            const element = event.currentTarget;
            if (element.dataset.type === 'segment') {
                this.clickSegment(element);
            }
            else {
                this.clickSubSegment(element);
            }
        }

        clickSegment(element) {
            const options = Drupal.repeatMap.options;
            if (Object.keys(this.subsegment).length !== 0) {
                const ask = confirm(`Segments and Sub-Segments cannot be viewed simultaneously. Selecting ${element.textContent} will clear current selections. Do you wish to proceed?`);
                if (!ask) {
                    return;
                }
                Object.values(this.subsegment).forEach(function(segment){
                    segment.handleEvent();
                });
                options.delete('subsegment');
            }
            const dataclass = element.dataset.class;
            if ($(element).hasClass('active')) {
                this.segment[dataclass].handleEvent();
                return;
            }
            const segmentCount = Object.keys(this.segment).length;
            if (segmentCount >= 4) {
                alert(`Maximum 4 highlighted segments at once.`);
                return;
            }
            let color = this.colors.pop();
            this.segment[dataclass] = new SegmentControl(color, element.textContent, dataclass, this, element.dataset.type);
            options.set("segmentType", 'segment');
            options.delete('segment');
            Object.keys(this.segment).forEach(function (segment) {
               options.append('segment', segment);
            });
            history.pushState(null, '', window.location.pathname + '?' + options.toString());
            this.map.addControl(this.segment[dataclass], 'bottom-left');
            $(element).toggleClass('active');
        }
        clickSubSegment(element) {
            const options = Drupal.repeatMap.options;
            if (Object.keys(this.segment).length !== 0) {
                const ask = confirm(`Segments and Sub-Segments cannot be viewed simultaneously. Selecting ${element.textContent} will clear current selections. Do you wish to proceed?`);
                if (!ask) {
                    return;
                }
                Object.values(this.segment).forEach(function(segment){
                    segment.handleEvent();
                });
                options.delete('segment');
            }
            const dataclass = element.dataset.class;
            if ($(element).hasClass('active')) {
                this.subsegment[dataclass].handleEvent();
                return;
            }
            const segmentCount = Object.keys(this.subsegment).length;
            if (segmentCount >= 4) {
                alert(`Maximum 4 highlighted subsegments at once.`);
                return;
            }
            let color = this.colors.pop();
            this.subsegment[dataclass] = new SegmentControl(color, element.textContent, dataclass, this, element.dataset.type);
            options.set("segmentType", 'subsegment');
            options.delete('subsegment');
            Object.keys(this.subsegment).forEach(function (segment) {
                options.append('subsegment', segment);
            });
            history.pushState(null, '', window.location.pathname + '?' + options.toString());
            this.map.addControl(this.subsegment[dataclass], 'bottom-left');
            $(element).toggleClass('active');
        }
    }

    Drupal.repeatMap = {
        markers: {},
        hash: '',
        map: null,
        dataType: 'investment',
        jurisdiction: 'states',
        locations: true,
        locationData: null,
        statesLookup: null,
        statesData: null,
        districtData: null,
        districtLookup: null,
        hoveredStateId: null,
        selectStateId: null,
        currentPopup: null,
        minEmployees: 15,
        maxEmployees: 50,
        minInvestment: 700,
        maxInvestment: 50,
        popupOpen: false,
        init: 0,
        options: new URLSearchParams(window.location.search),

        /**
         * Remove all current markers.
         */
        clearMarkers: function () {
            const that = this;
            Object.entries(this.markers).forEach(function ([key, marker]) {
                marker.remove();
                delete that.markers[key];
            });
            // Safety - ensure all markers gone.
            $('.mapbox-marker').remove();
        },

        /**
         * Create the base map and begin loading data.
         */
        createMap: function () {
            const that = this;
            this.throbber = $(Drupal.theme.ajaxProgressIndicatorFullscreen()).appendTo('body');

            // Start loading all data async.
            fetch(drupalSettings.repeatMapbox.data_path + '/states.json')
                .then(response => response.json())
                .then(function (response) {
                    that.statesLookup = that.filterStates(response);
                    that.init++;
                    if (that.init === 9) {
                        that.finishLoading()
                    }
                });
            fetch(drupalSettings.repeatMapbox.data_path + '/congressional-districts.json')
                .then(response => response.json())
                .then(function (response) {
                    that.districtLookup = that.filterDistricts(response);
                    that.init++;
                    if (that.init === 9) {
                        that.finishLoading()
                    }
                });
            fetch('/zev-map/segments')
                .then(response => response.json())
                .then(function (response) {
                    that.segments = response;
                    that.init++;
                    if (that.init === 9) {
                        that.finishLoading()
                    }
                });
            fetch('/zev-map/sub-segments')
                .then(response => response.json())
                .then(function (response) {
                    that.subSegments = response;
                    that.init++;
                    if (that.init === 9) {
                        that.finishLoading()
                    }
                });
            fetch('/zev-map/states')
                .then(response => response.json())
                .then(function (response) {
                    that.statesData = response;
                    that.init++;
                    if (that.init === 9) {
                        that.finishLoading()
                    }
                })
            fetch('/zev-map/districts')
                .then(response => response.json())
                .then(function (response) {
                    that.districtData = response;
                    that.init++;
                    if (that.init === 9) {
                        that.finishLoading()
                    }
                });
            fetch('/zev-map/locations')
                .then(response => response.json())
                .then(function(response) {
                    that.locationData = response.features;
                    that.init++;
                    if (that.init === 9) {
                        that.finishLoading()
                    }
                });
            mapboxgl.accessToken = 'pk.eyJ1IjoiZWRmd2VidGVhbSIsImEiOiJjancxM3BobHQwaHc4NDNvZGJpenVtcHU1In0.C20Ws4Si6vTrw7HYd3iGfA';
            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/vgreenfield/ckrffcw430ycm18qdt59gmrqs',
                center: [-98, 40],
                scrollZoom: false,
                zoom: 4
            });
            this.map.on('load', function() {
                that.map.addSource('zev-states', {
                    type: 'vector',
                    url: 'mapbox://mapbox.boundaries-adm1-v3'
                });
                that.map.addSource('zev-districts', {
                    type: 'vector',
                    url: 'mapbox://mapbox.boundaries-leg2-v3'
                });
                let option = that.options.get('dataType');
                if (option) {
                    that['dataType'] = option;
                }
                option = that.options.get('mode');
                if (option) {
                    that.jurisdiction = option.replace('block_', '');
                }
                option = that.options.get('locations');
                if (option === "false") {
                    that.locations = false;
                }
                that.init++;
                if (that.init === 9) {
                    that.finishLoading()
                }
            });
            this.map.on('click', $.proxy(this.mapClick, this));

            this.map.on('mousemove', 'zev-states-fill', (e) => {
                if (e.features.length > 0) {
                    if (that.hoveredStateId !== null) {
                        that.map.setFeatureState(
                            {
                                source: 'zev-states',
                                sourceLayer: 'boundaries_admin_1',
                                id: that.hoveredStateId
                            },
                            { hover: null }
                        );
                    }
                    that.hoveredStateId = e.features[0].id;
                    if (e.features[0].properties.iso_3166_1 !== 'US') {
                        return;
                    }
                    that.map.setFeatureState(
                        {
                            source: 'zev-states',
                            sourceLayer: 'boundaries_admin_1',
                            id: that.hoveredStateId
                        },
                        { hover: true }
                    );
                }
            });
            this.map.on('mouseleave', 'zev-states-fill', () => {
                if (that.hoveredStateId !== null) {
                    that.map.setFeatureState(
                        {
                            source: 'zev-states',
                            sourceLayer: 'boundaries_admin_1',
                            id: that.hoveredStateId
                        },
                        { hover: null }
                    );
                }
                that.hoveredStateId = null;
            });
            this.map.on('mousemove', 'zev-districts-fill', (e) => {
                if (e.features.length > 0) {
                    if (that.hoveredStateId !== null) {
                        that.map.setFeatureState(
                            {
                                source: 'zev-districts',
                                sourceLayer: 'boundaries_legislative_2',
                                id: that.hoveredStateId
                            },
                            { hover: null }
                        );
                    }
                    that.hoveredStateId = e.features[0].id;
                    if (e.features[0].properties.iso_3166_1 !== 'US') {
                        return;
                    }
                    that.map.setFeatureState(
                        {
                            source: 'zev-districts',
                            sourceLayer: 'boundaries_legislative_2',
                            id: that.hoveredStateId
                        },
                        { hover: true }
                    );
                }
            });
            this.map.on('mouseleave', 'zev-districts-fill', () => {
                if (that.hoveredStateId !== null) {
                    that.map.setFeatureState(
                        {
                            source: 'zev-districts',
                            sourceLayer: 'boundaries_legislative_2',
                            id: that.hoveredStateId
                        },
                        { hover: null }
                    );
                }
                that.hoveredStateId = null;
            });
            var mobileTap = 'auto';
            var tapped=false;
            this.map.on("touchstart",function(e){
                if(!tapped){ //if tap is not set, set up single tap
                  tapped=setTimeout(function(){
                      tapped=null
                      //insert things you want to do when single tapped
                  },300);   //wait 300ms then run single click code
                } else {    //tapped within 300ms of last tap. double tap
                  clearTimeout(tapped); //stop single tap callback
                  tapped=null
                  if(mobileTap == 'none'){
                    mobileTap = 'auto';
                    that.map.dragPan.enable();
                  }else{
                    mobileTap = 'none'
                    that.map.dragPan.disable();
                  }
                }

            });
        },

        /**
         * Place active controls and markers on the map when data is loaded.
         */
        finishLoading: function () {
            const that = this;
            const jurisdictionControl = new JurisdictionToggleControl();
            this.map.addControl(jurisdictionControl, 'bottom-right');
            const nav = new mapboxgl.NavigationControl();
            this.map.addControl(nav, 'bottom-right');
            const valueTypeToggle = new ValueToggleControl(this.minEmployees, this.maxEmployees, this.minInvestment , this.maxInvestment);
            this.map.addControl(valueTypeToggle, 'top-right');
            const locationsToggle = new LocationsToggleControl();
            this.map.addControl(locationsToggle, 'top-right');
            const aboutButton = new AboutControl();
            this.map.addControl(aboutButton, 'top-right');
            this.throbber.remove();
            if (this.locations) {
                if (this.options.get('segmentType') === 'segment') {
                    this.options.getAll('segment').forEach(function(segment){
                        $(`.zev-map--ctrl--segment[data-class="${segment}"]`).click()
                    });
                }
                else if (this.options.get('segmentType') === 'subsegment') {
                    this.options.getAll('subsegment').forEach(function(segment){
                        $(`.zev-map--ctrl--sub-segment[data-class="${segment}"]`).click();
                    });
                }
                if (this.options.get('marker')) {
                    const marker = this.markers[this.options.get('marker')];
                    if (marker) {
                        marker.togglePopup();
                    }
                }
            }
            this.showStates();
            this.showDistricts();
            const feature = this.options.get('feature');
            let state = null;
            if (feature) {
                if (this.jurisdiction === 'states') {
                    this.map.setFeatureState(
                        {
                            source: 'zev-states',
                            sourceLayer: 'boundaries_admin_1',
                            id: feature
                        },
                        {selected: true}
                    );
                    state = this.map.getFeatureState({
                        source: 'zev-states',
                        sourceLayer: 'boundaries_admin_1',
                        id: feature
                    });
                }
                else {
                    this.map.setFeatureState(
                        {
                            source: 'zev-districts',
                            sourceLayer: 'boundaries_legislative_2',
                            id: feature
                        },
                        {selected: true}
                    );
                    state = this.map.getFeatureState({
                        source: 'zev-districts',
                        sourceLayer: 'boundaries_legislative_2',
                        id: feature
                    });
                }
                if (state) {
                    this.currentPopup = new mapboxgl.Popup({className:'area-popup'})
                        .setLngLat(this.map.getCenter())
                        .setHTML(state.popup)
                        .addTo(this.map)
                        .on('close', $.proxy(this.closePopup, this));
                    Drupal.attachBehaviors(document.getElementsByClassName('area-popup')[0], drupalSettings);
                    this.selectStateId = feature;
                    this.popupOpen = true;
                }
            }
        },

        mapClick: function(e) {
            if (this.currentPopup) {
                this.currentPopup.remove();
                delete this.currentPopup;
                return;
            }
            // Don't show popup for jurisdiction if clicking on a marker.
            if (e.originalEvent && $(e.originalEvent.target).hasClass('mapbox-marker')) {
                return;
            }
            this.options.delete('marker');
            // Set `bbox` as 5px rectangle area around clicked point.
            const bbox = [
                [e.point.x - 5, e.point.y - 5],
                [e.point.x + 5, e.point.y + 5]
            ];
            let feature = null;
            if (this.map.getLayer('zev-states-fill')) {
                // Find features intersecting the bounding box.
                feature = this.map.queryRenderedFeatures(bbox, {
                    layers: ['zev-states-fill']
                }).shift();
            }
            else if (this.map.getLayer('zev-districts-fill')) {
                feature = this.map.queryRenderedFeatures(bbox, {
                    layers: ['zev-districts-fill']
                }).shift();
            }
            if (feature && feature.state.popup) {
                this.currentPopup = new mapboxgl.Popup({className:'area-popup'})
                    .setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .setHTML(feature.state.popup)
                    .addTo(this.map)
                    .on('close', $.proxy(this.closePopup, this));
                Drupal.attachBehaviors(document.getElementsByClassName('area-popup')[0], drupalSettings);
                this.selectStateId = feature.id;
                if (this.jurisdiction === 'states') {
                    this.map.setFeatureState(
                        {
                            source: 'zev-states',
                            sourceLayer: 'boundaries_admin_1',
                            id: this.selectStateId
                        },
                        {selected: true}
                    );
                }
                else {
                    this.map.setFeatureState(
                        {
                            source: 'zev-districts',
                            sourceLayer: 'boundaries_legislative_2',
                            id: this.selectStateId
                        },
                        {selected: true}
                    );
                }
                this.map.flyTo({
                    center: e.lngLat,
                });
                this.popupOpen = true;
                this.options.set('feature', feature.id);
            }
            history.pushState(null, '', window.location.pathname + '?' + this.options.toString());
        },

        /**
         * Reset data when closing an informational popup for a jurisdiction.
         */
        closePopup: function () {
            if (!this.selectStateId || !this.popupOpen) {
                return;
            }
            if (this.jurisdiction === 'states') {
                this.map.setFeatureState(
                    {
                        source: 'zev-states',
                        sourceLayer: 'boundaries_admin_1',
                        id: this.selectStateId
                    },
                    {selected: null}
                );
            }
            else {
                this.map.setFeatureState(
                    {
                        source: 'zev-districts',
                        sourceLayer: 'boundaries_legislative_2',
                        id: this.selectStateId
                    },
                    {selected: null}
                );
            }
            this.selectStateId = null;
            this.popupOpen = false;
            this.currentPopup = null;
            this.options.delete('feature');
            history.pushState(null, '', window.location.pathname + '?' + this.options.toString());
        },

        /**
         * Add location markers to the map. If search is provided, will filter
         * locations to require search term is in the marker name/description.
         *
         * @param search
         */
        addMarkers: function (search) {
            const that = this;
            this.clearMarkers();
            const $throbber = $(Drupal.theme.ajaxProgressIndicatorFullscreen()).appendTo('body');
            $('.zev-map-ctrl--segment--help').click(function (e) {
                new mapboxgl.Popup({className: 'zev-map--popup zev-map--popup--about-segments'})
                    .setHTML(`<h2>About Segments & Sub-Segments</h2><div>${drupalSettings.repeatMapbox.config.segments}</div>`)
                    .setLngLat(Drupal.repeatMap.map.getCenter())
                    .addTo(that.map);
            })
            if (search) {
                this.locationData.forEach(function (data) {
                    if (data.properties.name.toLowerCase().includes(search) || data.properties.description.toLowerCase().includes(search)) {
                        that.createMarker(data);
                    }
                });
            }
            else {
                this.locationData.forEach(this.createMarker);
            }
            Drupal.attachBehaviors(document.getElementsByClassName('mapboxgl-canvas-container')[0], drupalSettings);
            $throbber.remove();
        },

        /**
         * Create an individual location marker on the map with provided data.
         *
         * @param data
         */
        createMarker: function (data) {
            const el = document.createElement('div');
            el.id = data.properties.title_1;
            el.className = 'mapbox-marker';
            el.className += ' zev-map-segment--' + data.properties.field_industry_main_segment;
            el.className += ' zev-map-segment--' + data.properties.field_industry_sub_segment;
            Drupal.repeatMap.markers[data.properties.title_1]= new mapboxgl.Marker({
                element: el,
                anchor: 'bottom',
            })
                .setLngLat(data.geometry.coordinates)
                .setPopup(new mapboxgl.Popup({offset: 25,className: "marker-popup"})
                    .setHTML('<h3>' + data.properties.name + '</h3><p>' + data.properties.description + '</p>')
                    .on('close', Drupal.repeatMap.closeMarkerPopup)
                )
                .addTo(Drupal.repeatMap.map);
        },

        closeMarkerPopup: function () {
            if (Drupal.repeatMap.options.get('marker')) {
                Drupal.repeatMap.options.delete('marker');
                history.pushState(null, '', window.location.pathname + '?' + Drupal.repeatMap.options.toString());
            }
        },

        /**
         * Re-map the mapbox api state features to use the iso_3166_2 value as
         * key. Also ensure only loading US features.
         *
         * @param input
         * @returns {{}}
         */
        filterStates: function (input) {
            let data = input.adm1.data.all;
            let lookupData = {};
            let feature = null;
            for (feature in data) {
                if (!data.hasOwnProperty(feature)) {
                    continue;
                }
                let featureData = data[feature];
                // key the data by 2 digit state code.
                if (featureData.iso_3166_1 === 'US') {
                    lookupData[featureData['join_attributes']['iso_3166_2']] = featureData;
                }
            }
            return lookupData;
        },

        /**
         * Re-map the mapbox api state features to use the iso_3166_2 value as
         * key. Also ensure only loading US features.
         *
         * @param input
         * @returns {{}}
         */
        filterDistricts: function (input) {
            let data = input.leg2.data.all;
            let lookupData = {};
            let feature = null;
            for (feature in data) {
                if (!data.hasOwnProperty(feature)) {
                    continue;
                }
                let featureData = data[feature];
                // key the data by 4 digit unit code - the two digit state code
                // + 2 digit district code.
                if (featureData.iso_3166_1 === 'US') {
                    lookupData[featureData['unit_code']] = featureData;
                }
            }
            return lookupData;
        },

        showStates: function() {
            if (this.map.getLayer('zev-states-fill') || this.jurisdiction !== 'states') {
                return;
            }
            if (this.map.getLayer('zev-districts-fill')) {
                this.map.removeLayer('zev-districts-fill');
                this.map.removeLayer('zev-districts-line');
            }
            let color = [];
            if (this.dataType === 'employment') {
                color = [
                    'case',
                    ['!=', ['feature-state', 'hover'], null],
                    'rgba(98, 63, 125, 1.0)',
                    ['!=', ['feature-state', 'selected'], null],
                    'rgba(108, 73, 135, 1.0)',
                    ['==', ['feature-state', 'employment'], null],
                    'rgba(255, 255, 255, 0)',
                    ['>', ['feature-state', 'employment'], 0],
                    [
                        'interpolate',
                        ['linear'],
                        ['feature-state', 'employment'],
                        1, 'rgba(128, 93, 155, 0.1)',
                        this.maxEmployees, 'rgba(128, 93, 155, 0.9)'
                    ],
                    'rgba(255, 255, 255, 0)'
                ];
            }
            else {
                color = [
                    'case',
                    ['!=', ['feature-state', 'hover'], null],
                    'rgba(0, 129, 88, 1.0)',
                    ['!=', ['feature-state', 'selected'], null],
                    'rgba(9, 139, 98, 1.0)',
                    ['==', ['feature-state', 'investment'], null],
                    'rgba(255, 255, 255, 0)',
                    ['>', ['feature-state', 'investment'], 0], // condition
                    [
                        'interpolate',
                        ['linear'],
                        ['feature-state', 'investment'],
                        1, 'rgba(19, 149, 108, 0.1)',
                        this.maxInvestment, 'rgba(19, 149, 108, 0.9)'
                    ], //output
                    'rgba(255, 255, 255, 0)' //fallback
                ];
            }
            // Add a layer with boundary polygons
            this.map.addLayer(
                {
                    id: 'zev-states-fill',
                    type: 'fill',
                    source: 'zev-states',
                    'source-layer': 'boundaries_admin_1',
                    paint: {
                        'fill-color': color
                    }
                },
                // set the layer z-index basically - point at the layer that will sit on top of it.
                'road-path'
            );
            this.map.addLayer(
                {
                    id: 'zev-states-line',
                    type: 'line',
                    source: 'zev-states',
                    'source-layer': 'boundaries_admin_1',
                    paint: {
                        'line-color': '#FFFFFF',
                        'line-opacity': [
                            'case',
                            ['!=', ['feature-state', 'selected'], null],
                            1,
                            0
                        ],
                        'line-width': 5
                    }
                },
                'road-label-simple'
            );
            this.setStateData();
        },

        setStateData: function() {
            const that = this;
            if (!this.map.getLayer('zev-states-fill')) {
                return;
            }
            this.statesData.forEach(function(row) {
                let id = 'US-' + row.state_id;
                if (that.statesLookup.hasOwnProperty(id)) {
                    that.map.setFeatureState({
                        source: 'zev-states',
                        sourceLayer: 'boundaries_admin_1',
                        id: that.statesLookup[id].feature_id
                    }, {
                        employment: parseInt(row.employees),
                        investment: parseInt(row.investment),
                        popup: row.popup,
                    });
                }
            });
        },

        showDistricts: function() {
            if (this.map.getLayer('zev-districts-fill') || this.jurisdiction !== 'districts') {
                return;
            }
            if (this.map.getLayer('zev-states-fill')) {
                this.map.removeLayer('zev-states-fill');
                this.map.removeLayer('zev-states-line');
            }
            let color = [];
            if (this.dataType === 'employment') {
                color = [
                    'case',
                    ['!=', ['feature-state', 'hover'], null],
                    'rgba(98, 63, 125, 1.0)',
                    ['!=', ['feature-state', 'selected'], null],
                    'rgba(108, 73, 135, 1.0)',
                    ['==', ['feature-state', 'employment'], null],
                    'rgba(255, 255, 255, 0)',
                    ['>', ['feature-state', 'employment'], 0],
                    [
                        'interpolate',
                        ['linear'],
                        ['feature-state', 'employment'],
                        1, 'rgba(128, 93, 155, 0.1)',
                        this.maxEmployees, 'rgba(128, 93, 155, 0.9)'
                    ],
                    'rgba(255, 255, 255, 0)'
                ];
            }
            else {
                color = [
                    'case',
                    ['!=', ['feature-state', 'hover'], null],
                    'rgba(0, 129, 88, 1.0)',
                    ['!=', ['feature-state', 'selected'], null],
                    'rgba(9, 139, 98, 1.0)',
                    ['==', ['feature-state', 'investment'], null],
                    'rgba(255, 255, 255, 0)',
                    ['>', ['feature-state', 'investment'], 0],
                    [
                        'interpolate',
                        ['linear'],
                        ['feature-state', 'investment'],
                        1, 'rgba(19, 149, 108, 0.1)',
                        this.maxInvestment, 'rgba(19, 149, 108, 0.9)'
                    ], //output
                    'rgba(255, 255, 255, 0)' //fallback
                ];
            }
            // Add a layer with boundary polygons
            this.map.addLayer(
                {
                    id: 'zev-districts-fill',
                    type: 'fill',
                    source: 'zev-districts',
                    'source-layer': 'boundaries_legislative_2',
                    paint: {
                        'fill-color': color
                    }
                },
                // set the layer z-index basically - point at the layer that will sit on top of it.
                'road-path'
            );
            this.map.addLayer(
                {
                    id: 'zev-districts-line',
                    type: 'line',
                    source: 'zev-districts',
                    'source-layer': 'boundaries_legislative_2',
                    paint: {
                        'line-color': '#FFFFFF',
                        'line-opacity': [
                            'case',
                            ['!=', ['feature-state', 'selected'], null],
                            1,
                            0
                        ],
                        'line-width': 5
                    }
                },
                'road-label-simple'
            );
            this.setDistrictData();
        },

        setDistrictData: function() {
            const that = this;
            if (!this.map.getLayer('zev-districts-fill')) {
                return;
            }
            this.districtData.forEach(function(row) {
                if (that.districtLookup.hasOwnProperty(row.unit_id)) {
                    that.map.setFeatureState({
                        source: 'zev-districts',
                        sourceLayer: 'boundaries_legislative_2',
                        id: that.districtLookup[row.unit_id].feature_id
                    }, {
                        employment: parseInt(row.employees),
                        investment: parseInt(row.investment),
                        popup: row.popup,
                    });
                }
            });
        },

    }

    Drupal.behaviors.LotusBehavior = {
        attach: function (context, settings) {
            if ($('#map', context).length && !Drupal.repeatMap.map) {
                Drupal.repeatMap.createMap();
            }

            $('.views-display-switch__link--block-districts', context).click(function(e){
                if ($(this).hasClass('views-display-switch__link--active')) {
                    e.stopPropagation()
                    return;
                }
                $('.zev-map--ctrl--jurisdiction .zev-map--ctrl').toggleClass('zev-map--ctrl--active');
                Drupal.repeatMap.jurisdiction = 'districts'
                Drupal.repeatMap.showDistricts();
            })
            $('.views-display-switch__link--block-states', context).click(function(e){
                if ($(this).hasClass('views-display-switch__link--active')) {
                    e.stopPropagation()
                    return;
                }
                $('.zev-map--ctrl--jurisdiction .zev-map--ctrl').toggleClass('zev-map--ctrl--active');
                Drupal.repeatMap.jurisdiction = 'states'
                Drupal.repeatMap.showStates();
            })
            $('.mapbox-marker', context).once('zev-map').on('click',function (e) {
                const options = Drupal.repeatMap.options;
                options.set("marker", $(this).attr('id'));
                history.pushState(null, '', window.location.pathname + '?' + options.toString());
                setTimeout(function () {
                    Drupal.attachBehaviors(document.getElementsByClassName('marker-popup')[0], drupalSettings);
                }, 200);
            });
        }
    };
})(jQuery, Drupal);
