var mm = com.modestmaps, map;
$.domReady(function() {
  wax.tilejson('http://d.tiles.mapbox.com/v2/energy.billion-ton-update-biomass-production-by-county-v3.jsonp',
    function(tj) {
      map = new mm.Map('map', new wax.mm.connector(tj));
      // wax.mm.interaction(map, tj, {clickAction: []});
      map.setCenterZoom(new mm.Location(38.376115424036016, -97.11914062499999), 5);
      glower(map, tj);
  });
});
