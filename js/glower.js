(function(context) {
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
        tileGrid, c, ctx;

    function getTileGrid() {
        var zoomLayer = map.createOrGetLayer(Math.round(map.getZoom()));
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

    // Re-encode a key from an index to a key.
    // This will fail at 34 and 92, control
    // characters that are invalid input anyway.
    function indexToChar(key) {
        if (key === 34 || key === 92) {
            // console.log('bad key encountered');
        }
        key += 32;
        if (key >= 34) key++;
        if (key >= 92) key++;
        return key;
    }

    function drawFullTiles(key, drawnTile) {
        hovertiles.innerHTML = '';
        for (var i = 0, tiles = getTileGrid(); i < tiles.length; i++) {
            waxGM.getGrid(tiles[i][2].src, (function(tile) {
                return function(err, g) {
                    var keyIndex = g.grid_tile().keys.indexOf(key);
                    if (keyIndex !== -1) {
                        var char = String.fromCharCode(indexToChar(keyIndex));
                        drawTile(tile, char, g, true);
                    }
                };
            })(tiles[i][2]));
        }
    }

    function drawTile(tile, char, grid) {
        var c = document.createElement('canvas');
        c.style.cssText = tile.style.cssText; // expensive
        c.width = 256;
        c.height = 256;
        var ctx = c.getContext('2d');
        var gt = grid.grid_tile();
        ctx.fillStyle = fillStyle; // expensive
        for (var x = 0; x < 64; x++) {
            for (var y = 0; y < 64; y++) {
                if (gt.grid[y][x] === char) {
                    var sweep = 1;
                    while (y < 63 && gt.grid[y + 1][x] === char) {
                        y++;
                        sweep++;
                    }
                    ctx.fillRect(x * 4, (y * 4) - ((sweep - 1) * 4), 4, 4 * sweep);
                }
            }
        }
        hovertiles.appendChild(c);
        aliasTile(char, grid, ctx);
    }

    function aliasTile(char, grid, ctx) {
        var gt = grid.grid_tile();
        ctx.fillStyle = aliasStyle;
        for (var x = 0; x < 64; x++) {
            for (var y = 0; y < 64; y++) {
                if (gt.grid[y][x] === char) {
                    // http://4x86.com/mm-kev.png

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
    }

    function onMove(e) {
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
                    var char = String.fromCharCode(indexToChar(keyIndex));
                    if (char && _af !== key) {
                        _af = key;
                        hovertiles.innerHTML = '';
                        drawTile(tile, char, g);

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
        aliasStyle = x.replace(/([\d\.]+)\)$/, function(m) {
            return (parseFloat(m) / 1.5) + ')';
        });
    };

    // Attach listeners to the map
    g.add = function() {
        var l = ['zoomed', 'panned', 'centered',
            'extentset', 'resized', 'drawn'];
        for (var i = 0; i < l.length; i++) {
            map.addCallback(l[i], clearTileGrid);
        }
        addEvent(map.parent, 'mousemove', onMove);

        this.fillStyle(options.fillStyle || 'rgba(11,161,207,0.8)');
        return this;
    };

    // Ensure chainability
    return g.add(map);
  }
  context.glower = glower;
})(this);
