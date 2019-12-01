
# Small vinyl-stream wrapper -aka Gulp plugin- for webpack

Run webpack within your streams. *Compatible with Webpack v5*.

Supports multi-compilations. Gets entry points from the Vinyl stream. Does not support webpack's watch or devServer options.

> *NOTE:* No tests have been written yet!

## Installation

`yarn install`. Or `npm install`. Or just copy the files to your own project.

## Usage

```javascript
const webpackWrapper = require('@eklingen/vinyl-stream-webpack')
stream.pipe(webpackWrapper())
```

This plugin assumes an existing configuration dotfile where webpack can find it. You can also pass it via the `config` options.

## Options

There are a few options:

### `config`

Use this to pass in a configuration object.

```javascript
webpackWrapper({
  config: { ... }
})
```

### `logStats`

Set this option to log verbose stats to the terminal. If falsey, then this plugin will be quiet.

```javascript
webpackWrapper({
  logStats: true
})
```

## Dependencies

This package requires ["webpack"](https://www.npmjs.com/package/webpack), ["vinyl"](https://www.npmjs.com/package/vinyl) and ["memfs"](https://www.npmjs.com/package/memfs).

---

Copyright (c) 2019 Elco Klingen. MIT License.
