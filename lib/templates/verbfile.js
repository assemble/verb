---
layout: false
---
'use strict';

module.exports = verb => {
  verb.use(require('verb-generate-readme'));

  verb.helper('foo', input => {
    return input;
  });

  verb.task('default', ['readme']);
};
