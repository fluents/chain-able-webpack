import test from 'ava'
import Module from '../src/Module'

const moduleParentMock = {output: {}}

test('is Chainable', t => {
  const module = new Module(moduleParentMock)

  t.is(module.end(), moduleParentMock)
})

test('is ChainedMap', t => {
  const module = new Module(moduleParentMock)

  module.set('a', 'alpha')

  t.is(module.get('a'), 'alpha')
})

test('rule', t => {
  const module = new Module(moduleParentMock)
  const instance = module.rule('compile').end()

  t.is(instance, module)
  t.true(module.rules.has('compile'))
})

test('toConfig empty', t => {
  const module = new Module(moduleParentMock)

  t.deepEqual(module.toConfig(), {})
})

test('toConfig with values', t => {
  const module = new Module(moduleParentMock)

  module.rule('compile').test(/\.js$/)

  t.deepEqual(module.toConfig(), {rules: [{test: /\.js$/}]})
})
