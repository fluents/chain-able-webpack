// @NOTE:
// if we use happypack,
// it replaces compatible loaders
// and uses workers to do the processing in the plugins
//
// https://github.com/amireh/happypack/issues/53#issuecomment-226356543
// https://github.com/amireh/happypack/issues/119
// https://github.com/amireh/happypack/issues/58
// https://github.com/amireh/happypack/wiki/Loader-Compatibility-List
const HappyPackAPI = require('happypack2')
const {Chain} = require('./Chains')
const log = require('fliplog')

const threadPool = HappyPackAPI.ThreadPool({size: 5})

function nameFromPath(name) {
  if (/node_modules/.test(name)) {
    name = name.split('node_modules/').pop()
    if (name.includes('/')) name = name.split('/').shift()
    // is for babel specifically: .replace('/lib/index.js', '')
  }

  log.green(name).data('using name from path').echo()

  return name
}

class HappyPack extends Chain {
  constructor() {
    super()
    this.extend(['rules', 'config'])
    this.init()
  }

  init() {
    this.rulesToRemove = []
    this.compatibilityList = ['babel', 'sass', 'minify', 'style', 'transform']
    this.happy = {
      rules: [],
      plugins: [],
    }

    this.params = {
      // cache: false,
      // threads: 4,
      include: ['./src'],
    }
  }

  /**
   * @TODO: could also check an array of names
   * @param  {string}  name
   * @return {boolean}
   */
  isCompatible(name) {
    const list = this.compatibilityList

    for (let i = 0; i < list.length; i++) {
      const compat = list[i]
      if (name.includes(compat)) {
        log.blue(name + ' is compatible').echo(this.get('debug'))
        return true
      }
    }

    log.red(name + ' is not compatible').echo(this.get('debug'))
    return false
  }

  happyPlugins() {
    const {rules, config} = this.entries()
    const happyParams = Object.assign({}, {}, this.params)
    delete happyParams.include

    for (let i = 0; rules.length > i; i++) {
      const {rule, ruleName} = rules[i]
      // @NOTE: because of by-ref, was using this.params mutated for each
      const params = {} // happyParams

      // @see ::getHappyLoaders#example
      let name = i
      if (rule.use && rule.use[0] && rule.use[0].loader) {
        name = rule.use[0].loader
        name = nameFromPath(name)
      }

      if (!this.isCompatible(name)) {
        log.red(name + ' is not compatible with happypack, ignoring').echo()
        continue
      }

      // has to be an array
      params.loaders = [name]
      params.id = name

      // params.options = options
      // log.data(params).verbose(true).echo()
      // process.exit()

      log
        .blue('setup happypack params: happypack' + i)
        .fmtobj(params)
        .echo(this.get('debug'))

      config.plugin('happypack' + i).use(HappyPackAPI, {
        loaders: [name],
        id: name,
        cache: true,
        debug: true,
        threadPool,
      })
      // .init(() => {
      //   log.quick('using this...', params)
      //   return new HappyPackAPI(params)
      // })

      // this.happy.plugins.push(new HappyPackAPI(params))
    }

    return this
  }

  /**
   * @NOTE: always loaded before plugins
   *
   * @example @old
   * {
   *    babel: {
   *      // when not using query
   *      loaders: 'babel-loader',
   *      // when using query
   *      loader: 'babel-loader',
   *    },
   *    'babel-loader',
   * }
   *
   * @example rules example
   * {
   *  test: /\.jsx?$/,
   *  include: [ '/Users/code/src', '/Users/code/test' ],
   *  use: [{
   *    loader: '/Users/code/node_modules/neutrino-middleware-compile-loader/node_modules/babel-loader/lib/index.js',
   *    options: [Object]
   *  }]
   * }
   *
   * @return {HappyPack} @chainable
   */
  happyRules() {
    const {rules, config} = this.entries()

    for (let i = 0; rules.length > i; i++) {
      const {rule, ruleName} = rules[i]

      let name = i
      let options = rule.options || {}
      if (rule.use && rule.use[0] && rule.use[0].loader) {
        name = rule.use[0].loader
        options = rule.use[0].options || {}
        name = nameFromPath(name)

        // log
        //   .bold('extracting from rule')
        //   .fmtobj({
        //     i,
        //     rule,
        //     name,
        //     options,
        //   })
        //   .echo(this.get('debug'))
      }

      // this will be depreciated some day...
      let wasStr = false
      if (typeof options === 'string') {
        wasStr = true
        options = JSON.parse(options)
      }

      log
        .cyan('setup happypack rules:')
        .fmtobj({
          ruleName,
          test: rule.test,
          loader: ['happypack2/loader?id=' + name],
          options,
        })
        .echo(this.get('debug'))

      // remove the old loader
      config.module.rules.delete(ruleName)

      // options.loader = 'happypack/loader?id=' + name
      options.compilerId = name
      options.id = name

      if (wasStr === true) {
        options = JSON.stringify(options)
      }

      // happypack uses a happypack loader
      // with an id for each loader
      // then the plugin hijacks it and does the caching
      config.module
        .rule(ruleName)
        .test(rule.test)
        .use('happypack2/loader?id=' + name)
        .loader('happypack2/loader?id=' + name)
        // .set('invalid', 'happypack/loader?id=' + name)
        .options(options)
    }

    return this
  }
}

function handleNeutrino(neutrino) {
  let config = neutrino
  if (config.config) config = config.config

  const toConfig = config.toConfig()
  if (!toConfig.module || !toConfig.module.rules) return

  // map names to values
  const entries = config.module.rules.entries()
  const names = Object.keys(entries)
  const rules = config.module.rules.values().map((rule, i) => {
    return {ruleName: names[i], rule: rule.toConfig()}
  })

  // instantiate, get rules to remove
  const happypack = new HappyPack()
    .debug(false)
    .rules(rules)
    .config(config)
    .happyRules()
    .happyPlugins()
}

handleNeutrino.happypack = handleNeutrino
module.exports = handleNeutrino
