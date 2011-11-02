(function(context) {
  function glower(map, tj) {
    tilejson = tj;

    var MM = com.modestmaps,
        waxGM = wax.GridManager(tilejson),
        eventoffset = wax.util.eventoffset,
        addEvent = MM.addEvent,
        removeEvent = MM.removeEvent,
        g = {},
        hovertiles = map.parent.appendChild(document.createElement('div')),
        // Active feature
        _af,
        // Down event
        tileGrid;

    // Search through `.tiles` and determine the position,
    // from the top-left of the **document**, and cache that data
    // so that `mousemove` events don't always recalculate.
    function getTileGrid() {
        // TODO: don't build for tiles outside of viewport
        // Touch interaction leads to intermediate
        var zoomLayer = map.createOrGetLayer(Math.round(map.getZoom()));
        // Calculate a tile grid and cache it, by using the `.tiles`
        // element on this map.
        return tileGrid || (tileGrid =
            (function(t) {
                var o = [];
                for (var key in t) {
                    if (t[key].parentNode === zoomLayer) {
                        var offset = wax.util.offset(t[key]);
                        o.push([offset.top, offset.left, t[key]]);
                    }
                }
                return o;
            })(map.tiles));
    }

    // When the map moves, the tile grid is no longer valid.
    function clearTileGrid(map, e) {
        tileGrid = null;
        hovertiles.innerHTML = '';
    }

    function getTile(e) {
        for (var i = 0, grid = getTileGrid(); i < grid.length; i++) {
            if ((grid[i][0] < e.y) &&
               ((grid[i][0] + 256) > e.y) &&
                (grid[i][1] < e.x) &&
               ((grid[i][1] + 256) > e.x)) return grid[i][2];
        }
        return false;
    }

    // Clear the double-click timeout to prevent double-clicks from
    // triggering popups.
    function killTimeout() {
        if (_clickTimeout) {
            window.clearTimeout(_clickTimeout);
            _clickTimeout = null;
            return true;
        } else {
            return false;
        }
    }

    // Utility functions to deal with key decoding and encoding
    // From Wax. Decode a key into an index.
    var charToIndex = function(key) {
        if (key >= 93) key--;
        if (key >= 35) key--;
        key -= 32;
        return key;
    };

    // Re-encode a key from an index to a key.
    // This will fail at 34 and 92, control
    // characters that are invalid input anyway.
    var indexToChar = function(key) {
        if (key === 34 || key === 92) {
            // console.log('bad key encountered');
        }
        key += 32;
        if (key >= 34) key++;
        if (key >= 92) key++;
        return key;
    };

    function drawTile(tile, char, grid) {
      var c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      c.style.cssText = tile.style.cssText;
      var gt = grid.grid_tile();
      var ctx = c.getContext('2d');
      // ctx.fillRect(0, 0, 256, 256);
      for (var x = 0; x < 64; x++) {
        for (var y = 0; y < 64; y++) {
          if (gt.grid[y][x] === char) {
            ctx.fillStyle = 'rgba(11,161,207,0.8)';
            ctx.fillRect(x * 4, y * 4, 4, 4);

            // http://4x86.com/mm-kev.png
            ctx.fillStyle = 'rgba(11,161,207,0.4)';

            // - - +          - - +
            // - - +    =>    - + +
            // + + +          + + +
            if (x !== 0 &&
                y !== 0 &&
                gt.grid[y - 1][x - 1] !== char &&
                gt.grid[y - 1][x] === char &&
                gt.grid[y][x - 1] === char) {
              ctx.fillRect((x * 4) - 2, (y * 4) - 2, 2, 2);
              ctx.fillRect((x * 4) - 1, (y * 4) - 3, 1, 3);
              ctx.fillRect((x * 4) - 3, (y * 4) - 1, 3, 1);
            }

            // + + +          + + +
            // + - -    =>    + + -
            // + - -          + - -
            if (x !== 63 &&
                y !== 63 &&
                gt.grid[y + 1][x + 1] !== char &&
                gt.grid[y + 1][x] === char &&
                gt.grid[y][x + 1] === char) {
              ctx.fillRect((x * 4) + 4, (y * 4) + 4, 2, 2);

              ctx.fillRect((x * 4) + 4, (y * 4) + 4, 1, 3);
              ctx.fillRect((x * 4) + 4, (y * 4) + 4, 3, 1);
            }

            // + - -          + - -
            // + - -    =>    + + -
            // + + +          + + +
            if (x !== 63 &&
                y !== 0 &&
                gt.grid[y - 1][x + 1] !== char &&
                gt.grid[y - 1][x] === char &&
                gt.grid[y][x + 1] === char) {
              ctx.fillRect((x * 4) + 4, (y * 4) - 2, 2, 2);

              ctx.fillRect((x * 4) + 4, (y * 4) - 3, 1, 3);
              ctx.fillRect((x * 4) + 4, (y * 4) - 1, 3, 1);
            }

            // + + +          + + +
            // - - +    =>    - + +
            // - - +          - - +
            if (x !== 0 &&
                y !== 63 &&
                gt.grid[y + 1][x - 1] !== char &&
                gt.grid[y + 1][x] === char &&
                gt.grid[y][x - 1] === char) {
              ctx.fillRect((x * 4) - 2, (y * 4) + 4, 2, 2);

              ctx.fillRect((x * 4) - 1, (y * 4) + 4, 1, 3);
              ctx.fillRect((x * 4) - 3, (y * 4) + 4, 3, 1);
            }

          }
        }
      }
      hovertiles.appendChild(c);
    }

    function onMove(e) {
        // If the user is actually dragging the map, exit early
        // to avoid performance hits.
        var pos = eventoffset(e),
            tile = getTile(pos),
            feature;

        if (tile) waxGM.getGrid(tile.src, function(err, g) {
            if (err || !g) return;
            var offset = wax.util.offset(tile);
            index = g.getKey(pos.x - offset.left, pos.y - offset.top);
            feature = g.tileFeature(pos.x, pos.y, tile, {
                format: 'teaser'
            });
            if (feature) {
                var char = String.fromCharCode(indexToChar(index));
                if (char && _af !== char) {
                    _af = feature;
                    hovertiles.innerHTML = '';
                    drawTile(tile, char, g);
                    // new feature
                } else if (!char) {
                    _af = null;
                    hovertiles.innerHTML = '';
                    // no feature
                }
                // same feature
            } else {
                _af = null;
                hovertiles.innerHTML = '';
                // no feature
            }
        });
    }

    // Attach listeners to the map
    g.add = function() {
        var l = ['zoomed', 'panned', 'centered',
            'extentset', 'resized', 'drawn'];
        for (var i = 0; i < l.length; i++) {
            map.addCallback(l[i], clearTileGrid);
        }
        addEvent(map.parent, 'mousemove', onMove);
        return this;
    };

    // Ensure chainability
    return g.add(map);
  }
  context.glower = glower;
})(this);
