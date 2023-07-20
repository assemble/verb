'use strict';

const path = require('path');

module.exports = (app, base) => (val, key, config, next) => {
  if (typeof val === 'undefined') {
    config[key] = app.cwd;
  } else {
    config[key] = path.resolve(val);
  }
  next();
};
