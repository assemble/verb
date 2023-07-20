'use strict';

const path = require('path');
const utils = require('./utils');

module.exports = function(app) {
  function bold(str) {
    return app.log.underline(app.log.bold(str));
  }

  const list = [[bold('version'), bold('name'), bold('alias')]];
  const cache = {};
  return utils.through.obj(function(file, enc, next) {
    if (cache[file.stem]) {
      next();
      return;
    }

    cache[file.stem] = true;
    const pkgPath = path.resolve(file.path, 'package.json');
    const pkg = require(pkgPath);
    list.push([app.log.gray(pkg.version), file.basename, app.log.cyan(file.alias)]);
    next();
  }, function(cb) {
    console.log();
    console.log(utils.table(list, {
      stringLength(str) {
        return utils.strip(str).length;
      }
    }));

    console.log();
    console.log(app.log.magenta(list.length + ' verb generators installed'));
    console.log();
    cb();
  });
};

