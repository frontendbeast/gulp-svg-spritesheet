'use strict';

var cheerio = require('cheerio'),
    events = require('events'),
    fs = require('fs'),
    gutil = require('gulp-util'),
    mkdirp = require('mkdirp'),
    mustache = require('mustache'),
    packetr = require('./lib/packer.growing'),
    path = require('path'),
    through2 = require('through2');

// Consts
var PLUGIN_NAME = 'gulp-svg-spritesheet';

// Options
var defaults = {
    cssPathNoSvg: '', // Leave blank if you dont want to specify a fallback
    cssPathSvg: './test.svg', // CSS path to generated SVG
    demoDest: '', // Leave blank if you don't want a demo file
    demoSrc: '../demo.tpl', // The souce or the demo template
    padding: 0, // Add some padding between sprites
    pixelBase: 16, // Used to calculate em/rem values
    positioning: 'vertical', // vertical, horizontal, diagonal or packed
    templateSrc: '../template.tpl', // The source of the CSS template
    templateDest: './sprite.scss',
    units: 'px', // px, em or rem
    x: 0, // Starting X position
    y: 0 // Starting Y position
};

// Sorting functions from Jake Gordon's bin packing algorithm demo
// https://github.com/jakesgordon/bin-packing
var sort = {
    w       : function (a,b) { return b.w - a.w; },
    h       : function (a,b) { return b.h - a.h; },
    max     : function (a,b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h); },
    min     : function (a,b) { return Math.min(b.w, b.h) - Math.min(a.w, a.h); },


    height  : function (a,b) { return sort.msort(a, b, ['h', 'w']);               },
    width   : function (a,b) { return sort.msort(a, b, ['w', 'h']);               },
    maxside : function (a,b) { return sort.msort(a, b, ['max', 'min', 'h', 'w']); },

    msort: function(a, b, criteria) {
      var diff, n;
      for (n = 0 ; n < criteria.length ; n++) {
        diff = sort[criteria[n]](a,b);
        if (diff !== 0)
          return diff;
      }
      return 0;
    }
};


