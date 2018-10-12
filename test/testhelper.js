/* eslint-env mocha */
const should = require('should');
const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const deprecatedCharset = [
  'ISO-2022-jp',
  'ISO-2022-kr',
  'MacCyrillic',
  'IBM855',
  'IBM866',
  'IBM424',
  'UTF-16',
  'UTF-16LE',
  'UTF-16BE',
  'UTF-32',
];

module.exports = function charsetFullSuite(detector) {
  function testEncoding(file, expectedCharset) {
    const encodedBuffer = fs.readFileSync(file);
    const charset = detector(encodedBuffer);
    if (expectedCharset) {
      should.exists(charset);
      iconv.encodingExists(charset).should.be.true();
      assert.equal(
        iconv.decode(encodedBuffer, charset),
        iconv.decode(encodedBuffer, expectedCharset),
        `detected charset ${charset}`,
      );
    } else {
      should.not.exists(charset);
    }
  }

  const charsetDirectory = path.join(__dirname, '/encodings');
  const charsets = fs.readdirSync(charsetDirectory);
  charsets.filter(charset => !deprecatedCharset.includes(charset)).forEach(charset => {
    describe(`charset ${charset}`, () => {
      const files = fs.readdirSync(`${charsetDirectory}/${charset}`);
      files.forEach(file => {
        const expectedCharset = charset.replace(
          /-(arabic|bulgarian|cyrillic|greek|hebrew|hungarian|turkish)/,
          '',
        );
        it(`should detect the charset ${expectedCharset} for the file ${charset}/${file}`, () => {
          testEncoding(`${charsetDirectory}/${charset}/${file}`, expectedCharset);
        });
      });
    });
  });

  describe('binary content', () => {
    const directory = path.join(__dirname, 'binary');
    const files = fs.readdirSync(directory);
    files.forEach(file => {
      it(`should not detect a charset for the file ${file}`, () => {
        testEncoding(`${directory}/${file}`, null);
      });
    });
  });
};
