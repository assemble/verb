'use strict';

const differ = require('diff');
const through = require('through2');
const utils = require('./utils');

const color = stat => {
  if (stat.removed) return 'red';
  if (stat.added) return 'green';
  return 'gray';
};

const diff = (a, b, method) => {
  differ[method || 'diffWords'](a, b).forEach(stat => {
    process.stderr.write(utils.log[color(stat)](stat.value));
  });
  console.error();
};

/**
 * Output to the console a visual representation of the difference between
 * two objects or strings.
 *
 * @param {Object|String} `a`
 * @param {Object|String} `b`
 * @api public
 */

module.exports = options => {
  const cache = {};
  let prev;

  return (a, b) => through.obj((file, enc, next) => {
    if (options?.diff === false) {
      next(null, file);
      return;
    }

    const contents = file.contents.toString();
    cache[a] = contents;
    const str = b ? cache[b] || b : prev;

    if (typeof str !== 'undefined') {
      diff(contents, cache[b]);
      next();
      return;
    }
    prev = contents;
    next(null, file);
  });
};
