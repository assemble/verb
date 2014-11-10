'use strict';

var verb = require('..');

/**
 * Load data to pass to templates
 */

verb.data('data/*.yml');
verb.layout('default.md', '<foo>\n<<% body %>>\n</foo>');
verb.includes('includes/*.md');
verb.docs('docs/*.md');

verb.helperAsync('docs', function (name, locals, cb) {
  var doc = this.cache.docs[name];
  this.render(doc, locals, function (err, content) {
    if (err) return cb(err);
    cb(null, content);
  });
});

verb.task('foo', function() {
  verb.src('verb.md')
    .pipe(verb.dest('temp'));
});

verb.task('readme', function() {
  verb.src('verb.md')
    // .pipe(dest(':dest/:basename'))
    .pipe(verb.dest('./'));
});

verb.task('default', ['foo', 'readme']);
