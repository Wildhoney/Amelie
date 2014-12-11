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
        watch  = require('gulp-watch');

    gulp.task('build', function gulpBuild() {

        gulp.src(config.components)
            .pipe(rename(config.build.development))
            .pipe(gulp.dest(config.build.directory))
            .pipe(gulp.dest(config.build.copy))
            .pipe(rename(config.build.production))
            //.pipe(uglify())
            .pipe(gulp.dest(config.build.directory));

    });

    gulp.task('hint', function gulpHint() {

        return gulp.src(config.components)
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('default'));

    });

    gulp.task('test', ['hint']);
    gulp.task('default', ['test', 'build']);
    gulp.task('watch', function watch() {
        gulp.watch(config.components, ['build']);
    });

})();