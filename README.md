# file-to-npm-cache

[![npm version](https://img.shields.io/npm/v/file-to-npm-cache.svg)](https://www.npmjs.com/package/file-to-npm-cache)
[![Build Status](https://travis-ci.com/shinnn/file-to-npm-cache.svg?branch=master)](https://travis-ci.com/shinnn/file-to-npm-cache)
[![Coverage Status](https://img.shields.io/coveralls/shinnn/file-to-npm-cache.svg)](https://coveralls.io/github/shinnn/file-to-npm-cache?branch=master)

Store a file in the [npm cache directory](https://docs.npmjs.com/files/folders#cache)

```javascript
const cacache = require('cacache');
const fileToNpmCache = require('file-to-npm-cache');

(async () => {
  const cacheInfo = await fileToNpmCache('my-file.txt', 'my-key');
  /*=> {
    key: 'my-key',
    integrity: 'sha512-G31q ... RV3w==',
    path: '/Users/shinnn/.npm/_cacache/content-v2/sha512/1b/7d/ ...',
    size: 1107,
    time: 1539591818472,
    metadata: undefined
  }*/

  const {data} = await cacache.get('/Users/shinnn/.npm', 'my-key');
  // <Buffer ... a gzipped tarball of my-file.txt ...>
})();
```

## Installation

[Use](https://docs.npmjs.com/cli/install) [npm](https://docs.npmjs.com/getting-started/what-is-npm).

```
npm install file-to-npm-cache
```

## API

```javascript
const fileToNpmCache = require('file-to-npm-cache');
```

### fileToNpmCache(*path*, *key* [, *options*])

*path*: `string` (a file path)  
*key*: `string` (a unique key of a [cacache](https://github.com/zkat/cacache)-based cache)  
*options*: `Object` ([`cacache.put()`](https://github.com/zkat/cacache#put-options) options)  
Return: `Promise<Object>`

It compresses a file as a [gzipped](https://www.gzip.org) [tar](https://www.gnu.org/software/tar/manual/html_node/Standard.html), [stores](https://github.com/zkat/cacache#put-data) it into the npm cache folder and returns a `Promise` for an `Object` of the created cache information.

If the target is not a file, it returns a rejected `Promise`.

```javascript
(async () => {
  try {
    await fileToNpmCache('/etc', 'key-foo-bar');
  } catch (err) {
    err.message;
    //=> Expected a file path to save it as an npm cache, but the entry at /etc is not a file.
  }
})();
```

## License

[ISC License](./LICENSE) © 2018 Shinnosuke Watanabe
