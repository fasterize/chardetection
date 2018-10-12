/* eslint-env mocha */
const chardetection = require('../index');
const charsetFullSuite = require('./testhelper');

describe('test charset chardetection', () => {
  charsetFullSuite(chardetection);
});
