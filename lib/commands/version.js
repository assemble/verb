'use strict';

const pkg = require('../../package');

module.exports = app => (val, key, config, next) => {
  console.log(app.log.cyan(`${app._name} v${pkg.version}`));
  process.exit();
};
