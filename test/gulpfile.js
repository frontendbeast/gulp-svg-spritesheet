var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    svgmin = require('gulp-svgmin'),
    svgspritesheet = require('../index');

gulp.task('default', function () {
    gulp.src('svgs/*.svg')
    .pipe(svgspritesheet({
        cssPathNoSvg: './test.png',
        demoDest: './demo.html',
        padding: 0,
        positioning: 'packed',
        units: 'em'
    }))
    .pipe(svgmin())
    .pipe(gulp.dest('test.svg'));
});

gulp.task('jshint', function() {
    gulp.src('../index.js')
        .pipe(jshint({
            'node': true
        }))
        .pipe(jshint.reporter('default'));
});