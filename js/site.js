var mm = com.modestmaps, map;
$.domReady(function() {
  wax.tilejson('http://d.tiles.mapbox.com/v2/energy.billion-ton-update-biomass-production-by-county-v3.jsonp',
    function(tj) {
      map = new mm.Map('map', new wax.mm.connector(tj));
      // wax.mm.interaction(map, tj, {clickAction: []});
      map.setCenterZoom(new mm.Location(38.376115424036016, -97.11914062499999), 5);
      var glow = glower(map, tj);

      $('#red').click(function(e) {
          glow.fillStyle('rgba(255, 107, 107, 0.8)');
          e.stopPropagation();
      });

      $('#green').click(function(e) {
          glow.fillStyle('rgba(107, 255, 107, 0.8)');
          e.stopPropagation();
      });

      $('#blue').click(function(e) {
          glow.fillStyle('rgba(11, 161, 207, 0.8)');
          e.stopPropagation();
      });
  });
});
