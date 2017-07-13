const {ChainedMap, merge, clean} = require('./Chains')

module.exports = class extends ChainedMap {
  constructor(parent) {
    super(parent)

    // @chainup
    this.use = this.parent.use
    this.rule = this.parent.rule

    this.extend(['loader', 'options'])
  }

  tap(f) {
    this.options(f(this.get('options')))
    return this
  }

  merge(obj) {
    if (obj.loader) {
      this.loader(obj.loader)
    }

    if (obj.options) {
      this.options(merge(this.store.get('options') || {}, obj.options))
    }

    return this
  }

  toConfig() {
    return clean(this.entries() || {})
  }
}
