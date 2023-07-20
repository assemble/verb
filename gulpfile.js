'use strict';

const gulp = require('gulp');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const eslint = require('gulp-eslint');
const unused = require('gulp-unused');

const lib = ['index.js', 'lib/**/*.js', 'bin/*.js'];

gulp.task('coverage', function() {
  return gulp.src(lib)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['coverage'], function() {
  return gulp.src('test/*.js')
    .pipe(mocha({reporter: 'spec'}))
    .pipe(istanbul.writeReports());
});

gulp.task('lint', function() {
  return gulp.src(['*.js', 'test/*.js'].concat(lib))
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('unused', function() {
  return gulp.src(['index.js', 'lib/**/*.js', 'bin/*.js'])
    .pipe(unused({keys: Object.keys(require('./lib/utils.js'))}));
});

gulp.task('default', ['test', 'lint']);
