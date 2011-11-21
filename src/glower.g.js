if (!glower) throw new Error('glower base library required');

(function(lib) {
    function glower(map, tj, options) {

        options = options || {};

        var waxGM = wax.GridManager(tj),
            eventoffset = wax.util.eventoffset,
            e = {},
            hovertiles = map.getDiv().appendChild(document.createElement('div')),
            _af, // active feature
            to_antialias, // anti-alias timeout
            to_fulltiles, // anti-alias timeout
            fillStyle,
            aliasStyle,
            _downLock = false,
            tileGrid, c, ctx;
        hovertiles.style.position = 'absolute';
        hovertiles.style.left = '0px';
        hovertiles.style.top = '0px';
        hovertiles.style.zIndex = 10000020;

        // Search through `.tiles` and determine the position,
        // from the top-left of the **document**, and cache that data
        // so that `mousemove` events don't always recalculate.
        function getTiles() {
            // Get all 'marked' tiles, added by the `wax.g.MapType` layer.
            // Return an array of objects which have the **relative** offset of
            // each tile, with a reference to the tile object in `tile`, since the API
            // returns evt coordinates as relative to the map object.
            if (!tileGrid) {
                tileGrid = [];
                var zoom = map.getZoom();
                var mapOffset = wax.util.offset(map.getDiv());
                var get = wax.util.bind(function(mapType) {
                    if (!mapType.interactive) return;
                    for (var key in mapType.cache) {
                        if (key.split('/')[0] != zoom) continue;
                        var tileOffset = wax.util.offset(mapType.cache[key]);
                        tileGrid.push([
                            tileOffset.top - mapOffset.top,
                            tileOffset.left - mapOffset.left,
                            mapType.cache[key]
                        ]);
                    }
                }, this);
                // Iterate over base mapTypes and overlayMapTypes.
                for (var i in map.mapTypes) get(map.mapTypes[i]);
                map.overlayMapTypes.forEach(get);
            }
            return tileGrid;
        }

        // When the map moves, the tile grid is no longer valid.
        function clearTileGrid(map, e) {
            tileGrid = null;
            _af = null;
            hovertiles.innerHTML = '';
        }

        function getTile(evt) {
            var tile;
            var grid = getTiles();
            for (var i = 0; i < grid.length; i++) {
                if ((grid[i][0] < evt.pixel.y) &&
                    ((grid[i][0] + 256) > evt.pixel.y) &&
                    (grid[i][1] < evt.pixel.x) &&
                    ((grid[i][1] + 256) > evt.pixel.x)) {
                    return grid[i];
                }
            }
            return false;
        }

        function drawFullTiles(key, drawnTile) {
            hovertiles.innerHTML = '';
            for (var i = 0, tiles = getTiles(); i < tiles.length; i++) {
                waxGM.getGrid(tiles[i][2].src, (function(tile) {
                    return function(err, g) {
                        var keyIndex = g.grid_tile().keys.indexOf(key);
                        if (keyIndex !== -1) {
                            var ch = String.fromCharCode(lib.indexToChar(keyIndex));
                            lib.drawTile({
                                tile: tile,
                                ch: ch,
                                grid: g,
                                container: hovertiles,
                                fillStyle: fillStyle
                            });
                        }
                    };
                })(tiles[i][2]));
            }
        }

        function onDown() {
            _downLock = true;
        }

        function onUp() {
            _downLock = false;
        }

        function onMove(e) {
            if (_downLock) return;
            // If the user is actually dragging the map, exit early
            // to avoid performance hits.
            var gt = getTile(e),
                tile = gt[2],
                feature;

            if (tile) {
                waxGM.getGrid(tile.src, function(err, g) {
                    if (err || !g) return;
                    var keyIndex = g.getKey(e.pixel.x - gt[1], e.pixel.y - gt[0]);
                    var key = g.grid_tile().keys[keyIndex];
                    feature = g.gridFeature(e.pixel.x - gt[1], e.pixel.y - gt[0]);
                    if (feature) {
                        var ch = String.fromCharCode(lib.indexToChar(keyIndex));
                        if (ch && _af !== key) {
                            _af = key;
                            hovertiles.innerHTML = '';
                            lib.drawTile({
                                tile: tile,
                                ch: ch,
                                grid: g,
                                container: hovertiles,
                                fillStyle: fillStyle
                            });

                            if (to_fulltiles) window.clearTimeout(to_fulltiles);
                            to_fulltiles = window.setTimeout((function(key) {
                                return function() {
                                    drawFullTiles(key);
                                }
                            })(key), 20);
                        } else {
                            // hovertiles.innerHTML = '';
                        }
                    } else {
                        // no feature
                        _af = null;
                        hovertiles.innerHTML = '';
                    }
                });
            }
        }

        g.fillStyle = function(x) {
            if (!x) return fillStyle;
            fillStyle = x;
        };

        // Attach listeners to the map
        g.add = function() {
            google.maps.event.addListener(map, 'idle', clearTileGrid);
            google.maps.event.addListener(map, 'mousemove', onMove);
            this.fillStyle(options.fillStyle || 'rgba(11,161,207,0.8)');
            return this;
        };

        // Ensure chainability
        return g.add(map);
  }
  lib.g = glower;
})(glower);
