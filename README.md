# chardetection

Character encoding auto-detection in JavaScript (using jschardet and chardet)

[![build status](https://secure.travis-ci.org/fasterize/chardetection.svg)](http://travis-ci.org/fasterize/chardetection)
[![dependency status](https://david-dm.org/fasterize/chardetection.svg)](https://david-dm.org/fasterize/chardetection)

## Motivation

[Jschardet](https://github.com/aadsm/jschardet) is a Javascript port of mozilla universal character detector. It is mainly used by the editor [Vscode](https://github.com/Microsoft/vscode/blob/master/src/vs/base/node/encoding.ts) and [Atom](https://github.com/atom/encoding-selector/blob/master/lib/main.js)
[chardet](https://www.npmjs.com/package/chardet) is a character detector based on ICU. It is mainly used by the discord-irc project.

I found that those two char detectors could be very inacurrate on some situation.
Combining both detectors give better detection results.

This module takes into account the support provided by both detectors and also the [current usage of charsets on the web](https://w3techs.com/technologies/overview/character_encoding/all). In case of doubt, the priority is given to the most used charset.

This module comes with an extensive tests suite compiled from other detectors test suites.

## Algorithm

- Jschardet is used as a primary source
- => detected charset is on the list of accurately detected charset by jschardet, return

- Chardet ICU is used as a second source
- => detected charset is on the list of accurately detected charset by chardet, return

- Verify if both chardet detect the same chardet, return

- Send the jschardet detected charset.

## Benchmark

- chardetector : 81 errors over 540 files
- jschardet : 133 errors over 540 files
- chardet : 147 errors over 540 files
- mmmagic : 434 errors over 540 files

## Installation

```
npm install --save chardetection
```

## Usage

```js
import chardetector from 'chardetector';

const charset = chardetector(
  buffer,
  [debug],
  [logger],
  [bufferMaxLength],
  [charsetsWithLowConfidence],
  [jschardetCharsetList],
  [chardetCharsetList],
);
```

## Credits

[Fasterize](https://github.com/fasterize/)

## License

ISC
