#gulp-svg-spritesheet
A [gulp.js](http://gulpjs.com/) plugin to generate an SVG sprite sheet. 

Unlike other node SVG plugins, this does not require Windows users to install Python or Visual Studio C++. 

All output is done using [mustache](http://mustache.github.io/) templates, and as such can be customised to work for Sass, Less, CSS or whatever you like. 

##Install
```
$ npm install --save-dev iamdarrenhall/gulp-svg-sprite
```

##Basic usage
In it's simplest form, all you need to define is the source mustache formatted template file and the destination for the rendered file, plus the path to the sprite relative to the destination. 
```
gulp.task('default', function () {
    gulp.src('svgs/*.svg')
    .pipe(svgspritesheet({
        cssPathSvg: 'images/sprite.svg'
        templateSrc: 'sass.tpl',
        templateDest: 'sass/sprite.scss'
    }))
    .pipe(gulp.dest('images/sprite.svg'));
});
```

##Complex usage
You can also specify a no-SVG fallback image path, add padding, use relative units and specify positioning layout. You can also chain in other gulp plugins.
```
gulp.task('default', function () {
    gulp.src('svgs/*.svg')
    .pipe(svgspritesheet({
        cssPathNoSvg: 'images/sprite.png'
        cssPathSvg: 'images/sprite.svg'
        padding: 10,
        pixelBase: 16,
        positioning: 'diagonal',
        templateSrc: 'sass.tpl',
        templateDest: 'sass/sprite.scss',
        units: 'em'
    }))
    .pipe(svgmin())
    .pipe(gulp.dest('images/sprite.svg'))
    .pipe(svg2png())
    .pipe(gulp.dest('images/sprite.png'));
});
```

##Options

####cssPathNoSvg

Type: `string` 
Default: `<empty>` 

Optional. CSS `background-image` path for the non-SVG fallback image, which will be output in the `templateDest` file. The path should be relative to that final destination file. The mustache template can ignore an empty value. To generate a fallback image you must use a plugin of your choice (e.g. gulp-svg2png) and pipe in the SVG as per the complex example above.

####cssPathSvg

Type: `string` 
Default: `./test.svg` 

CSS `background-image` path which will be used in the `templateDest` file. The path should be relative to that final destination file.

####demoDest
Type: `string` 
Default: `<empty>` 

Optional. A demo file can be created showing all of the SVGs within the spritesheet. A sample is provided in the `test` folder and can be customised however you like. If you do not require a demo file then leave this option empty.

####demoSrc
Type: `string` 
Default: `../demo.tpl` 

Optional. The source mustache template file used to create the `demoDest` file. Only used when `demoDest` is not empty.

####padding
Type: `integer` 
Default: `0` 

Add padding around the individual sprites. Value is pixel based.

####pixelBase
Type: `integer` 
Default: `16` 

Optional. Used if anything other than `px` is specified in `units` to calculate relative units. 

####positioning
Type: `integer` 
Default: `vertical` 

Allows icons to be layed out in one of several ways:

 * `vertical` – stacked one on top of another
 * `horizontal` – placed side by side
 * `diagonal` – cascading from top left to bottom right
 * `packed` – like Compass' smart layout option

####templateDest
Type: `string` 
Default: `./sprite.scss` 

The destination of the sprite sheet CSS generated from `templateSrc`. 

####templateSrc
Type: `string` 
Default: `./template.tpl` 

A mustache template file used to output the sprite sheet CSS.

####units
Type: `string` 
Default: `px` 

CSS background size and position units of measurement. If a value other than `px` is specified (`em` or `rem`) then pixel values will be converted to relative units using `pixelBase`.

####x
Type: `integer` 
Default: `0` 

Offset the starting X position on the sprite sheet.

####y
Type: `integer` 
Default: `0` 

Offset the starting X position on the sprite sheet.

##Disclaimer
This is my first gulp plugin, so it might be complete rubbish. It's very alpha right now, and as such may not work. If you spot any bugs, or areas for improvement then feel free to go fork yourself and send me a pull request!

##Thanks
@shakyShane and his [gulp-svg-sprites](https://github.com/shakyShane/gulp-svg-sprites) plugin, which I was using before I need it to run without a Python dependancy.

@FWeinb and his [grunt-svgstore](https://github.com/FWeinb/grunt-svgstore) plugin, which I took inspiration from in using [Cheerio](https://github.com/cheeriojs/cheerio). 

@jakesgordon and his [bin-packing](https://github.com/jakesgordon/bin-packing) algorithm, which is used when `positioning` is set to `packed`. 

[Code Computerlove](http://www.codecomputerlove.com/), the agency for whom I created this plugin, for allowing me to open source it. 
