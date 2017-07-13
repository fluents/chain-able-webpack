const {resolve} = require('path')
const {ChainedMap} = require('./Chains')

module.exports = class extends ChainedMap {
  constructor(parent) {
    super(parent)

    // @chainup
    this.module = this.parent.module

    this.extend([
      'chunkFilename',
      'crossOriginLoading',
      'filename',
      'library',
      'libraryTarget',
      'devtoolFallbackModuleFilenameTemplate',
      'devtoolLineToLine',
      'devtoolModuleFilenameTemplate',
      'hashFunction',
      'hashDigest',
      'hashDigestLength',
      'hashSalt',
      'hotUpdateChunkFilename',
      'hotUpdateFunction',
      'hotUpdateMainFilename',
      'jsonpFunction',
      'pathinfo',
      'publicPath',
      'sourceMapFilename',
      'sourcePrefix',
      'strictModuleExceptionHandling',
      'umdNamedDefine',
    ])
  }

  path(path) {
    // resolve to absolute if we can
    if (this.parent.has('dir')) {
      const resolved = resolve(this.parent.get('dir'), path)
      return this.set('path', resolved)
    }

    return this.set('path', path)
  }
}
