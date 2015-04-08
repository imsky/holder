var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglifyjs');
var header = require('gulp-header');
var jshint = require('gulp-jshint');
var todo = require('gulp-todo');
var gulputil = require('gulp-util');
var replace = require('gulp-replace');
var webpack = require('gulp-webpack');
var beautify = require('gulp-jsbeautifier');

var moment = require('moment');
var pkg = require('./package.json');

var banner =
	'/*!\n\n' +
	'<%= pkg.officialName %> - <%= pkg.summary %>\nVersion <%= pkg.version %>+<%= build %>\n' +
	'\u00A9 <%= year %> <%= pkg.author.name %> - <%= pkg.author.url %>\n\n' +
	'Site:     <%= pkg.homepage %>\n'+
	'Issues:   <%= pkg.bugs.url %>\n' +
	'License:  <%= pkg.license.url %>\n\n' +
	'*/\n';

function generateBuild(){
	var date = new Date;
	return Math.floor((date - (new Date(date.getFullYear(),0,0)))/1000).toString(36)
}

var build = generateBuild();

gulp.task('jshint', ['beautify'], function () {
	return gulp.src('src/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

gulp.task('todo', function(){
	return gulp.src('src/holder.js')
		.pipe(todo())
		.pipe(gulp.dest('./'));
});

gulp.task('build', ['jshint'], function () {
	return gulp.src('src/holder.js')
		.pipe(webpack({
			output: {
				library: 'Holder',
				filename: 'holder.js',
				libraryTarget: 'umd'
			}
		}))
		.pipe(gulp.dest('./'));
});

gulp.task('bundle', ['build'], function () {
	return gulp.src(['src/polyfills.js', 'holder.js'])
		.pipe(concat('holder.js'))
		.pipe(gulp.dest('./'));
		
});

gulp.task('minify', ['bundle'], function () {
	return gulp.src("holder.js")
		.pipe(uglify("holder.min.js"))
		.pipe(gulp.dest("./"));
});

gulp.task('banner', ['minify'], function () {
	return gulp.src(["holder*.js"])
                .pipe(replace('%version%', pkg.version))
		.pipe(header(banner, {
			pkg: pkg,
			year: moment().format("YYYY"),
			build: build
		}))
		.pipe(gulp.dest("./"));
});

gulp.task('beautify', function () {
	return gulp.src(['src/*.js'])
		.pipe(beautify())
		.pipe(gulp.dest('src/'));
});

gulp.task('watch', function(){
	gulp.watch('src/*.js', ['default']);
});

gulp.task('default', ['todo', 'bundle', 'minify', 'banner'], function(){
	gulputil.log("Finished build "+build);
	build = generateBuild();
});
