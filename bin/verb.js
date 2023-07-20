#!/usr/bin/env node

process.env.GENERATE_CLI = true;
process.on('exit', () => {
  require('set-blocking')(true);
});

const util = require('util');
const Verb = require('..');
const commands = require('../lib/commands');
const tasks = require('../lib/tasks');
const utils = require('../lib/utils');
const args = process.argv.slice(2);
const argv = require('yargs-parser')(args);

/**
 * Handle errors
 */

const handleErr = (app, err) => {
  if (app && app.base.hasListeners('error')) {
    app.base.emit('error', err);
  } else {
    console.log(err.stack);
    process.exit(1);
  }
};

/**
 * Listen for errors on all instances
 */

Verb.on('generate.preInit', app => {
  app.on('error', err => {
    console.log(err.stack);
    process.exit(1);
  });
});

/**
 * Initialize CLI
 */

Verb.on('generate.postInit', app => {
  if (app.macros.has(args)) {
    app.macros.set(args);
    const macro = {};
    macro[args[0]] = args.slice(2).join(' ');
    console.log('saved macro:', util.inspect(macro));
    process.exit();
  }

  const idx = utils.firstIndex(args, ['-D', '--default']);
  if (idx !== -1) {
    const del = args.indexOf('--del') !== -1;
    if (del) {
      app.base.store.del('defaultTask');
    } else {
      args.splice(idx, 1);
      app.base.store.set('defaultTask', args);
    }
  }
});

/**
 * Initialize Runner
 */

const options = { name: 'verb' };

utils.runner(Verb, options, argv, (err, app, runnerContext) => {
  if (err) handleErr(app, err);

  app.set('cache.runnerContext', runnerContext);
  commands(app, runnerContext);

  if (!app.generators.defaults) {
    app.register('defaults', require('../lib/generator'));
  }

  const ctx = utils.extend({}, runnerContext);
  const config = app.get('cache.config') || {};
  ctx.argv.tasks = [];

  app.config.process(config, (err, config) => {
    if (err) return handleErr(app, err);

    app.base.cache.config = config;

    app.cli.process(ctx.argv, err => {
      if (err) return handleErr(app, err);

      const arr = tasks(app, ctx, argv);
      app.log.success('running tasks:', arr);
      app.generate(arr, err => {
        if (err) handleErr(app, err);
      });
    });
  });
});
