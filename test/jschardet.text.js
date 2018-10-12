/* eslint-env mocha */
const jschardet = require('jschardet');
const charsetFullSuite = require('./testhelper');

describe('test charset jschardet', () => {
  charsetFullSuite(buffer => {
    const res = jschardet.detect(buffer.slice(0, 30 * 1024));
    return res && res.encoding;
  });
});
