'use strict';

const path = require('path');
const cwd = path.resolve.bind(path, __dirname, 'templates');
const commands = require('./commands/');
const utils = require('./utils');
const list = require('./list');
const argv = utils.parseArgs(process.argv.slice(2));
const diff = require('./diff')(argv);

/**
 * Generate a file
 */

const file = (verb, src, options, cb) => {
  const defaults = { cwd: cwd(), dest: verb.cwd };
  const opts = utils.extend({}, defaults, options);
  const dest = path.resolve(opts.dest);

  verb.engine('*', require('engine-base'));
  verb
    .src(src, { cwd: opts.cwd, layout: null })
    .pipe(verb.renderFile('*'))
    .pipe(utils.format())
    .pipe(verb.conflicts(dest))
    .pipe(
      verb.dest(file => {
        if (opts.name) file.basename = opts.name;
        file.basename = file.basename.replace(/^_/, '.');
        file.basename = file.basename.replace(/^\$/, '');
        verb.log.success('created', file.relative);
        return dest;
      })
    )
    .on('end', cb);
};

/**
 * Built-in verb tasks
 */

module.exports = (verb, base) => {
  const common = new utils.DataStore('common-config');
  const gm = path.resolve.bind(path, utils.gm);
  const cwd = path.resolve.bind(path, verb.cwd);

  verb.use(utils.middleware());

  /**
   * Listen for errors
   */

  verb.on('error', err => {
    console.error(err);
    process.exit(1);
  });

  /**
   * Format a markdown file using [pretty-remarkable][]. Optionally
   * specify a `--dest` directory and/or file `--name`.
   *
   * ```sh
   * $ verb format --src=foo/bar.md --dest=baz
   * ```
   * @name format
   * @api public
   */

  verb.task('format', cb => {
    const src = verb.option('src');
    const dest = verb.option('dest');

    verb
      .src(src)
      .pipe(utils.reflinks(verb))
      .pipe(diff('before'))
      .pipe(utils.format())
      .pipe(diff('after', 'before'))
      .pipe(
        verb.dest(file => {
          if (argv.name) file.basename = argv.name;
          return dest || file.dirname;
        })
      )
      .on('data', file => {
        console.log('formatted "%s"', file.relative);
      })
      .on('error', cb)
      .on('end', cb);
  });

  /**
   * Render a single `--src` file to the given `--dest` or current working directory.
   *
   * ```sh
   * $ verb defaults:render
   * # aliased as
   * $ verb render
   * ```
   * @name render
   * @api public
   */

  verb.task('render', cb => {
    if (!verb.option('src')) {
      verb.emit('error', new Error('Expected a `--src` filepath'));
    } else if (!verb.option('dest')) {
      verb.build(['dest', 'render'], cb);
    } else if (verb.option('dest') && verb.option('src')) {
      file(verb, verb.option('src'), { dest: verb.cwd }, cb);
    }
  });

  /**
   * The `new` sub-generator has a handful of tasks for quickly generating a file from
   * a template. Tasks on the sub-generator are called with `verb new:foo`, where `foo`
   * is the name of the task to run.
   *
   * @name new
   * @api public
   */

  verb.register('new', app => {
    app.option(verb.options);

    /**
     * On all generators, the `default` task is executed when no other task name
     * is given. Thus, on the `new` sub-generator, the `new:default` task is an alias that allows
     * you to execute the `new:verbfile` task with the following command:
     *
     * ```sh
     * $ verb new
     * # or, if you prefer verbose commands
     * $ verb new:default
     * ```
     * @name new:default
     * @api public
     */

    app.task('default', ['verbfile']);

    /**
     * Generate a `verbfile.js` in the current working directory.
     *
     * ```sh
     * $ verb new:verbfile
     * ```
     * @name new:verbfile
     * @api public
     */

    app.task('verbfile', cb => {
      file(app, 'verbfile.js', null, cb);
    });

    /**
     * Generate a `.verb.md` file in the current working directory.
     *
     * ```sh
     * $ verb new:verbmd
     * ```
     * @name new:verbmd
     * @api public
     */

    app.task('verbmd', cb => {
      file(app, '_verb.md', null, cb);
    });

    /**
     * Generate a `.verbrc.json` file in the current working directory.
     *
     * ```sh
     * $ verb new:verbmd
     * ```
     * @name new:verbmd
     * @api public
     */

    app.task('rc', cb => {
      file(app, '_verbrc.json', null, cb);
    });

    /**
     * Generate a `README.md` in the current working directory (the task will prompt
     * for project `name` and `description`).
     *
     * ```sh
     * $ verb new:readme
     * ```
     * @name new:readme
     * @api public
     */

    app.task('readme', cb => {
      file(app, 'README.md', null, cb);
    });

    /**
     * Add a `verb` config object to `package.json` in the current working directory.
     *
     * ```sh
     * $ verb new:package-config
     * ```
     * @name new:package-config
     * @api public
     */

    app.task('package-config', cb => {
      const config = app.pkg.get('verb');

      if (config && app.options.force !== true) {
        console.log('verb config already exists in package.json');
        cb();
        return;
      }

      app.pkg.set('verb', {
        toc: false,
        layout: 'default',
        tasks: ['readme'],
        plugins: ['gulp-format-md'],
        reflinks: ['verb'],
        lint: {
          reflinks: true
        }
      });

      app.pkg.save();
      cb();
    });

    /**
     * Prompts the user to add a `.verb.md` (this task runs automatically when the
     * `verb` command is given if `verbfile.js` and `.verb.md` are both missing from the
     * current working directory):
     *
     * ```sh
     * $ verb new:prompt-verbmd
     * ```
     * @name new:prompt-verbmd
     * @api public
     */

    app.task('prompt-verbmd', { silent: true }, async cb => {
      app.confirm('verbmd', 'Looks like .verb.md is missing, want to add one?');

      app.ask('verbmd', { save: false }, (err, answers) => {
        if (err) {
          cb(err);
          return;
        }

        if (answers.verbmd) {
          const config = app.options.pkg ? 'package-config' : 'prompt-package-config';
          app.build(['verbmd', config], cb);
        } else {
          cb();
        }
      });
    });

    app.task('prompt-package-config', { silent: true }, cb => {
      if (app.pkg.get('verb')) {
        cb();
        return;
      }

      app.confirm('package-config', 'Want to add a verb config to package.json?');
      app.ask('package-config', { save: false }, (err, answers) => {
        if (err) {
          cb(err);
          return;
        }

        if (answers['package-config']) {
          app.build('package-config', cb);
        } else {
          cb();
        }
      });
    });
  });

  /**
   * Display a list of installed verb generators.
   *
   * ```sh
   * $ verb list
   * ```
   * @name list
   * @api public
   */

  verb.task('list', { silent: true }, () => verb
    .src([gm('verb-generate-*'), cwd('node_modules/verb-generate-*')])
    .pipe(
      utils.through.obj((file, enc, next) => {
        file.alias = verb.toAlias(file.basename);
        next(null, file);
      })
    )
    .pipe(list(verb)));

  /**
   * Display a help menu of available commands and flags.
   *
   * ```sh
   * $ verb help
   * ```
   * @name help
   * @api public
   */

  verb.task('init', { silent: true }, cb => {
    verb.question('init', 'Would you like to use defaults, or choose settings?', {
      type: 'list',
      choices: ['defaults', 'choose'],
      all: false
    });

    verb.ask('init', { save: false }, (err, answers) => {
      if (err) {
        cb(err);
        return;
      }

      const defaults = verb.globals.get('defaults');

      switch (answers.init) {
        case 'defaults': {
          commands.init.postInit(verb, { config: defaults }, cb);
          return;
        }

        case 'choose':
        default: {
          commands.init.prompt(verb, cb);

        }
      }
    });
  });

  /**
   * Save personal defaults in user home.
   */

  verb.register('store', app => {
    app.enable('silent');

    app.task('defaults', cb => {
      const defaults = app.globals.has('defaults.defined');
      const message = defaults
        ? 'Would you like to update defaults now?'
        : 'No defaults found, would you like to set them now?';

      app.confirm('defaults', message);
      app.ask('defaults', (err, answers) => {
        if (err) return cb(err);
      });
    });

    app.task('del', cb => {
      const keys = ['name', 'username', 'twitter', 'email'];
      keys.forEach(key => {
        console.log(verb.log.red('  Deleted:'), key, common.get(key));
        common.del(keys);
      });
      cb();
    });

    app.task('show', cb => {
      const keys = ['name', 'username', 'twitter', 'email'];
      console.log();
      keys.forEach(key => {
        console.log(key + ': ' + verb.log.cyan(common.get(key)));
      });
      console.log();
      cb();
    });

    app.task('me', cb => {
      console.log();
      console.log(
        '  Answers to the following questions will be stored in:',
        verb.log.bold('~/.common-config.json')
      );
      console.log(
        '  The stored values will be used later in (your) templates.'
      );
      console.log(`  To skip a question, just hit ${verb.log.bold('<enter>')}`);
      console.log();

      app.question('common.name', 'What is your name?');
      app.question('common.username', 'GitHub username?');
      app.question('common.url', 'GitHub URL?');
      app.question('common.twitter', 'Twitter username?');
      app.question('common.email', 'Email address?');

      app.ask('common', { save: false }, (err, answers) => {
        if (err) return cb(err);

        if (!answers.common) {
          cb();
          return;
        }

        const vals = [];
        for (const key in answers.common) {
          if (answers.common.hasOwnProperty(key)) {
            const val = answers.common[key];
            common.set(key, val);
            vals.push(verb.log.green(key + ': ' + val));
          }
        }

        console.log();
        console.log('  Saved:');
        console.log();
        console.log('   ', vals.join('\n    '));
        console.log();
        console.log('  To delete these values, run:');
        console.log();
        console.log(verb.log.bold('    $ verb store:del'));
        console.log();
        console.log('  To update these values, run:');
        console.log();
        console.log(verb.log.bold('    $ verb store:me'));
        console.log();
        cb();
      });
    });

    app.task('default', ['me']);
  });

  /**
   * Display a help menu of available commands and flags.
   *
   * ```sh
   * $ verb help
   * ```
   * @name help
   * @api public
   */

  verb.task('help', { silent: true }, cb => {
    verb.enable('silent');
    verb.cli.process({ help: true }, cb);
  });

  /**
   * Default task for the built-in `defaults` generator.
   *
   * ```sh
   * $ verb defaults
   * ```
   * @name defaults
   * @api public
   */

  verb.task('default', ['help']);
};
