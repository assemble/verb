/**!
 * verb <https://github.com/jonschlinkert/verb>
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

const Generate = require('generate');
const utils = require('./utils');
const pkg = require('../package');

/**
 * Create a verb application with `options`.
 *
 * ```js
 * var verb = require('verb');
 * var app = verb();
 * ```
 * @param {Object} `options` Settings to initialize with.
 * @api public
 */

class Verb extends Generate {
  constructor(options) {
    super(options);
    this.is('verb');
    this.initVerb(this.options);
  }

  /**
   * Initialize verb data
   */

  initVerb(opts) {
    Verb.emit('verb.preInit', this, this.base);

    /**
     * Data
     */

    this.data('before', {});
    this.data('after', {});
    this.data('runner', {
      name: 'verb',
      version: pkg.version,
      homepage: pkg.homepage
    });

    /**
     * Options
     */

    this.option('lookup', Verb.lookup(this));
    this.option('toAlias', Verb.toAlias);
    this.option('help', {
      command: 'verb',
      configname: 'verbfile',
      appname: 'verb'
    });

    /**
     * Listeners
     */

    this.on('option', (key, val) => {
      if (key === 'dest') {
        this.cwd = val;
      }
    });

    this.on('ask', (answerVal, answerKey, question) => {
      if (typeof answerVal === 'undefined') {
        const segs = answerKey.split('author.');
        if (segs.length > 1) {
          this.questions.answers[answerKey] = this.common.get(segs.pop());
        }
      }
    });

    /**
     * Middleware
     */

    this.preWrite(/(^|\/)[$_]/, (file, next) => {
      file.basename = file.basename.replace(/^_/, '.');
      file.basename = file.basename.replace(/^\$/, '');
      next();
    });

    this.constructor.emit('verb.postInit', this, this.base);
  }
}


/**
 * Expose custom lookup function for resolving generators
 */

Verb.lookup = app => key => {
  const patterns = [key];
  if (!/^verb-generate-([^-]+)/.test(key)) {
    patterns.unshift(`verb-generate-${key}`);
  }
  if (app.enabled('generate')) {
    patterns.push(`generate-${key}`);
  }
  return patterns;
};

/**
 * Convert the given `name` to the `alias` to be used in the
 * command line.
 */

Verb.toAlias = name => name.replace(/^(?:verb-generate-([^-]+)$)|(?:generate-)/, '$1');

/**
 * Expose `pkg` as a static property
 */

Verb.pkg = pkg;

/**
 * Expose `Verb`
 */

utils.stores(Verb.prototype);
module.exports = Verb;
