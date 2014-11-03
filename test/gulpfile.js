var gulp = require('gulp'),
	svgmin = require('gulp-svgmin'),
	svgsprite = require('../index');

gulp.task('default', function () {
	gulp.src('icons/*.svg')
    .pipe(svgsprite({
    	cssPathNoSvg: './test.png',
    	demoDest: './demo.html',
    	padding: 0,
    	positioning: 'packed',
    	units: 'em'
    }))
    .pipe(svgmin())
    .pipe(gulp.dest('test.svg'));
})