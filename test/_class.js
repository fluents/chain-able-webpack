var Chainable = function Chainable(parent) {
  this.parent = parent
  this.className = this.constructor.name
}

class Eh extends Chainable {
  constructor(parent) {
    super(parent)
    console.log(this)
  }
}

const eh = new Eh()
console.log(eh.className)
