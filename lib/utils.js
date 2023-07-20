'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const stores = {};

const defineProperty = (obj, name, fn) => {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    get() {
      return fn();
    }
  });
};

defineProperty(exports, 'runner', () => require('base-runner'));
defineProperty(exports, 'middleware', () => require('common-middleware'));
defineProperty(exports, 'config-file', () => require('config-file'));
defineProperty(exports, 'DataStore', () => require('data-store'));
defineProperty(exports, 'extend', () => require('extend-shallow'));
defineProperty(exports, 'exists', () => require('fs-exists-sync'));
defineProperty(exports, 'generate', () => require('generate'));
defineProperty(exports, 'get', () => require('get-value'));
defineProperty(exports, 'gm', () => require('global-modules'));
defineProperty(exports, 'format', () => require('gulp-format-md'));
defineProperty(exports, 'reflinks', () => require('gulp-reflinks'));
defineProperty(exports, 'typeOf', () => require('kind-of'));
defineProperty(exports, 'log', () => require('log-utils'));
defineProperty(exports, 'MacroStore', () => require('macro-store'));
defineProperty(exports, 'merge', () => require('merge-deep'));
defineProperty(exports, 'pick', () => require('object.pick'));
defineProperty(exports, 'set', () => require('set-value'));
defineProperty(exports, 'strip', () => require('strip-color'));
defineProperty(exports, 'table', () => require('text-table'));
defineProperty(exports, 'through', () => require('through2'));
defineProperty(exports, 'parse', () => require('yargs-parser'));

/**
 * Format a value to be displayed in the command line
 */

exports.formatValue = val => exports.cyan(util.inspect(val, null, 10));

/**
 * Return true if a value is an object.
 */

exports.isObject = val => exports.typeOf(val) === 'object';

/**
 * Returns true if `val` is true or is an object with `show: true`
 *
 * @param {String} `val`
 * @return {Boolean}
 */

exports.show = val => exports.isObject(val) && val.show === true;

/**
 * Initialize stores
 */

exports.stores = proto => {
  // Create `macros` store
  Object.defineProperty(proto, 'macros', {
    configurable: true,
    set(val) {
      stores.macros = val;
    },
    get() {
      return stores.macros || (stores.macros = new exports.MacroStore({ name: 'verb-macros' }));
    }
  });

  // Create `app.globals` store
  Object.defineProperty(proto, 'globals', {
    configurable: true,
    set(val) {
      stores.globals = val;
    },
    get() {
      return stores.globals || (stores.globals = new exports.DataStore('verb-globals'));
    }
  });
};

/**
 * Argv options
 */

exports.opts = {
  boolean: ['diff'],
  alias: {
    add: 'a',
    config: 'c',
    configfile: 'f',
    diff: 'diffOnly',
    global: 'g',
    help: 'h',
    silent: 'S',
    verbose: 'v',
    version: 'V',
    remove: 'r'
  }
};

exports.parseArgs = argv => {
  const obj = exports.parse(argv, exports.opts);
  if (obj.init) {
    obj._.push('init');
    delete obj.init;
  }
  if (obj.help) {
    obj._.push('help');
    delete obj.help;
  }
  return obj;
};

exports.getConfig = (app, name) => {
  const runtimeConfig = path.resolve(app.cwd, name);
  let config = exports.configFile('.verbrc.json') || {};

  if (exports.exists(runtimeConfig)) {
    const rc = JSON.parse(fs.readFileSync(runtimeConfig, 'utf8'));
    config = exports.extend({}, config, rc);
    app.base.set('cache.config', config);
  }
};

exports.getTasks = (configFile, arrays) => {
  arrays = exports.arrayify(arrays);
  let tasks = [];

  if (configFile) {
    tasks = exports.arrayify(arrays[0]);
    return tasks.length >= 1 ? tasks : ['default'];
  }

  for (let i = 0; i < arrays.length; i++) {
    const arr = exports.arrayify(arrays[i]);
    // If `default` task is defined, continue
    if (arr.length === 1 && arr[0] === 'default') {
      continue;
    }
    // If nothing is defined, continue
    if (arr.length === 0) {
      continue;
    }
    tasks = arr;
    break;
  }
  return tasks;
};

exports.arrayify = val => val ? Array.isArray(val) ? val : [val] : [];

exports.firstIndex = (arr, items) => {
  items = exports.arrayify(items);
  let idx = -1;
  for (let i = 0; i < arr.length; i++) {
    if (items.indexOf(arr[i]) !== -1) {
      idx = i;
      break;
    }
  }
  return idx;
};
