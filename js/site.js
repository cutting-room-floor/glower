var mm = com.modestmaps, map, glow;
$.domReady(function() {
  function mapMM() {
    $('#map')[0].innerHTML = '';
    wax.tilejson('http://d.tiles.mapbox.com/v2/energy.billion-ton-update-biomass-production-by-county-v3.jsonp',
    function(tj) {
        map = new mm.Map('map', new wax.mm.connector(tj));
        // wax.mm.interaction(map, tj, {clickAction: []});
        map.setCenterZoom(new mm.Location(38.376115424036016, -97.11914062499999), 5);
        glow = glower.mm(map, tj);
    });
  }

  function mapG() {
    wax.tilejson('http://d.tiles.mapbox.com/v2/energy.billion-ton-update-biomass-production-by-county-v3.jsonp',
      function(tj) {
      map = new google.maps.Map(
        document.getElementById('map'), {
          center: new google.maps.LatLng(38.376, -97.119),
          disableDefaultUI: true,
          zoom: 5,
          mapTypeId: google.maps.MapTypeId.ROADMAP });

      // Use this code to set a new layer as a baselayer -
      // which means that it'll be on the bottom of any other
      // layers and you won't see Google tiles
      map.mapTypes.set('mb', new wax.g.connector(tj));
      map.setMapTypeId('mb');
      glow = glower.g(map, tj);
    });
  }

  $('#red').click(function(e) {
      glow.fillStyle('rgba(186, 38, 35, 0.8)');
      e.stopPropagation();
  });

  $('#green').click(function(e) {
      glow.fillStyle('rgba(19, 157, 3, 0.8)');
      e.stopPropagation();
  });

  $('#blue').click(function(e) {
      glow.fillStyle('rgba(11, 161, 207, 0.8)');
      e.stopPropagation();
  });

  $('#leaf').click(function(e) {
    mapLeaf();
  });

  $('#mm').click(function(e) {
    mapMM();
  });

  $('#g').click(function(e) {
    mapG();
  });

  $('#mm').click();
});
