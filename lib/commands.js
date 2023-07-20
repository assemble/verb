'use strict';

const commands = require('./commands/');

module.exports = (app, options) => {
  for (const key in commands) {
    if (commands.hasOwnProperty(key)) {
      app.cli.map(key, commands[key](app, options));
    }
  }
};
