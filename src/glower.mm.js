if (!glower) throw new Error('glower base library required');

(function(lib) {
    function glower(map, tj, options) {

        options = options || {};

        var MM = com.modestmaps,
            waxGM = wax.GridManager(tj),
            eventoffset = wax.util.eventoffset,
            addEvent = MM.addEvent,
            removeEvent = MM.removeEvent,
            g = {},
            hovertiles = map.parent.appendChild(document.createElement('div')),
            _af, // active feature
            to_antialias, // anti-alias timeout
            to_fulltiles, // anti-alias timeout
            _cssText,
            fillStyle,
            aliasStyle,
            _downLock = false,
            tileGrid, c, ctx;

        hovertiles.style.cssText = 'position:absolute;top:0;left:0;';

        function getTileGrid() {
            var zoomLayer = map.createOrGetLayer(Math.round(map.getZoom()));
            var mo = wax.util.offset(map.parent);
            return tileGrid || (tileGrid =
                (function(t) {
                    var o = [];
                    for (var key in t) {
                        if (t[key].parentNode === zoomLayer) {
                            var offset = wax.util.offset(t[key]);
                            var mapoffset = {
                                left: offset.left - mo.left,
                                top: offset.top - mo.top
                            };
                            o.push([offset.top, offset.left, t[key], mapoffset]);
                        }
                    }
                    return o;
                })(map.tiles));
        }

        // When the map moves, the tile grid is no longer valid.
        function clearTileGrid(map, e) {
            tileGrid = null;
            _af = null;
            hovertiles.innerHTML = '';
        }

        function getTile(e) {
            for (var i = 0, grid = getTileGrid(); i < grid.length; i++) {
                if ((grid[i][0] < e.y) &&
                   ((grid[i][0] + 256) > e.y) &&
                    (grid[i][1] < e.x) &&
                   ((grid[i][1] + 256) > e.x)) {
                    return grid[i];
                }
            }
            return false;
        }

        function drawFullTiles(key, drawnTile) {
            hovertiles.innerHTML = '';
            for (var i = 0, tiles = getTileGrid(); i < tiles.length; i++) {
                waxGM.getGrid(tiles[i][2].src, (function(tile) {
                    return function(err, g) {
                        if (err || !g.grid_tile()) return;
                        var keyIndex = wax.util.indexOf(g.grid_tile().keys, key);
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
                })(tiles[i]));
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
            var pos = eventoffset(e),
                gt = getTile(pos),
                tile = gt[2],
                feature;

            if (tile) {
                waxGM.getGrid(tile.src, function(err, g) {
                    if (err || !g) return;
                    var keyIndex = g.getKey(pos.x - gt[1], pos.y - gt[0]);
                    var key = g.grid_tile().keys[keyIndex];
                    feature = g.gridFeature(pos.x - gt[1], pos.y - gt[0]);
                    if (feature) {
                        var ch = String.fromCharCode(lib.indexToChar(keyIndex));
                        if (ch && _af !== key) {
                            _af = key;
                            hovertiles.innerHTML = '';
                            lib.drawTile({
                                tile: gt,
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
            var l = ['zoomed', 'panned', 'centered',
                'extentset', 'resized', 'drawn'];
            for (var i = 0; i < l.length; i++) {
                map.addCallback(l[i], clearTileGrid);
            }
            addEvent(map.parent, 'mousemove', onMove);
            addEvent(map.parent, 'mousedown', onDown);
            addEvent(map.parent, 'mouseup', onUp);

            this.fillStyle(options.fillStyle || 'rgba(11,161,207,0.8)');
            return this;
        };

        // Ensure chainability
        return g.add(map);
  }
  lib.mm = glower;
})(glower);
