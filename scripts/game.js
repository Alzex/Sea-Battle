'use strict';

import CONFIG from './config.js';

const startButton = document.getElementById('start-btn');

const fill2DArray = (collumns, rows, value) =>
  Array.from({ length: collumns }, () =>
    Array.from({ length: rows }, () => value)
  );

const cellState = {
  EMPTY: 0,
  SHIP: 1,
  AIM_MISS: 2,
  AIM_SHIP: 3,
};

const gameState = {
  POSITIONING_PLAYER1: 0,
  POSITIONING_PLAYER2: 1,
  PLAYING: 2,
  END: 3,
};

const parsePositionFromCell = (cell) => {
  const parsedX = parseInt(cell.getAttribute('x'));
  const parsedY = parseInt(cell.getAttribute('y'));
  return { x: parsedX, y: parsedY };
};

class Game {
  constructor(document, config) {
    this.htmlDoc = document;
    this.state = gameState.POSITIONING_PLAYER1;
    this.player1 = new Player(config, 'player1Field');
    this.player2 = new Player(config, 'player2Field', false);
    this.shipRotationText = document.getElementById('shp-rot');
  }
  start = () => {
    document.body.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR') {
        if (this.state === gameState.POSITIONING_PLAYER1) {
          this.player1.field.rotateShip();
        }
      }
    });
    this.player1.init();
    this.player2.init();
  };

  nextState = () => {
    if (this.state !== gameState.END) this.state++;
  };
}

class Field {
  constructor(cssClass, player, width = 9, height = 9) {
    this.width = width;
    this.cssClass = cssClass;
    this.height = height;
    this.player = player;
    this.data = fill2DArray(width, height, cellState.EMPTY);
  }

  create = () => {
    const mainDiv = document.getElementById('gameFields');
    const container = document.createElement('div');
    const table = document.createElement('table');
    container.className = this.cssClass;
    for (let i = 0; i < this.height; i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < this.width; j++) {
        const cell = document.createElement('td');
        cell.setAttribute('x', i);
        cell.setAttribute('y', j);

        cell.addEventListener('click', (e) => {
          const position = parsePositionFromCell(e.target);
          this.processCellClick(position.x, position.y);
        });

        cell.addEventListener('mouseenter', (e) => {
          const position = parsePositionFromCell(e.target);
          this.processCellMouseEnter(position.x, position.y);
        });

        cell.addEventListener('mouseleave', (e) => {
          const position = parsePositionFromCell(e.target);
          this.processCellMouseLeave(position.x, position.y);
        });

        row.appendChild(cell);
      }
      table.appendChild(row);
    }

    this.gameTable = table;
    container.appendChild(table);
    mainDiv.appendChild(container);
    document.body.appendChild(mainDiv);
  };

  update = () => {
    if (!this.gameTable) throw new Error('Field has not created yet');

    for (const row of this.gameTable.rows) {
      for (const cell of row.cells) {
        const position = parsePositionFromCell(cell);
        switch (this.data[position.x][position.y]) {
          case cellState.SHIP:
            cell.className = 'ship';
            break;
          default:
            cell.removeAttribute('class');
            break;
        }
      }
    }
  };

  renderShip = (x, y, state) => {
    const chosenId = this.player.menu.chosenId;
    const ship = this.player.ships[chosenId];
  
    if (chosenId !== -1 && ship.canBePlaced(this, x, y)) {
      if (ship.isHorizontal)
        this.data[x].fill(state, y, y + ship.size);
      else {
        for (let i = x; i < x + ship.size; i++) {
          this.data[i][y] = state;
        }
      }
    }

    this.update();
  }

  clearUnplacedCells = () => {
    for (const row of this.data) {
      for (const cell of row) {
        if (cell === cellState.SHIP) {
          //TODO!!!
          /*const x = this.data.indexOf(row);
          const y = row.indexOf(cell);
          this.player.ship.find((sh) => (sh.position === {x: x, y: y}) && sh.isPlased);*/
          this.data[this.data.indexOf(row)][row.indexOf(cell)] = cellState.EMPTY;
        }
      }
    }
    this.update();
  }

  rotateShip = () => {
    const chosenId = this.player.menu.chosenId;
    const ship = this.player.ships[chosenId];
    console.log(chosenId, ship);
    ship.isHorizontal = !ship.isHorizontal;

    const rotationText = document.getElementById('shp-rot');
    rotationText.innerText = ship.isHorizontal ? 'horizontal' : 'vertical';
    this.clearUnplacedCells();
  }

  processCellClick = (x, y) => {

  };

  processCellMouseEnter = (x, y) => {
    this.renderShip(x, y, cellState.SHIP);
  };

  processCellMouseLeave = (x, y) => {
    this.renderShip(x, y, cellState.EMPTY);
  };
}

class Ship {
  constructor(size, number) {
    this.size = size;
    this.number = number;
    this.isHorizontal = true;
  }

  canBePlaced = (field, x, y) =>
    (this.size + y <= field.width && this.isHorizontal) ||
    (this.size + x <= field.height && !this.isHorizontal);

  place = (field, x, y) => {
    if (!this.canBePlaced) return;
    if (this.isHorizontal) field.data[x].fill(cellState.SHIP, y, y + this.size);
    else {
      for (let i = x; i < x + this.size; i++) {
        data[i] = cellState.SHIP;
      }
    }
  };
}

class Menu {
  constructor(first = true) {
    this.container = document.createElement('div');
    this.container.className = first ? 'ship-menu' : 'ship-menu enemy';
    this.chosenId = -1;
  }

  create = (ships) => {
    document.body.appendChild(this.container);
    for (const ship of ships) {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';
      menuItem.setAttribute('ship-size', ship.size);
      menuItem.innerText = `${ship.size} (x${ship.number})`;

      menuItem.addEventListener('click', (e) => {
        const itemIndex = Array.from(this.container.children).indexOf(e.target);
        if (itemIndex === this.chosenId) {
          this.chosenId = -1;
          e.target.className = 'menu-item';
          return;
        }
        if (this.chosenId !== -1) {
          this.container.children[this.chosenId].className = 'menu-item';
        }
        this.chosenId = itemIndex;
        e.target.className = 'menu-item chosen';
      });

      this.container.appendChild(menuItem);
    }
  };

  update = (ships) => {
    for (const ship of ships) {
      const menuItem = this.container.children[ships.indexOf(ship)];
      if (ship.number === 0) {
        menuItem.className = 'menu-item disabled';
        menuItem.removeEventListener('click');
      }
      menuItem.innerText = `${ship.size} (${ship.number}x)`;
    }
  };
}

class Player {
  constructor(config, fieldCssContainer, first = true) {
    this.ships = [];
    this.field = new Field(fieldCssContainer, this);
    this.menu = new Menu(first);

    for (const ship of config.ships) {
      this.ships.push(new Ship(ship.size, ship.number));
    }
  }

  init = () => {
    this.field.create();
    this.menu.create(this.ships);
  };
}

const game = new Game(document, CONFIG);

startButton.addEventListener('click', (e) => {
  game.start();
  document.querySelector('.stats').removeAttribute('style');
  startButton.remove();
});
