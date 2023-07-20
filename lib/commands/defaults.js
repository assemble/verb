'use strict';

const fs = require('fs');
const path = require('path');
const merge = require('mixin-deep');
const utils = require('../utils');

/**
 * Persist a value to a namespaced defaults object in package.json. For
 * example, if you're using `verb`, the value would be saved to the
 * `verb` object.
 *
 * ```sh
 * # display the defaults
 * $ verb --defaults
 * # set a boolean for the current project
 * $ verb --defaults=toc
 * # save the cwd to use for the current project
 * $ verb --defaults=cwd:foo
 * # save the tasks to run for the current project
 * $ verb --defaults=tasks:readme
 * ```
 *
 * @name defaults
 * @param {Object} verb
 * @api public
 * @cli public
 */

module.exports = (verb, base, options) => {
  let ran = false;

  return (val, key, config, next) => {
    if (ran === true) {
      next();
      return;
    }

    ran = true;

    // Get the keys of properties defined by an `--init` prompt
    const keys = verb.get('cache.initKeys') || [];
    const name = verb._name.toLowerCase();

    if (utils.show(val)) {
      const pkgConfig = {};
      pkgConfig[name] = verb.pkg.get(name) || {};
      console.error(utils.formatValue(pkgConfig));
      next();
      return;
    }

    const pkgPath = path.resolve(verb.cwd, 'package.json');
    let pkg = {};

    if (utils.exists(pkgPath)) {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    }

    pkg = merge({}, verb.pkg.data, pkg);
    verb.pkg.del(name);
    let orig = pkg[name] || {};

    // Normalize both the old and new values before merging, using
    // A schema that is specifically used for normalizing values to
    // Be written back to package.json
    const tmp = verb.cli.schema.normalize({ config: {} }) || {};
    orig = tmp.config;

    // Merge the normalized values
    let merged = val;
    if (utils.isObject(val) && utils.isObject(orig)) {
      merged = merge({}, orig, val);
    }

    // Show the new value in the console
    const show = utils.pick(merged, keys);
    verb.pkg.logInfo('updated package.json config with', show);

    // Update options and `cache.config`
    verb.set('cache.config', merged);
    verb.emit('config', merged);

    // Update the config property
    config[key] = merged;
    if (verb.pkg.queued === true) {
      verb.pkg.data = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    }

    // Re-set updated config object in `package.json`
    verb.pkg.set(name, merged);
    verb.pkg.save();
    verb.cli.process(merged, next);
  };
};
