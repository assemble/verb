'use strict';

const defaultLayout = app => {
  const layout = app.pkg.get([app._name, 'layout']);
  if (typeof layout === 'string' && layout.trim() !== 'default') {
    return layout;
  }
  const name = app.pkg.get('name');
  if (/^generate-/.test(name)) {
    return 'generator';
  }
  if (/^updater-/.test(name)) {
    return 'updater';
  }
  if (/^helper-/.test(name)) {
    return 'helper';
  }
  if (/^assemble-/.test(name)) {
    return 'assemble';
  }
  if (/^verb-/.test(name)) {
    return 'verb';
  }
  return 'default';
};

/**
 * Build the list of `config.*` options to prompt the user about
 */

const buildChoices = app => app.questions.queue.reduce((acc, key) => {
  if (key.indexOf('config.') !== 0) {
    return acc;
  }

  acc.push(key.slice('config.'.length));
  return acc;
}, []);

module.exports = (app, options) => {

  /**
   * Config questions
   */

  app.questions
    .set('config.layout', 'What layout would you like to use?', {
      default: defaultLayout(app)
    })
    .set('config.toc', 'Add Table of Contents to README.md?', {
      type: 'confirm',
      default: app.pkg.get('verb.toc') || false
    })
    .set('config.plugins', 'Plugins to use (comma-separated):', {
      default: app.pkg.get('verb.plugins') || ['gulp-format-md']
    })
    .set('config.tasks', 'Tasks or generators to run (comma-separated)', {
      default: app.pkg.get('verb.tasks') || ['readme']
    })
    .set('config.lint.reflinks', 'Do you want to lint for missing reflinks and add them to verb config?', {
      type: 'confirm'
    });

  /**
   * Ask the user if they want to install plugins, if any were specified
   */

  app.question('after.plugins', 'Plugins need to be installed, want to do that now?', {
    type: 'confirm'
  });

  /**
   * Init questions
   */

  app.question('init.preferences', 'Would you like to set defaults for this project?', {
    type: 'confirm',
    next(answer, question, answers, cb) {
      // Ensure `init` questions aren't asked again
      delete answers.init;

      if (answer === true) {
        app.ask('init.choose', cb);
      } else {
        cb(null, answers);
      }
    }
  });

  app.choices('init.choose', 'Which options would you like to set?', {
    choices: buildChoices(app),
    save: false,
    next(answer, question, answers, cb) {
      // Ensure `init` questions aren't asked again
      delete answers.init;

      if (typeof answer === 'undefined' || answer.length === 0) {
        cb(null, answers);
        return;
      }

      const choices = answer.map(value => 'config.' + value);
      app.ask(choices, cb);
    }
  });
};
