'use strict';

const utils = require('./utils');

module.exports = function(app, ctx, argv) {
  if (argv.init === true) {
    return [];
  }

  const configFile = ctx.env.configFile;
  let configExists;
  let configTasks;

  // Determine the tasks to run (returns the first value that isn't `["default"]` or `[]`)
  let tasks = utils.getTasks(configFile, [
    argv._, // Command line
    ctx.pkgConfig.tasks, // Set in package.json
    app.store.get('defaultTasks') // Stored user-defined "default" tasks
  ]);

  tasks = tasks.map(function(task) {
    let isDefaults = false;

    if (task.indexOf('new') === 0 || task.indexOf('store') === 0) {
      isDefaults = true;
      task = 'defaults.' + task;

    } else if (task === 'list') {
      isDefaults = true;
      task = 'defaults:list';

    } else if (task === 'init') {
      isDefaults = true;
      task = 'defaults:init';

    } else if (task === 'format') {
      isDefaults = true;
      task = 'defaults:format';

    } else if (task === 'diff') {
      isDefaults = true;
      task = 'defaults:diff';
    }

    if (isDefaults === true) {
      app.enable('silent');
    }
    return task;
  });

  if (tasks.length === 1 && tasks[0] === 'default') {
    configExists = utils.exists(configFile);
    configTasks = app.pkg.get('verb.tasks');

    // If a `verbfile.js` or custom configFile exists, return tasks
    if (configExists) {
      if (configTasks && configTasks.length) {
        app.pkg.logWarning('ignoring tasks defined in package.json:', configTasks);
      }
      return tasks;
    }

    if (configTasks && configTasks.length) {
      return configTasks;
    }

    const verbmd = utils.exists('.verb.md');
    // If a `.verb.md` exists, but no verbfile.js, set `readme` as the default
    if (verbmd && !configExists) {
      return ['verb-generate-readme'];
    }

    // If no verbfile.js, and no `.verb.md`, ask the user if they want a `.verb.md`
    if (!verbmd) {
      return ['defaults.new:prompt-verbmd'].concat(tasks);
    }
  }
  return tasks;
};
