(function() {

    var yaml   = require('js-yaml'),
        fs     = require('fs');

    /**
     * @property {Object} config
     * @property {String} config.components
     */
    var config = yaml.safeLoad(fs.readFileSync('amelie.yml', 'utf8'));

    var gulp   = require('gulp'),
        uglify = require('gulp-uglify'),
        rename = require('gulp-rename'),
        jshint = require('gulp-jshint'),
        watch  = require('gulp-watch'),
        concat = require('gulp-concat'),
        jsx    = require('gulp-jsx'),
        cssmin = require('gulp-cssmin');

    gulp.task('scripts', function gulpBuild() {

        gulp.src(config.components)
            .pipe(rename(config.build.development))
            .pipe(gulp.dest(config.build.copy))
            .pipe(jsx())
            .pipe(rename(config.build.production.unminified))
            .pipe(gulp.dest('dist'))
            .pipe(uglify())
            .pipe(rename(config.build.production.minified))
            .pipe(gulp.dest('dist'));

    });

    gulp.task('styles', function() {

        gulp.src('module/*.css')
            .pipe(concat('amelie.css'))
            .pipe(gulp.dest(config.build.directory))
            .pipe(gulp.dest(config.build.copy))
            .pipe(cssmin())
            .pipe(rename({suffix: '.min'}))
            .pipe(gulp.dest(config.build.directory))

    });

    gulp.task('hint', function gulpHint() {

        return gulp.src(config.components)
            .pipe(jsx())
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('default'));

    });

    gulp.task('test', ['hint']);
    gulp.task('build', ['styles', 'scripts']);
    gulp.task('default', ['test', 'build']);
    gulp.task('watch', function watch() {
        gulp.watch('module/*', ['build']);
    });

})();