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
  PLAYING_TURN1: 2,
  PLAYING_TURN2: 3,
  END: 4,
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
    this.gameStateText = document.getElementById('game-state');
  }
  start = () => {
    this.player1.init();
    this.player2.init();
  };

  nextState = () => {
    if (this.state !== gameState.END) this.state++;
    if (this.state === gameState.POSITIONING_PLAYER2) {
      this.player1.field.hide();
      this.player2.menu.update(this.player2.ships);
      this.gameStateText.innerText = 'Positioning (Player 2)';
    } else if (this.state === gameState.PLAYING_TURN1) {
      this.player2.field.hide();
      this.player1.field.update();
      document.getElementById('rotator').remove();
      this.gameStateText.innerText = 'Playing (1st player turn)';
    }
  };
}

class Field {
  constructor(cssClass, player, width = 9, height = 9) {
    this.width = width;
    this.cssClass = cssClass;
    this.height = height;
    this.player = player;
    this.data = fill2DArray(width, height, {
      state: cellState.EMPTY,
      isPlaced: false,
    });
    this.rotationContainer = document.getElementById('rotator');
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

    const playerMenu = this.player.menu;
    const ship =
      playerMenu.chosenId !== -1
        ? this.player.ships[playerMenu.chosenId]
        : undefined;
    const rotationText = document.getElementById('shp-rot');
    if (ship) {
      rotationText.innerText = ship.isHorizontal ? 'horizontal' : 'vertical';
    }
    for (const row of this.gameTable.rows) {
      for (const cell of row.cells) {
        const position = parsePositionFromCell(cell);
        switch (this.data[position.x][position.y].state) {
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

  hide = () => {
    for (const row of this.gameTable.rows) {
      for (const cell of row.cells) {
        const position = parsePositionFromCell(cell);
        const cellStat = this.data[position.x][position.y].state;
        if (cellStat === cellState.SHIP) {
          cell.removeAttribute('class');
        }
      }
    }
  };

  renderShip = (x, y, state) => {
    const chosenId = this.player.menu.chosenId;
    const ship = this.player.ships[chosenId];
    if (
      chosenId !== -1 &&
      (ship.canBePlaced(this, x, y) ||
        (!this.data[x][y].isPlaced && state === cellState.EMPTY))
    ) {
      if (ship.isHorizontal) {
        for (let i = y; i < y + ship.size; i++) {
          if (this.data[x][i].isPlaced) return;
          this.data[x][i] = { state: state, isPlaced: false };
        }
      } else {
        for (let i = x; i < x + ship.size; i++) {
          if (this.data[i][y].isPlaced) return;
          this.data[i][y] = { state: state, isPlaced: false };
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
    if (
      (this.player.game.state === gameState.POSITIONING_PLAYER1 &&
        this.player.isFirst) ||
      (this.player.game.state === gameState.POSITIONING_PLAYER2 &&
        !this.player.isFirst)
    ) {
      const chosenId = this.player.menu.chosenId;
      const ship = this.player.ships[chosenId];

      const cell = this.gameTable.rows[x].cells[y];
      cell.removeEventListener('mouseleave', this.processCellMouseLeave);
      cell.removeEventListener('mouseenter', this.processCellMouseEnter);

      if (ship.canBePlaced(this, x, y)) {
        ship.place(this, x, y);
        this.player.tryNextState();
      }
      this.player.menu.update(this.player.ships, this.player.game.state);
    }
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

    if (
      (this.player.game.state === gameState.POSITIONING_PLAYER1 &&
        this.player.isFirst) ||
      (this.player.game.state === gameState.POSITIONING_PLAYER2 &&
        !this.player.isFirst)
    ) {
      this.renderShip(position.x, position.y, cellState.EMPTY);
    }
  };
}

class Ship {
  constructor(size, number) {
    this.size = size;
    this.number = number;
    this.isHorizontal = true;
  }

  notTooNearToOthers = (field, x, y) => {
    let borderX = x + 1;
    let borderY = y + 1;

    if (this.isHorizontal) {
      borderY =
        y + this.size === field.width - 1 ? y + this.size + 1 : y + this.size;
    } else {
      borderX =
        x + this.size === field.height - 1 ? x + this.size + 1 : x + this.size;
    }

    const topX = x !== 0 ? x - 1 : 0;
    const topY = y !== 0 ? y - 1 : 0;

    for (let i = topX; i < borderX; i++) {
      for (let j = topY; j < borderY; j++) {
        if (
          field.data[i][j].state === cellState.SHIP &&
          field.data[i][j].isPlaced
        ) {
          return false;
        }
      }
    }
    return true;
  };

  canBePlaced = (field, x, y) =>
    ((this.size + y <= field.width && this.isHorizontal) ||
      (this.size + x <= field.height && !this.isHorizontal)) &&
    this.notTooNearToOthers(field, x, y);

  place = (field, x, y) => {
    if (this.isHorizontal)
      field.data[x].fill(
        { state: cellState.SHIP, isPlaced: true },
        y,
        y + this.size
      );
    else {
      for (let i = x; i < x + this.size; i++) {
        field.data[i][y].state = cellState.SHIP;
        field.data[i][y].isPlaced = true;
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
      menuItem.className = this.isFirst ? 'menu-item' : 'menu-item disabled';
      menuItem.innerText = `${ship.size} (x${ship.number})`;

      menuItem.addEventListener('click', (e) => {
        if (e.target.className === 'menu-item disabled') return;

        const itemIndex = Array.from(this.container.children).indexOf(e.target);
        if (itemIndex === this.chosenId) {
          this.chosenId = -1;
          e.target.className = 'menu-item';
          return;
        }

        const prevCell = this.container.children[this.chosenId];
        if (
          this.chosenId !== -1 &&
          prevCell.className !== 'menu-item disabled'
        ) {
          prevCell.className = 'menu-item';
        }
        this.chosenId = itemIndex;
        e.target.className = 'menu-item chosen';
      });

      this.container.appendChild(menuItem);
    }
  };

  update = (ships) => {
    for (const ship of ships) {
      const index = ships.indexOf(ship);
      const menuItem = this.container.children[index];
      if (ship.number === 0 && index === this.chosenId) {
        menuItem.className = 'menu-item disabled';
        this.chosenId = -1;
      } else if (ship.number !== 0 && index !== this.chosenId) {
        menuItem.className = 'menu-item';
      }
      menuItem.innerText = `${ship.size} (x${ship.number})`;
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

  tryNextState = () => {
    for (const ship of this.ships) {
      if (ship.number !== 0) return;
    }
    console.log('OK');

    this.game.nextState();
  };

  init = () => {
    this.field.create();
    this.menu.create(this.ships);
  };
}

const game = new Game(document, CONFIG);

startButton.addEventListener('click', (e) => {
  game.start();
  document.querySelector('.stats').removeAttribute('style');
  document.getElementById('rotator').removeAttribute('style');
  startButton.remove();
});
