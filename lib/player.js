let vKeys = require("../config/keys");

class Player {
  constructor(x, y, view, socket, name, src, spr) {
    this.x = x;
    this.y = y;
    (this.width = 0), (this.height = 0), (this.socket = socket);
    this.id = socket.id;
    this.state = "idle";
    this.lastState = "idle";
    this.width = 0;
    this.height = 0;
    this.index = 0;
    this.frameCount = 0;
    this.hp = 100;
    this.dir = 0;
    this.view = view;
    this.speed = 3;
    this.pressCount = 0;
    this.keys = {};
    this.key = vKeys;
    this.size = 0;
    this.hit = false;
    this.block = false;
    this.name = name;
    this.src = src;
    this.spr = spr;
    this.frameParametr = {};
  }

  keyDown(keyCode) {
    if (this.block) return;

    if (keyCode == this.key.RIGHT) {
      //right
      this.state = "walk";
      this.dir = 1;
    } else if (keyCode == this.key.LEFT) {
      //left
      this.state = "walk";
      this.dir = -1;
    } else if (keyCode == this.key.UP) {
      //up
      this.state = "jump";
    } else if (keyCode == this.key.DOWN) {
      //down
      if (this.keys[this.key.BLOCK1] || this.keys[this.key.BLOCK2]) {
        this.state = "lowBlock";
      } else {
        this.state = "sitDown";
      }
    } else if (keyCode == this.key.BLOCK1 || keyCode == this.key.BLOCK2) {
      // block
      if (this.keys[this.key.DOWN]) {
        this.state = "lowBlock";
      } else {
        this.state = "block";
      }
    } else if (keyCode == this.key.HP) {
      //uppercut //highPunch
      this.block = true;
      if (this.keys[this.key.DOWN]) {
        this.state = "uppercut";
      } else {
        this.state = "highPunch";
      }
    } else if (keyCode == this.key.LP) {
      //uppercut //middlePunch
      this.block = true;
      if (this.keys[this.key.DOWN]) {
        this.state = "uppercut";
      } else {
        this.state = "middlePunch";
      }
    } else if (keyCode == this.key.HK) {
      //upwardKick //roundHouse //highKick
      this.block = true;
      if (this.keys[this.key.DOWN]) {
        this.state = "upwardKick";
      } else if (this.view == -1 && this.dir == 1) {
        this.state = "roundHouse";
      } else if (this.view == 1 && this.dir == -1) {
        this.state = "roundHouse";
      } else {
        this.state = "highKick";
      }
    } else if (keyCode == this.key.LK) {
      //footSweep //middleKick
      this.block = true;
      if (this.view == -1 && this.dir == 1) {
        this.state = "footSweep";
      } else if (this.view == 1 && this.dir == -1) {
        this.state = "footSweep";
      } else {
        this.state = "middleKick";
      }
    }
    this.size = Object.keys(this.keys).length;
  }
  keyUp(keyCode) {
    if (this.block) return;
    let count = 0;

    if (keyCode == this.key.DOWN) {
      if (this.keys[this.key.BLOCK1] || this.keys[this.key.BLOCK2]) {
        this.state = "block";
      } else {
        this.state = "idle";
      }
    } else if (keyCode == this.key.BLOCK1 || keyCode == this.key.BLOCK2) {
      if (this.keys[this.key.DOWN]) {
        this.state = "sitDown";
      } else {
        this.state = "idle";
      }
    } else if (this.keys[this.key.UP]) {
      this.state = "idle";
    }

    if (this.block) return;
    for (let k in this.keys) {
      if (this.keys[k] == false) {
        count++;
      }
      if (count == this.size) {
        this.state = "idle";
        this.dir = 0;
      }
    }
  }
  checkPress() {
    if (this.pressed[this.key.HP]) {
      delete this.pressed[this.key.LP];
    } else if (this.pressed[this.key.LP]) {
      delete this.pressed[this.key.HP];
    } else if (this.pressed[this.key.HK]) {
      delete this.pressed[this.key.LK];
    } else if (this.pressed[this.key.LK]) {
      delete this.pressed[this.key.HK];
    }
  }
  toObject() {
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height,
      hp: this.hp,
      state: this.state,
      view: this.view,
      name: this.name,
      fp: this.frameParametr
    };
  }
  move() {
    if (this.state == "walk") {
      this.x += this.dir * this.speed;
    }
  }
}

class Scorpion extends Player {
  constructor(x, y, view, socket, name, src, spr) {
    super(x, y, view, socket, name, src, spr);
  }
}

class Sub_Zero extends Player {
  constructor(x, y, view, socket, name, src, spr) {
    super(x, y, view, socket, name, src, spr);
  }
}

module.exports = { Scorpion, Sub_Zero };