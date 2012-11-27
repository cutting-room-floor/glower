var glower = {
    drawTile: function (o) {
        var c = document.createElement('canvas');
        if (typeof G_vmlCanvasManager !== 'undefined') {
          G_vmlCanvasManager.initElement(c);
        }
        c.style.position = 'absolute';
        c.style.left = o.tile[3].left + 'px';
        c.style.top = o.tile[3].top + 'px';
        c.width = 256;
        c.height = 256;
        var ctx = c.getContext('2d'),
            gt = o.grid.grid_tile();
        ctx.fillStyle = o.fillStyle; // expensive
        for (var x = 0; x < 64; x++) {
            for (var y = 0; y < 64; y++) {
                if (gt.grid[y][x] === o.ch) {
                    var sweep = 1;
                    while (y < 63 && gt.grid[y + 1][x] === o.ch) {
                        y++;
                        sweep++;
                    }
                    ctx.fillRect(x * 4, (y * 4) - ((sweep - 1) * 4), 4, 4 * sweep);
                }
            }
        }
        o.container.appendChild(c);
        o.aliasStyle = o.fillStyle.replace(/([\d\.]+)\)$/, function(m) {
            return (parseFloat(m) / 1.5) + ')';
        });
        // return this.aliasTile(o, ctx).strokeTile(o, ctx, c);
        return this.strokeTile(o, ctx, c);
    },
    // Re-encode a key from an index to a key.
    // This will fail at 34 and 92, control
    // chacters that are invalid input anyway.
    indexToChar: function(key) {
        key += 32;
        if (key >= 34) key++;
        if (key >= 92) key++;
        return key;
    },
    aliasTile: function(o, ctx) {
        var gt = o.grid.grid_tile();
        var ch = o.ch;
        ctx.fillStyle = o.aliasStyle;
        for (var x = 0; x < 64; x++) {
            for (var y = 0; y < 64; y++) {
                if (gt.grid[y][x] === ch) {
                    // http://4x86.com/mm-kev.png

                    // - - +          - - +
                    // - - +    =>    - + +
                    // + + +          + + +
                    if (x !== 0 &&
                        y !== 0 &&
                        gt.grid[y - 1][x - 1] !== ch &&
                        gt.grid[y - 1][x] === ch &&
                        gt.grid[y][x - 1] === ch) {
                        ctx.fillRect((x * 4) - 2, (y * 4) - 2, 2, 2);
                        ctx.fillRect((x * 4) - 1, (y * 4) - 3, 1, 3);
                        ctx.fillRect((x * 4) - 3, (y * 4) - 1, 3, 1);
                    }

                    // + + +          + + +
                    // + - -    =>    + + -
                    // + - -          + - -
                    if (x !== 63 &&
                        y !== 63 &&
                        gt.grid[y + 1][x + 1] !== ch &&
                        gt.grid[y + 1][x] === ch &&
                        gt.grid[y][x + 1] === ch) {
                        ctx.fillRect((x * 4) + 4, (y * 4) + 4, 2, 2);
                        ctx.fillRect((x * 4) + 4, (y * 4) + 4, 1, 3);
                        ctx.fillRect((x * 4) + 4, (y * 4) + 4, 3, 1);
                    }

                    // + - -          + - -
                    // + - -    =>    + + -
                    // + + +          + + +
                    if (x !== 63 &&
                        y !== 0 &&
                        gt.grid[y - 1][x + 1] !== ch &&
                        gt.grid[y - 1][x] === ch &&
                        gt.grid[y][x + 1] === ch) {
                        ctx.fillRect((x * 4) + 4, (y * 4) - 2, 2, 2);
                        ctx.fillRect((x * 4) + 4, (y * 4) - 3, 1, 3);
                        ctx.fillRect((x * 4) + 4, (y * 4) - 1, 3, 1);
                    }

                    // + + +          + + +
                    // - - +    =>    - + +
                    // - - +          - - +
                    if (x !== 0 &&
                        y !== 63 &&
                        gt.grid[y + 1][x - 1] !== ch &&
                        gt.grid[y + 1][x] === ch &&
                        gt.grid[y][x - 1] === ch) {
                        ctx.fillRect((x * 4) - 2, (y * 4) + 4, 2, 2);
                        ctx.fillRect((x * 4) - 1, (y * 4) + 4, 1, 3);
                        ctx.fillRect((x * 4) - 3, (y * 4) + 4, 3, 1);
                    }
                }
            }
        }
        return this;
    },
    strokeTile: function(o, ctx, c) {
        ctx.globalAlpha = 0.7;
        ctx.globalCompositeOperation = 'lighter';
        var a = 1;
        ctx.drawImage(c, -a, -a);
        ctx.drawImage(c, a, a);
        ctx.drawImage(c, 0, -a);
        ctx.drawImage(c, -a, 0);
        ctx.globalAlpha = 1;
        /*
        ctx.fillStyle = o.strokeStyle; // expensive
        for (var x = 0; x < 64; x++) {
            for (var y = 0; y < 64; y++) {
                if (gt.grid[y][x] === o.ch) {
                    var sweep = 1;
                    while (y < 63 && gt.grid[y + 1][x] === o.ch) {
                        y++;
                        sweep++;
                    }
                    ctx.fillRect((x * 4) - 2, ((y * 4) - (sweep - 1) * 4) - 2, 8, (4 * sweep) + 4);
                }
            }
        }
        */
        return this;
    }
};
