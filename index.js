const chardet = require('chardet'); // icu detector
const jschardet = require('jschardet'); // mozilla universal detector

const defaultJschardetCharsetList = [
  'UTF-8',
  'ascii',
  'ISO-8859-5',
  'KOI8-R',
  'TIS-620',
  'windows-1251',
  'SHIFT_JIS',
  'EUC-JP',
  'EUC-KR',
  'GB2312',
  'ISO-2022-JP',
  'ISO-2022-KR',
  'Big5',
];

const defaultChardetCharsetList = [
  'UTF-8',
  'ISO-8859-2',
  'ISO-8859-6',
  'ISO-8859-9',
  'EUC-KR',
  'windows-1251',
  'windows-1252',
  'windows-1255',
  'windows-1254',
  'windows-1256',
];

const defaultBufferMaxLength = 20 * 1024;

const defaultCharsetsWithLowConfidence = [
  'ISO-2022-JP',
  'ISO-2022-KR',
  'MacCyrillic',
  'IBM855',
  'IBM866',
];

const normalizeUTF8 = charset => {
  // reduce risk of wrong detection since ascii is a subset of UTF-8
  return ['ascii'].includes(charset) ? 'UTF-8' : charset;
};

module.exports = (
  buffer,
  bufferMaxLength = defaultBufferMaxLength,
  charsetsWithLowConfidence = defaultCharsetsWithLowConfidence,
  jschardetCharsetList = defaultJschardetCharsetList,
  chardetCharsetList = defaultChardetCharsetList,
  debug = false,
  // eslint-disable-next-line
  logger = console.log,
) => {
  if (buffer.length > 0) {
    const bodyPart = buffer.slice(0, bufferMaxLength);

    const jschardetResult = jschardet.detect(bodyPart);

    if (debug) {
      logger('Trying detection with jschardet', jschardetResult);
    }

    // very good detection for jschardet
    if (
      jschardetCharsetList.includes(jschardetResult.encoding) &&
      jschardetResult.confidence > 0.9 &&
      !charsetsWithLowConfidence.includes(jschardetResult.encoding)
    ) {
      if (debug) {
        logger('Use jschardet detection');
      }
      return normalizeUTF8(jschardetResult.encoding);
    }

    const chardetResult = chardet.detectAll(bodyPart)[0]; // icu port used by chromium

    if (debug) {
      logger('Trying detection with icu chardet', chardetResult);
    }

    // very good detection for chardet that could be wrong for jschardet
    if (
      chardetCharsetList.includes(chardetResult.name) &&
      chardetResult.confidence > 20 &&
      !charsetsWithLowConfidence.includes(chardetResult.name)
    ) {
      if (debug) {
        logger('Use chardet detection');
      }
      return normalizeUTF8(chardetResult.name);
    }

    // heuristic on the detection of 'ISO-8859-1', 'ISO-8859-15, 'ISO-8859-7''
    // heuristic based on encoding occurance from https://w3techs.com/technologies/overview/character_encoding/all
    // In case of doubt, ISO-8859-1 is selected
    if (jschardetResult.encoding === chardetResult.name) {
      if (debug) {
        logger('Both chardet detect the same charset');
      }
      return normalizeUTF8(jschardetResult.encoding);
    }

    // from https://chardet.readthedocs.io/en/latest/supported-encodings.html
    // Greek text encoded as ISO-8859-7 was often mis-reported as ISO-8859-2
    if (
      chardetResult.name === 'ISO-8859-1' &&
      chardetResult.confidence < 30 &&
      jschardetResult.encoding === 'ISO-8859-2' &&
      jschardetResult.confidence >= 0.6
    ) {
      if (debug) {
        logger('heuristic for ISO-8859-7');
      }
      return 'ISO-8859-7';
    }

    if (chardetResult.name === 'ISO-8859-1') {
      return 'ISO-8859-1';
    }

    return normalizeUTF8(jschardetResult.encoding);
  }
  return null;
};
