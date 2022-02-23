# REPEAT MAPBOX

# INTRODUCTION

TAOTI's base [mapbox](https://mapbox.com) implementation. In most cases, you will need to
modify code to achieve your desired results.

# DEPENDENCIES

## Required

- Drupal 9.0+

## Optional

- [Views GeoJSON](https://drupal.org/project/views_geojson) is used by the default
implementation to provide points on the map.

# INSTALLATION

1. Install the module as normal, see also
   [core docs](https://www.drupal.org/documentation/install/modules-themes/modules-8)
2. Set configuration options at `/admin/config/services/mapbox`.


# USAGE

- Add the `Mapbox Map` paragraph anywhere you want a map to appear
- Adjust the views/javascript as necessary to achieve your goals. Like in art, this is how
you get from a couple of circles to a beautiful owl and also similar to drawing tutorials,
is left as an exercise for the reader - future documentation will hopefully expand this.

## Sub Modules

### Repeat Mapbox Countries
Provides a Taxonomy vocabulary and terms for each country with fields for:
- mapbox ID
- ISO 3166 Alpha-2 country code
- marker position.

On install creates terms for countries in mapbox boundaries API level 0 as of 2022, marker
position is set to pretty much centre of each country.

Additionally, provides a light grey highlight on hover effect for countries and serves as an
example module for componentized JS.
