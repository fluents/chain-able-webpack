const {ChainedMap} = require('./Chains')

module.exports = class extends ChainedMap {
  constructor(parent) {
    super(parent)
    this.extend(['hints', 'maxEntrypointSize', 'maxAssetSize', 'assetFilter'])
  }
}
