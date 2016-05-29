var gulp = require('gulp');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var browserify = require('gulp-browserify');
var webserver = require('gulp-webserver');
var _ = require('lodash');

var api;

gulp.task('copy-resources', function() {
  return gulp
    .src([ 'src/main/**/*', '!**/*.js' ])
    .pipe(plumber({ errorHandler: err => { console.log(err.message); this.emit('end'); } }))
    .pipe(gulp.dest('target'));
});

function getBowerPackageIds() {
  var bowerManifest = {};
  try {
    manifest = require('./bower.json');
  } catch (e) {
    // does not have a bower.json manifest
  }
  return _.keys(manifest.dependencies) || [];
}

function getBowerMains(module) {
  function makeMinFileName(file) {
    return './bower_components/' + module + '/' + file.substr(0, file.indexOf('.js')) + '.min.js';
  }

  var manifest = require('./bower_components/' + module + '/bower.json');
  if (typeof manifest.main === 'string') 
    return [ makeMinFileName(manifest.main) ]
  else
    return _.map(manifest.main, makeMinFileName);
}

gulp.task('compile-vendor', function() {
  var modules = _.flatten(_.map(getBowerPackageIds(), getBowerMains));

  return gulp
    .src(modules)
    .pipe(plumber({ errorHandler: err => { console.log(err.message); this.emit('end'); } }))
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('target'));
});

function getBowerModule(module) {
  function extractFileWithoutExt(file) {
    var parts = file.split('/');
    file = parts[parts.length - 1];
    return file.substr(0, file.indexOf('.'));
  }

  var manifest = require('./bower_components/' + module + '/bower.json');
  if (typeof manifest.main === 'string')
    return [ extractFileWithoutExt(manifest.main) ];
  else
    return _.map(manifest.main, extractFileWithoutExt);
}

gulp.task('compile', [ 'copy-resources', 'compile-vendor' ], function() {
  var externals = _.flatten(_.map(getBowerPackageIds(), getBowerModule));
  return gulp
    .src('src/main/index.js')
    .pipe(plumber({ errorHandler: err => { console.log(err.message); this.emit('end'); } }))
    .pipe(browserify({ transform: [ 'babelify' ], external: externals }))
    .pipe(gulp.dest('target'));
});

gulp.task('stop-backend', function(done) {
  if (api && api.listening) api.close(done);
  else done();
});

gulp.task('start-backend', [ 'stop-backend' ], function(done) {
  delete require.cache[require.resolve('./src/backend/api')];
  api = require('./src/backend/api');
  api.listen(3000, done);
});

gulp.task('watch', [ 'compile' ], function() {
  gulp.watch([ 'src/main/**/*', '!**/*.js' ], [ 'copy-resources' ]);
  gulp.watch('src/main/**/*.js', [ 'compile' ]);
  gulp.watch('src/backend/**/*.js', [ 'start-backend' ]);
});

gulp.task('server', [ 'watch', 'start-backend' ], function() {
  gulp
    .src('target')
    .pipe(plumber({ errorHandler: err => { console.log(err.message); this.emit('end'); } }))
    .pipe(webserver({
      port      : 8000,
      livereload: true,
      proxies   : [{
        // proxy the requests under /api to localhost:3000/api
        source: '/api', target: 'http://localhost:3000/api'
      }]
    }));
});

gulp.task('default', [ 'compile' ]);
