// Small vinyl-stream wrapper -aka Gulp plugin- for Webpack.
// Compatible with Webpack v5.
//
// Supports multi-compilations.
// Gets entry points from the Vinyl stream.
// Does not support webpack's watch or devServer options.

const { basename, extname, join } = require('path')
const { Transform } = require('stream')

const DEFAULT_OPTIONS = {
  config: {},
  logStats: true
}

const FIXED_OPTIONS = {
  entry: {},
  watch: false,
  devServer: {}
}

function webpackWrapper (options = {}) {
  const webpack = require('webpack')
  const Vinyl = require('vinyl')

  options = { ...DEFAULT_OPTIONS, ...options, ...FIXED_OPTIONS }

  const entries = {}

  function runCallback (error, stats, callback, compiler) {
    if (error) {
      return callback(new Error(error))
    }

    if (stats) {
      const jsonStats = stats.toJson()
      const errors = jsonStats.errors || []
      const warnings = jsonStats.warnings || []

      if (stats.hasErrors() || errors.length) {
        return callback(errors[0].message.split('   at ')[0]) // Remove the stack trace from the error
      }

      if (stats.hasWarnings() || warnings.length) {
        console.log('Warning:', warnings[0].message.split('   at ')[0]) // Remove the stack trace from the warning
      }

      if (options.stats) {
        const statsObject = typeof options.stats === 'object' ? options.stats : {}
        console.log(stats.toString({ ...statsObject, colors: true }))
      }
    }

    compiler.close(() => {}) // Webpack v5

    return callback()
  }

  function transform (file, encoding, callback) {
    if (!file.isBuffer() || !file.contents || !file.contents.length) {
      return
    }

    // Take the file and save it as an entrypoint
    entries[basename(file.path, extname(file.path))] = file.path

    // Then remove it from the stream
    return callback()
  }

  function flush (callback) {
    // If config is an object, wrap it in an array. We assume a multi-compilation setup from here on out.
    if (!Array.isArray(options.config)) {
      options.config = [options.config]
    }

    // Take the saved entry points and set the output path
    for (const config of options.config) {
      config.entry = { ...config.entry, ...entries }
      config.output = { ...config.output, path: process.cwd() }
    }

    let compiler
    try {
      compiler = webpack(options.config)
    } catch (e) {
      return callback(e)
    }

    const onEmitAsync = (compilation, cb) => {
      // Push files back into the stream, if the compilation doesn't have errors and the files have contents
      if (compilation.errors.length) {
        return cb(compilation.errors)
      } else {
        Object.entries(compilation.assets).filter(asset => asset[1].size()).forEach(asset => {
          this.push(new Vinyl({ base: compilation.options.output.path, path: join(compilation.options.output.path, asset[0]), contents: asset[1].buffer() }))
        })
      }

      // Throw away the existing assets so Webpack won't write them to disk
      compilation.assets = []

      cb()
    }

    // For every compiler, fire the asyncEmit hook
    compiler.compilers.forEach(compiler => compiler.hooks.emit.tapAsync('vinyl-stream-webpack', (compilation, cb) => onEmitAsync(compilation, cb)))

    // Run webpack
    return compiler.run((error, stats) => runCallback(error, stats, callback, compiler))
  }

  return new Transform({ transform, flush, readableObjectMode: true, writableObjectMode: true })
}

module.exports = webpackWrapper
