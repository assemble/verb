'use strict';

const path = require('path');
const reflinks = require('./reflinks');
const utils = require('./utils');

/**
 * Format a markdown file using [pretty-remarkable][]. Optionally
 * specify a `--dest` directory and/or file `--name`.
 *
 * ```sh
 * $ verb --format foo/bar.md
 * ```
 * @name --format
 * @api public
 */

module.exports = (verb, options) => (filepath, key, config, next) => {
  if (!filepath || typeof filepath !== 'string') {
    next();
    return;
  }

  verb.src(path.resolve(filepath))
    .pipe(reflinks(verb))
    .pipe(utils.format())
    .pipe(verb.dest(file => {
      file.basename = config.name || path.basename(filepath);
      return config.dest || path.resolve(path.dirname(filepath));
    }))
    .on('error', next)
    .on('end', next);
};
