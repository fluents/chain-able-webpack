const {ChainedMap, ChainedSet, clean, matcher} = require('./Chains')
const isMatcher = require('chain-able/src/deps/is/matcher')
const Use = require('./Use')

module.exports = class extends ChainedMap {
  constructor(parent) {
    super(parent)

    // @chainup
    this.plugin = name => this.parent.plugin(name)
    this.rule = name => this.parent.rule(name)
    this.module = this.parent.module
    this.output = this.parent.output

    this.uses = new ChainedMap(this)
    this.included = new ChainedSet(this)
    this.excluded = new ChainedSet(this)
    this.extend(['parser', 'test', 'enforce'])
  }

  // enforce(arg) {
  //   return this.set('enforce', arg)
  // }
  prepend(name) {
    // const uses = this.uses
    // .entries()
    const uses = new ChainedMap(this)
    uses.set(name, new Use(this))

    // const cleaner = require('fliplog')
    //   .cleaner(true)
    //   .keys([/parent/])
    //   .data(uses)
    //   .clean()
    //   .get('cleaned')
    //
    // require('fliplog').quick(cleaner)
    // process.exit()

    for (var [key, val] of this.uses) {
      uses.set(key, val)
    }
    this.uses = uses

    return this.uses.get(name)
  }

  include(args) {
    if (Array.isArray(args)) {
      args.forEach(arg => this.included.add(arg))
    } else {
      this.included.add(args)
    }

    return this
  }
  exclude(args) {
    if (Array.isArray(args)) {
      args.forEach(arg => this.excluded.add(arg))
    } else {
      this.excluded.add(args)
    }

    return this
  }

  use(name) {
    if (!this.uses.has(name)) {
      this.uses.set(name, new Use(this))
    }

    return this.uses.get(name)
  }

  pre() {
    return this.enforce('pre')
  }

  post() {
    return this.enforce('post')
  }

  toConfig() {
    delete this.parent
    // require('fliplog').quick(this)
    // require('fliplog').quick(clean(this.entries()), this.entries())
    return clean(
      Object.assign(this.entries() || {}, {
        include: this.included.values(),
        exclude: this.excluded.values(),
        use: this.uses.values().map(use => use.toConfig()),
      })
    )
  }

  merge(obj) {
    Object.keys(obj).forEach(key => {
      const value = obj[key]

      switch (key) {
        case 'include':
        case 'exclude': {
          return this[key + 'd'].merge(value)
        }

        case 'use': {
          return Object.keys(value).forEach(name =>
            this.use(name).merge(value[name])
          )
        }

        case 'test': {
          return this.test(isMatcher(value) ? value : matcher.make(value))
        }

        default: {
          this.set(key, value)
        }
      }
    })

    return this
  }
}
