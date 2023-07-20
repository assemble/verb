'use strict';

const debug = require('debug')('base:cli:init');
const questions = require('../questions');
const utils = require('../utils');

const filter = (app, val) => {
  if (!val) return [];
  if (typeof val === 'string') {
    val = val.split(',');
  }

  const devDeps = app.pkg.get('devDependencies') || {};
  const deps = app.pkg.get('dependencies') || {};
  const len = val.length;
  let idx = -1;
  const res = [];

  while (++idx < len) {
    const dep = val[idx];
    if (dep && !devDeps.hasOwnProperty(dep) && !deps.hasOwnProperty(dep)) {
      res.push(dep);
    }
  }
  return res;
};

const postInit = (app, answers, cb) => {
  const plugins = filter(app, utils.get(answers, 'config.plugins'));

  // eslint-disable-next-line no-negated-condition
  if (!plugins.length) {
    cb(null, answers);

  } else {
    app.ask('after', { save: false }, (err, res) => {
      if (err) return cb(err);

      const answer = utils.get(res, 'after.plugins');
      if (answer === true) {
        app.pkg.save();
        app.npm.saveDev(plugins, err => {
          if (err) return cb(err);
          app.pkg.queued = true;
          cb(null, answers);
        });
      } else {
        cb(null, answers);
      }
    });
  }
};

const ask = (app, options, cb) => {
  if (typeof app.questions === 'undefined') {
    cb(new Error('expected base-questions plugin to be defined'));
    return;
  }

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  options = utils.extend({}, options, app.options);
  questions(app, options);

  app.ask('init.choose', { save: false }, function(err, answers) {
    if (err) return cb(err);
    debug('finished with init.choose "%j"', answers);
    postInit(app, answers, cb);
  });
};

const prompt = (app, next) => {
  ask(app, { save: false }, (err, answers) => {
    if (err) {
      next(err);
      return;
    }
    const config = answers && answers.config || {};
    app.set('cache.initKeys', Object.keys(config));
    app.cli.process(answers, next);
  });
};

/**
 * Initialize a prompt session and persist the answers to the `verb` object
 * in the package.json in the current working directory.
 *
 * ```sh
 * $ --init
 * ```
 * @name --init
 * @api public
 */

module.exports = (app, base, options) => (val, key, config, next) => {
  prompt(app, next);
};

/**
 * Expose methods
 */

module.exports.postInit = postInit;
module.exports.prompt = prompt;
