//base.js
// import {resolve} from 'path'
// import test from 'ava'
// import log from 'fliplog'
// import Config from '../src/Config'

const {resolve} = require('path')
const log = require('fliplog')
const Config = require('../src/Config')
// const OrderedMap = require('../src/_OrderedMap')
const OrderedMap = require('chain-able').ChainedMap
//
const res = rel => resolve(__dirname, rel)
//
// const order = new OrderedMap()
// const zero = new OrderedMap()
// order.set('zero', zero)
// order.set('one', '1')
// order.set('zero', 'back to zero!')
// order.clear()
// order.set('ten', 10)
// order.set('zero', 0)
//
// for (var [key, val] of order) {
//   log.prettyformat({key, val}).echo()
// }

// log.prettyformat(order).exit()

const parent = {parent: true}
const config = new Config(parent)

config.module
  .rule('Javascript')
  .test(/\.jsx?$/)
  .enforce('pre')
  .included.add(res('src'))
  .end()
  .use('babel')
  .loader('babel-loader')

const before = config.toConfig()
// log.prettyformat(config.toConfig()).exit()

// Object {
//   "module": Object {
//     "rules": Array [
//       Object {
//         "enforce": "pre",
//         "include": Array [
//           "/Users/james/code/vscoded/gridmono/_chains/chain-able-webpack/test/src",
//         ],
//         "test": /\.jsx?$/,
//         "use": Array [
//           Object {
//             "loader": "babel-loader",
//           },
//         ],
//       },
//     ],
//   },
// }

// start diff for comparison
log.diff(before)

const jsRule = config.module.rule('Javascript')

jsRule.prepend('hot').loader('react-hot-loader/webpack')

// .use('babel')
// .loader('babel-loader')

// get after, compare, echo
const after = config.toConfig()
log.diff(after)
log.diffs().echo()

// Object {
//   "module": Object {
//     "rules": Array [
//       Object {
//         "enforce": "pre",
//         "include": Array [
//           "/Users/james/code/vscoded/gridmono/_chains/chain-able-webpack/test/src",
//         ],
//         "test": /\.jsx?$/,
//         "use": Array [
//           Object {
//             "loader": "react-hot-loader/webpack",
//           },
//           Object {
//             "loader": "babel-loader",
//           },
//         ],
//       },
//     ],
//   },
// }

// log.prettyformat(config.toConfig()).exit()

// log.quick(config)

// test('is ReOrderable', t => {
//   const parent = {parent: true}
//   const config = new Config(parent)
//   config.module
//     .rule('Javascript')
//     .test(/\.jsx?$/)
//     .enforce('pre')
//     .include.add(res('src'))
//     .end()
//     .use('babel')
//     .loader('babel-loader')
//
//   //development.js
//   log.quick(config)
//   config.module
//     .rule('Javascript')
//     .uses.clear()
//     .end()
//     .use('hot')
//     .loader('react-hot-loader/webpack')
//     .end()
//     .use('babel')
//     .loader('babel-loader')
//   log.quick(config)
// })
