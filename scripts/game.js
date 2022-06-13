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
    this.player1 = new Player(this, config, 'player1Field');
    this.player2 = new Player(this, config, 'player2Field', false);
    this.shipRotationText = document.getElementById('shp-rot');
  }
  start = () => {
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
    this.rotationContainer = document.querySelector('.stats');
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

        cell.addEventListener('mouseenter', this.processCellMouseEnter);

        cell.addEventListener('mouseleave', this.processCellMouseLeave);

        row.appendChild(cell);
      }
      table.appendChild(row);
    }

    this.gameTable = table;
    container.appendChild(table);
    mainDiv.appendChild(container);
    document.body.appendChild(mainDiv);

    this.rotationContainer.addEventListener('click', (e) => {
      this.rotateShip();
    });
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
      if (ship.isHorizontal) this.data[x].fill(state, y, y + ship.size);
      else {
        for (let i = x; i < x + ship.size; i++) {
          this.data[i][y] = state;
        }
      }
    }

    this.update();
  };

  rotateShip = () => {
    const chosenId = this.player.menu.chosenId;
    const ship = this.player.ships[chosenId];
    console.log(chosenId, ship);
    ship.isHorizontal = !ship.isHorizontal;

    const rotationText = document.getElementById('shp-rot');
    rotationText.innerText = ship.isHorizontal ? 'horizontal' : 'vertical';
    this.clearUnplacedCells();
  };

  processCellClick = (x, y) => {
    const chosenId = this.player.menu.chosenId;
    const ship = this.player.ships[chosenId];
    console.log('rrr');
    
    const cell = this.gameTable.rows[x].cells[y];
    cell.removeEventListener('mouseleave', this.processCellMouseLeave);
    cell.removeEventListener('mouseenter', this.processCellMouseEnter);
    
    ship.place(this, x, y);
    this.player.menu.update(this.player.ships, this.player.game.state);
  };

  processCellMouseEnter = (event) => {
    const position = parsePositionFromCell(event.target);

    if (
      (this.player.game.state === gameState.POSITIONING_PLAYER1 &&
        this.player.isFirst) ||
      (this.player.game.state === gameState.POSITIONING_PLAYER2 &&
        !this.player.isFirst)
    ) {
      this.renderShip(position.x, position.y, cellState.SHIP);
    }
  };

  processCellMouseLeave = (event) => {
    const position = parsePositionFromCell(event.target);

    /*if (
      (this.player.game.state === gameState.POSITIONING_PLAYER1 &&
        this.player.isFirst) ||
      (this.player.game.state === gameState.POSITIONING_PLAYER2 &&
        !this.player.isFirst)
    ) {*/
      this.renderShip(position.x, position.y, cellState.EMPTY);
    //}
  };
}

class Ship {
  constructor(size, number) {
    this.size = size;
    this.number = number;
    this.isHorizontal = true;
  }

  notTooNearToOthers = (field, x, y) => {
    const topX = x === 0 ? x : x - 1;
    const bottomX = !this.isHorizontal ? x + this.size + 1 : x + 1;
    const leftY = y === 0 ? y : y - 1;
    const rightY = this.isHorizontal ? y + this.size + 1 : y + 1 ;
    console.log(topX, bottomX, leftY, rightY);
    for (let i = topX; i <= bottomX; i++) {
      for (let j = leftY; j <= rightY; j++) {
        if (field.data[i][j] === cellState.SHIP)
          return false;
      }
    }

    return true;
  }

  canBePlaced = (field, x, y) =>
    ((this.size + y <= field.width && this.isHorizontal) ||
    (this.size + x <= field.height && !this.isHorizontal)) &&
    (field.data[x][y] !== cellState.SHIP) && this.notTooNearToOthers(field, x, y);

  place = (field, x, y) => {
    //if (!this.canBePlaced) return;
    if (this.isHorizontal) field.data[x].fill(cellState.SHIP, y, y + this.size);
    else {
      for (let i = x; i < x + this.size; i++) {
        data[i] = cellState.SHIP;
      }
    }
    this.number--;
  };
}

class Menu {
  constructor(isFirst = true) {
    this.container = document.createElement('div');
    this.isFirst = isFirst;
    this.container.className = isFirst ? 'ship-menu' : 'ship-menu enemy';
    this.chosenId = -1;
  }

  create = (ships) => {
    document.body.appendChild(this.container);
    for (const ship of ships) {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';
      menuItem.innerText = `${ship.size} (x${ship.number})`;

      menuItem.addEventListener('click', (e) => {
        if (e.target.className === 'menu-item diasbled') return;

        const itemIndex = Array.from(this.container.children).indexOf(e.target);
        if (itemIndex === this.chosenId) {
          this.chosenId = -1;
          e.target.className = 'menu-item';
          return;
        }
        
        const prevCell = this.container.children[this.chosenId];
        if (this.chosenId !== -1 && prevCell.className !== 'menu-item disabled') {
          prevCell.className = 'menu-item';
        }
        this.chosenId = itemIndex;
        e.target.className = 'menu-item chosen';
      });

      this.container.appendChild(menuItem);
    }
  };

  update = (ships, gameState) => {
    for (const ship of ships) {
      const menuItem = this.container.children[ships.indexOf(ship)];
      if (ship.number === 0) {
        menuItem.className = 'menu-item disabled';
      }
      menuItem.innerText = `${ship.size} (${ship.number}x)`;
    }
  };
}

class Player {
  constructor(game, config, fieldCssContainer, first = true) {
    this.ships = [];
    this.field = new Field(fieldCssContainer, this);
    this.menu = new Menu(first);
    this.isFirst = first;
    this.game = game;

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
