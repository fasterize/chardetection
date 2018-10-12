/* eslint-env mocha */
const chardet = require('chardet');
const charsetFullSuite = require('./testhelper');

describe('test charset chardet', () => {
  charsetFullSuite(buffer => chardet.detect(buffer.slice(0, 30 * 1024)));
});
