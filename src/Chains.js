const Chain = require('chain-able/src')
const isNotEmptyArray = require('chain-able/src/deps/is/notEmptyArray')
const isObjWithKeys = require('chain-able/src/deps/is/objWithKeys')
const {is} = Chain
const {isReal, isArray, toS} = is

module.exports = Chain

/* prettier-ignore */
module.exports.clean = function clean(obj) {
  return Object.keys(obj).reduce(function(acc, key) {
    const val = obj[key]

    // remove empty obj or arr
    if (!isReal(val)) return acc
    // no empty arrays
    else if (isArray(val) && val.length === 0) return acc
    // only pure objects, not regexp etc
    else if (toS(val) === '[object Object]' && Object.keys(val).length === 0) return acc

    acc[key] = val

    return acc
  }, {})
}
