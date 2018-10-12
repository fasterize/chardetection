/* eslint-env mocha */
const mmm = require('mmmagic');
const charsetFullSuite = require('./testhelper-async');

const magic = new mmm.Magic(mmm.MAGIC_MIME_ENCODING);

describe('test charset jschardet', () => {
  charsetFullSuite((buffer, callback) => {
    try {
      magic.detect(buffer.slice(0, 30 * 1024), callback);
    } catch (error) {
      console.log(error);
    }
  });
});
