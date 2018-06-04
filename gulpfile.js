var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var path = require('path');
var http = require('http');
var st = require('st');

function highlight(str) {
  return str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<strong>$1</strong>');
}

// Jade to html
gulp.task('jade', function() {
  var resume_data = require('./resume.json');
  var locals = require('./i18n/' + resume_data.data_lang
                        + '/dict.js');
  for (var item in resume_data) {
    locals[item] = resume_data[item];
  }

  locals.highlight = highlight;

  return gulp.src('./src/jade/index.jade')
    .pipe(plugins.jade({
      locals: locals
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(plugins.livereload());
});

// less to css
gulp.task('less', function() {
  gulp.src('./src/less/index.less')
    .pipe(plugins.less({
      paths: [path.join(__dirname, 'src', 'less', 'includes'),
              path.join(__dirname, 'src', 'less', 'components')]
    }))
    .pipe(plugins.minifyCss({compatibility: 'ie9'}))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('less-debug', function() {
  gulp.src('./src/less/index.less')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.less({
      paths: [path.join(__dirname, 'src', 'less', 'includes'),
              path.join(__dirname, 'src', 'less', 'components')]
    }))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest('./dist/'))
    .pipe(plugins.livereload());
});

// Static assets
gulp.task('static', function() {
  return gulp.src('./static/**/*', {
      base: 'static'
    })
    .pipe(gulp.dest('./dist/static/'))
    .pipe(plugins.livereload());
});


gulp.task('watch', ['server'], function() {
  plugins.livereload.listen({
    basePath: 'dist'
  });
  gulp.watch(['./src/**/*.jade', './resume.json', './ch_locals.js'], ['jade']);
  gulp.watch('./src/**/*.less', ['less']);
  gulp.watch('./resume.json', ['jade']);
});

gulp.task('build', ['jade', 'less-debug', 'static']);
gulp.task('build-for-deploy', ['jade', 'less', 'static']);

function server(done) {
  http.createServer(
    st({ path: __dirname + '/dist', index: 'index.html', cache: false })
  ).listen(8000, done);
  console.log("preview listening on http://localhost:8000");
}

gulp.task('server', ['build'], server);

gulp.task('preview', ['build-for-deploy'], server);

gulp.task('deploy', ['build-for-deploy'], function() {
  return gulp.src('./dist/**/*')
    .pipe(plugins.ghPages());
});

gulp.task('default', ['server', 'watch']);
