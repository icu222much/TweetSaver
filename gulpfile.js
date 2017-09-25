'use strict';

const gulp = require('gulp');
const connect = require('gulp-connect'); // run local dev server
const open = require('gulp-open'); // open url in browser
const source = require('vinyl-source-stream'); // conventional text gulp streams
const concat = require('gulp-concat'); // concat files
const lint = require('gulp-eslint'); // lint js files including jsx
const less = require('gulp-less'); // css pre processor
const path = require('path'); // joining paths
const babel = require('gulp-babel'); // syntax transformer for ES2015+

const config = {
    port: 9005,
    devBaseUrl: 'http://localhost',
    paths: {
        html: './src/*.html',
        js: './src/**/*.js',
        images: './src/images/**/*',
        css: [
            'node_modules/normalize.css/normalize.css'
        ],
        less: [
            './src/*.less',
            './src/**/*.less'
        ],
        dist: './dist',
        js: [
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/jquery-ui-dist/jquery-ui.min.js',
            'node_modules/jquery-ui-touch-punch/jquery.ui.touch-punch.min.js',
            './src/**/*.js'
        ]
    }
};

// start local dev
gulp.task('connect', function() {
    connect.server({
        root: ['dist'],
        port: config.port,
        base: config.devBaseUrl,
        livereload: true
    });
});

gulp.task('open', ['connect'], function() {
    gulp.src('dist/index.html')
        .pipe(open({uri: config.devBaseUrl + ':' + config.port + '/'}));
});

gulp.task('html', function() {
    gulp.src(config.paths.html)
        .pipe(gulp.dest(config.paths.dist))
        .pipe(connect.reload());
});

gulp.task('js', function() {
    gulp.src(config.paths.js)
        .pipe(concat('bundle.js'))
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(gulp.dest(config.paths.dist + '/scripts'))
        .pipe(connect.reload());
});

gulp.task('css', function() {
    gulp.src(config.paths.css)
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest(config.paths.dist + '/css'))
        .pipe(connect.reload());
});

gulp.task('less', function () {
    gulp.src(config.paths.less)
        .pipe(less({
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(concat('less.css'))
        .pipe(gulp.dest(config.paths.dist + '/css'));
});

gulp.task('images', function() {
    gulp.src(config.paths.images)
        .pipe(gulp.dest(config.paths.dist + '/images'))
        .pipe(connect.reload());
});

gulp.task('watch', function() {
    gulp.watch(config.paths.html, ['html']);
    gulp.watch(config.paths.js, ['js']);
    gulp.watch(config.paths.css, ['css']);
    gulp.watch(config.paths.less, ['less']);
    gulp.watch(config.paths.images, ['images']);
});

gulp.task('default', ['html', 'js', 'css', 'less', 'images', 'open', 'watch']);