// This is where the magic happens
var spriteSVG = function(options) {

    options = options || {};

    // Extend our defaults with any passed options
    for (var key in defaults) {
        options[key] = options[key] || defaults[key];
    }

    // Create one SVG to rule them all, our sprite sheet
    var $ = cheerio.load('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"/>', { xmlMode: true }),
        $sprite = $('svg'),
        // This data will be passed to our template
        data = {
            cssPathSvg: options.cssPathSvg,
            height: 0,
            sprites: [],
            units: options.units,
            width: 0
        },
        eventEmitter = new events.EventEmitter(),
        self,
        x = options.x,
        y = options.y;

    // When a template file is loaded, render it
    eventEmitter.on("loadedTemplate", renderTemplate);

    // Generate relative em/rem untis from pixels
    function pxToRelative(value) {
        return value / options.pixelBase;
    }

    // Load a template file and then render it
    function loadTemplate(src, dest) {
        fs.readFile(src, function(err, contents) {
            if(err) {
                new gutil.PluginError(PLUGIN_NAME, err);
            }

            var file = {
                contents: contents.toString(),
                data: data,
                dest: dest
            };

            eventEmitter.emit("loadedTemplate", file);
        });
    }

    // Position sprites using Jake Gordon's bin packing algorithm
    // https://github.com/jakesgordon/bin-packing
    function packSprites(cb) {
        var packer = new GrowingPacker();

        // Get coordinates of sprites
        packer.fit(data.sprites);

        // For each sprite
        for (var i in data.sprites) {
            var sprite = data.sprites[i],
                // Create, initialise and populate an SVG
                $svg = $('<svg/>')
                    .attr({
                        'height': sprite.h,
                        'viewBox': sprite.viewBox,
                        'width': sprite.w,
                        'x': Math.ceil(sprite.fit.x)+options.padding,
                        'y': Math.ceil(sprite.fit.y)+options.padding
                    })
                    .append(sprite.file);

            // Check and set parent SVG width
            if(sprite.fit.x+sprite.w+options.padding>data.width) {
                data.width = Math.ceil(sprite.fit.x+sprite.w+options.padding);
            }

            // Check and set sprite sheet height
            if(sprite.fit.y+sprite.h+options.padding>data.height) {
                data.height = Math.ceil(sprite.fit.y+sprite.h+options.padding);
            }

            // Round up coordinates and add padding
            sprite.h = Math.ceil(sprite.h);
            sprite.w = Math.ceil(sprite.w);
            sprite.x = -Math.abs(Math.ceil(sprite.fit.x))-options.padding;
            sprite.y = -Math.abs(Math.ceil(sprite.fit.y))-options.padding;

            // Convert to relative units if required
            if(options.units!=='px') {
                sprite.h = pxToRelative(sprite.h);
                sprite.w = pxToRelative(sprite.w);
                sprite.x = pxToRelative(sprite.x);
                sprite.y = pxToRelative(sprite.y);
            }

            // Add the SVG to the sprite sheet
            $sprite.append($svg);

        }

        // Save the sprite sheet
        saveSpriteSheet(cb);
    }

    function positionSprites(cb) {
        // For each sprite
        for (var i in data.sprites) {

            var sprite = data.sprites[i];

            // Add padding
            sprite.x = x+options.padding;
            sprite.y = y+options.padding;

            // Create, initialise and populate an SVG
            var $svg = $('<svg/>')
                    .attr({
                        'height': sprite.h,
                        'viewBox': sprite.viewBox,
                        'width': sprite.w,
                        'x': Math.ceil(sprite.x),
                        'y': Math.ceil(sprite.y)
                    })
                    .append(sprite.file);

            // Round up coordinates
            sprite.h = Math.ceil(sprite.h);
            sprite.w = Math.ceil(sprite.w);
            sprite.x = -Math.abs(Math.ceil(sprite.x));
            sprite.y = -Math.abs(Math.ceil(sprite.y));

            // Increment x/y coordinates and set sprite sheet height/width
            if(options.positioning==='horizontal' || options.positioning==='diagonal') {
                x+=sprite.w+options.padding;
                data.width+=sprite.w+options.padding;

                if(options.positioning!=='diagonal' && data.height<sprite.h+options.padding) {
                    data.height = sprite.h+options.padding;
                }
            }

            if(options.positioning==='vertical' || options.positioning==='diagonal') {
                y+=sprite.h+options.padding;
                data.height+=sprite.h+options.padding;

                if(options.positioning!=='diagonal' && data.width<sprite.w+options.padding) {
                    data.width = sprite.w+options.padding;
                }
            }

            // Convert to relative units if required
            if(options.units!=='px') {
                sprite.h = pxToRelative(sprite.h);
                sprite.w = pxToRelative(sprite.w);
                sprite.x = pxToRelative(sprite.x);
                sprite.y = pxToRelative(sprite.y);
            }

            // Add the SVG to the sprite sheet
            $sprite.append($svg);

        }

        // Save the sprite sheet
        saveSpriteSheet(cb);
    }

    function processSVG(file, encoding, cb) {
        // Ignore empty files
        if (file.isNull()) {
            return;
        }

        // We don't do streaming
        if (file.isStream()) {
            return cb(new gutil.PluginError(PLUGIN_NAME, 'Streams are not supported'));
        }
            // We're using the filename as the CSS class name
        var filename = path.basename(file.relative, path.extname(file.relative)),
            // Load the file contents
            $file = cheerio.load(file.contents.toString('utf8'), {xmlMode: true})('svg'),
            viewBox = $file.attr('viewBox'),
            coords = viewBox.split(" "),
            width = $file.attr('width') || coords[2],
            height = $file.attr('height') || coords[3];

        // Set sprite data to be used by the positioning function
        var sprite = {
                fileName: filename,
                file: $file.contents(),
                h: parseFloat(height),
                padding: options.padding,
                // Round up coordinates to avoid chopping off edges
                viewBox: Math.ceil(coords[0])+" "+Math.ceil(coords[1])+" "+Math.ceil(coords[2])+" "+Math.ceil(coords[3]),
                w: parseFloat(width)
            };

        // Add the sprite to our array
        data.sprites.push(sprite);

        // Move on to processSprites()
        cb();
    }

    function processSprites(cb) {
        // Save this for referencing in positioning functions
        self = this;
        // Sort the sprites so the biggest are first to avoid this issue:
        // https://github.com/jakesgordon/bin-packing/blob/master/js/packer.growing.js#L10
        data.sprites.sort(sort.maxside);

        // Lay out the sprites
        if(options.positioning==='packed') {
            packSprites(cb);
        } else {
            positionSprites(cb);
        }
    }

    // Render our template and then save the file
    function renderTemplate(file) {
        var compiled = mustache.render(file.contents, file.data);
        mkdirp(path.dirname(file.dest), function(){
            fs.writeFile(file.dest, compiled);
        });
    }

    // Final processing of sprite sheet then we return file to gulp pipe
    function saveSpriteSheet(cb) {
        // Add padding to even edges up
        data.height+=options.padding;
        data.width+=options.padding;

        // If there is a non-svg fallback send the path to the template
        if(options.cssPathNoSvg) {
            data.cssPathNoSvg = options.cssPathNoSvg;
        }

        // Set the sprite sheet width, height and viewbox
        $sprite.attr({
            'height': data.height,
            'viewBox': '0 0 '+data.width+' '+data.height,
            'width': data.width
        });

        // Convert to relative units if required
        if(options.units!=='px') {
            data.height = pxToRelative(data.height);
            data.width = pxToRelative(data.width);
        }

        // Save our CSS template file
        loadTemplate(options.templateSrc, options.templateDest);

        // If a demo file is required, save that too
        if(options.demoDest) {
            loadTemplate(options.demoSrc, options.demoDest);
        }

        // Create a file to pipe back to gulp
        var file = new gutil.File({path: './', contents: new Buffer($.xml())});

        // Pipe it baby!
        self.push(file);

        // Aaand we're done
        cb();
    }

    return through2.obj(processSVG, processSprites);
};

module.exports = spriteSVG;
