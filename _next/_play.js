const log = require('fliplog')
const Immutable = require('immutable')

// log.prettyformat(new Immutable()).exit()

const {OrderedMap, OrderedSet} = Immutable

const F = Function.prototype

const serialize = value =>
  (value && value.toConfig && value.toConfig()) ||
  (value && value.toJS && value.toJS()) ||
  value

const isEmpty = serialized =>
  serialized === undefined ||
  (Array.isArray(serialized) && !serialized.length) ||
  (Object.prototype.toString.call(serialized) === '[object Object]' &&
    !Object.keys(serialized).length)

const ChainableOrderedMap = (parent, setters = []) => {
  const map = OrderedMap().asMutable()

  setters.forEach(method => (map[method] = value => map.set(method, value)))

  return Object.assign(map, {
    __setters: setters,

    end() {
      return parent || map
    },

    insertBefore(beforeKey, key, value) {
      const temp = OrderedMap().asMutable()

      map.forEach((v, k) => {
        if (k === beforeKey) {
          temp.set(key, value)
        }

        temp.set(k, v)
      })

      return map.clear().merge(temp)
    },

    insertAfter(afterKey, key, value) {
      const temp = OrderedMap().asMutable()

      map.forEach((v, k) => {
        temp.set(k, v)

        if (k === afterKey) {
          temp.set(key, value)
        }
      })

      return map.clear().merge(temp)
    },

    when(condition, whenTruthy = F, whenFalsy = F) {
      if (condition) {
        whenTruthy(map)
      }
      else {
        whenFalsy(map)
      }

      return map
    },

    toConfig() {
      return map.reduce((reduction, value, key) => {
        const serialized = serialize(value)
        const empty = isEmpty(serialized)

        return empty ? reduction : Object.assign(reduction, {[key]: serialized})
      }, {})
    },

    assoc(name, value) {
      map.set(name, (map[name] = value))
      return map
    },
  })
}

const ChainableOrderedSet = parent => {
  const set = OrderedSet().asMutable()

  return Object.assign(set, {
    end() {
      return parent || set
    },

    when(condition, whenTruthy = F, whenFalsy = F) {
      if (condition) {
        whenTruthy(set)
      }
      else {
        whenFalsy(set)
      }

      return set
    },

    toConfig() {
      set.reduce((reduction, value) => {
        const serialized = serialize(value)
        const empty = isEmpty(serialized)

        return empty ? reduction : reduction.concat([serialized])
      }, [])
      return set.toJS()
    },
  })
}

function ChainableOrderedMapExt(...args) {
  const mapped = ChainableOrderedMap(...args)
  const {traverse} = require('chain-able')

  // eslint-disable-next-line
  traverse(mapped).forEach(function(x) {
    log.verbose(10).bold(this.key).data(x).echo()
  })
  require('fliplog').quick(mapped)
}

class Eh extends ChainableOrderedMapExt {
  constructor(parent) {
    super(parent, ['eh'])
    console.log(this)
  }
}

const eh = new Eh()
console.log(eh.className)

const chain = ChainableOrderedMap()

const obj = {
  eh: true,
  cow: {
    goes: {
      moo: 1,
    },
  },
}
chain.set('ref', obj)

obj.cow.goes.moo = true

require('fliplog').prettyformat(chain).echo()
