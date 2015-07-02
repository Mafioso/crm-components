'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var http = require('http');
var ecstatic = require('ecstatic');
var runSequence = require('run-sequence');
var del = require('del');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var cssnext = require('cssnext');
var cssnano = require('cssnano');
var _ = require('lodash');
var mergeStream = require('merge-stream');

gulp.task('clean', function(callback){
  del([
    '.tmp',
    'dist/*',
    '!dist/.git'
  ], callback);
});

gulp.task('dev:csscompile', function() {
  return gulp.src('src/assets/styles/app.css')
    .pipe($.plumber({errorHandler: function(error) {
      console.log('dev:styles error:\n', error.message);
    }}))
    .pipe($.postcss([
      cssnext({
        browserlist: 'last 3 versions'
      }),
      cssnano({
        autoprefixer: false,
        unused: false
      })
    ]))
    .pipe(gulp.dest('./dist/assets/'))
    .pipe($.size({title: 'dev:csscompile'}));
});

gulp.task('dev:jscompile', function() {
  var libs = ['react', 'lodash'];
  var bundleConfigs = [{
    entries: './src/scripts/App.jsx',
    outputName: 'app.js',
    require: libs
  }];

  var makeBundle = function(config) {
    var b = browserify(config);
    if (config.require) { b.require(config.require); }
    if (config.external) { b.external(config.external); }

    return b
      .bundle()
      .on('error', function(err) {
        console.log('dev:jscompile error:\n', err);
      })
      .pipe(source(config.outputName))
      .pipe(gulp.dest('./dist/assets'));
  };

  return mergeStream.apply(gulp, _.map(bundleConfigs, makeBundle));
});

gulp.task('dev:htmlcopy', function() {
  return gulp.src('src/*.html')
    .pipe($.plumber({errorHandler: function(error) {
      console.log('dev:htmlcopy error:\n', error.message);
    }}))
    .pipe($.useref())
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'dev:htmlcopy'}));
});

gulp.task('dev:imagemin', function() {
  return gulp.src('src/assets/images/**/*.{jpg,png}')
    .pipe($.plumber({errorHandler: function(error) {
      console.log('dev:imagemin error:\n', error.message);
    }}))
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/assets/images'))
    .pipe($.size({title: 'dev:imagemin'}));
});

gulp.task('serve', function() {
  http.createServer(ecstatic({root: 'dist'})).listen(8080);
});

gulp.task('default', function(callback) {
  runSequence('clean', ['dev:csscompile', 'dev:imagemin', 'dev:jscompile', 'dev:htmlcopy'], 'serve', 'watch', callback);
});

gulp.task('watch', function() {
  gulp.watch('src/assets/styles/**/*.css', ['dev:csscompile']);
  gulp.watch('src/scripts/**/*.{js,jsx}', ['dev:jscompile']);
  gulp.watch('src/**/*.html', ['dev:htmlcopy']);
});

gulp.task('build', function() {

});
