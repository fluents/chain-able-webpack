const {basename, dirname, resolve} = require('path')
const {ChainedMap, ChainedSet} = require('./Chains')
const Resolve = require('./Resolve')
const ResolveLoader = require('./ResolveLoader')
const Output = require('./Output')
const DevServer = require('./DevServer')
const Plugin = require('./Plugin')
const Module = require('./Module')
const Performance = require('./Performance')

class Entry extends ChainedSet {
  add(path) {
    // resolve to absolute if we can
    if (!this.parent.has('dir')) return super.add(path)

    if (Array.isArray(path)) {
      path = path.map(rel => resolve(this.parent.get('dir'), rel))
    }
    else {
      path = resolve(this.parent.get('dir'), path)
    }

    return super.add(path)
  }
}

module.exports = class extends ChainedMap {
  constructor() {
    super()
    this.devServer = new DevServer(this)
    this.entryPoints = new ChainedMap(this)
    this.module = new Module(this)
    this.node = new ChainedMap(this)
    this.output = new Output(this)
    this.performance = new Performance(this)
    this.plugins = new ChainedMap(this)
    this.resolve = new Resolve(this)
    this.resolveLoader = new ResolveLoader(this)
    this.extend([
      'dir',
      'amd',
      'bail',
      'cache',
      'devtool',
      'context',
      'externals',
      'loader',
      'profile',
      'recordsPath',
      'recordsInputPath',
      'recordsOutputPath',
      'stats',
      'target',
      'watch',
      'watchOptions',
    ])
  }

  entry(name) {
    if (!this.entryPoints.has(name)) {
      this.entryPoints.set(name, new Entry(this))
    }

    const entry = this.entryPoints.get(name)
    // entry.output = this.output
    return entry
  }

  plugin(name) {
    if (!this.plugins.has(name)) {
      this.plugins.set(name, new Plugin(this))
    }

    return this.plugins.get(name)
  }

  toConfig() {
    this.delete('dir')
    const entryPoints = this.entryPoints.entries() || {}

    return this.clean(
      Object.assign(this.entries() || {}, {
        node: this.node.entries(),
        output: this.output.entries(),
        resolve: this.resolve.toConfig(),
        resolveLoader: this.resolveLoader.toConfig(),
        devServer: this.devServer.entries(),
        module: this.module.toConfig(),
        plugins: this.plugins.values().map(plugin => plugin.toConfig()),
        entry: Object.keys(entryPoints).reduce(
          (acc, key) => Object.assign(acc, {[key]: entryPoints[key].values()}),
          {}
        ),
      })
    )
  }

  merge(obj = {}) {
    Object.keys(obj).forEach(key => {
      const value = obj[key]

      switch (key) {
        case 'node':
        case 'resolve':
        case 'resolveLoader':
        case 'devServer':
        case 'module': {
          return this[key].merge(value)
        }
        /**
         * @example:
         *
         * input:
         * '/code/example/dist/[name].js'
         *
         * output:
         * {
         *   path: '/code/example/dist',
         *   filename: '[name].js',
         * }
         *
         *
         */
        case 'output': {
          if (typeof value === 'string') {
            const filename = basename(value)
            const dir = dirname(value)
            const asObject = {
              path: dir,
              filename,
            }
            return this.output.merge(asObject)
          }

          return this[key].merge(value)
        }
        /**
         * take a string entry,
         * file name becomes property,
         * value becomes an array,
         * if the same prop exists,
         * it is merged in with existing values
         *
         * @example:
         *
         * input: './src/front/index.js'
         * output: {index: ['./src/front/index.js']}
         */
        case 'entry': {
          if (typeof value === 'string') {
            // console.log({value}, '____________WASSTRING')

            let name = basename(value)
            if (name.includes('.')) {
              name = name.split('.').shift()
            }
            let includes = false

            // dedupe when we have relative then resolved
            this.entryPoints.values().forEach(val => {
              if (value.includes(value)) includes = true
            })
            if (includes) {
              this.entryPoints = new ChainedMap(this)
              return this.entry(name).merge([value])
            }
            else {
              return this.entry(name).merge([value])
            }
          }
          else if (Array.isArray(value)) {
            // console.log({value}, '____________WASARRAY')
            return value.forEach(val => {
              this.entry('index').add(val)
            })
          }
          // console.log({value}, '____________WASOBJ')

          return Object.keys(value).forEach(name =>
            this.entry(name).merge(value[name])
          )
        }

        case 'plugin': {
          return Object.keys(value).forEach(name =>
            this.plugin(name).merge(value[name])
          )
        }
        /**
         * @see ./Plugin
         * merge an array of plugins
         */
        case 'plugins': {
          if (Array.isArray(value)) {
            return value.forEach((plugin, index) => {
              plugin.name = plugin.name || index

              // if Class, default Plugin.init will instantiate it
              if (toString.call(plugin) === '[object Function]') {
                this.plugin(plugin.name).plugin(plugin)
              }
              else {
                // otherwise, it is already instantiated
                this.plugin(plugin.name).init(args => plugin)
              }
            })
          }
        }

        default: {
          this.set(key, value)
        }
      }
    })

    return this
  }
}
