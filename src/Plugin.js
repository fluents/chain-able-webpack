const {ChainedMap} = require('./Chains')

module.exports = class extends ChainedMap {
  constructor(parent) {
    super(parent)
    this.extend(['init'])

    // chain back up
    this.plugin = name => this.parent.plugin(name)
    this.init((Plugin, args = []) => {
      if (!Array.isArray(args)) args = [args]
      return new Plugin(...args)
    })
  }

  /**
   * @TODO: RESOLVE REL PATHS IN ARGS
   */
  use(plugin, args = []) {
    return this.set('plugin', plugin).set('args', args)
  }

  tap(f) {
    this.set('args', f(this.get('args') || []))
    return this
  }

  merge(obj) {
    if (obj.plugin) {
      this.set('plugin', obj.plugin)
    }

    if (obj.args) {
      this.set('args', obj.args)
    }

    return this
  }

  toConfig() {
    const init = this.get('init')

    return init(this.get('plugin'), this.get('args'))
  }
}
