'use strict';

const startButton = document.getElementById('start-btn');

const fill2DArray = (collumns, rows, value) =>
  Array.from({ length: collumns }, () =>
    Array.from({ length: rows }, () => value)
  );

const cellState = {
  EMPTY: 0,
  SHIP: 1,
  AIM_MISS: 3,
  AIM_SHIP: 4,
};

const gameState = {
  POSITIONING: 0,
  PLAYING: 1,
  END: 2
};

const parsePositionFromCell = (cell) => {
  const parsedX = parseInt(cell.getAttribute('x'));
  const parsedY = parseInt(cell.getAttribute('y'));
  return {x: parsedX, y: parsedY};
};

class Game {
  constructor(document) {
    this.htmlDoc = document;
    this.state = gameState.POSITIONING;
    this.player1Field = new Field(this, 'player1Field');
    this.player2Field = new Field(this, 'player2Field');
  }
  start = () => {
    this.player1Field.create();
    this.player2Field.create();
  }
}

class Field {
  constructor(game, cssClass, width = 9, height = 9) {
    this.width = width;
    this.cssClass = cssClass;
    this.height = height;
    this.game = game;
    this.data = fill2DArray(
      width,
      height,
      cellState.EMPTY
    );
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
    container.appendChild(table)
    mainDiv.appendChild(container);
    document.body.appendChild(mainDiv);
  }

  update = () => {
    if (!this.gameTable) throw new Error('Field has not created yet');
    
    for (const row of this.gameTable.rows) {
      for (const cell of row.cells) {
        const position = parsePositionFromCell(cell);
        
      }
    }
  }

  processCellClick = (x, y) => {
    console.table({x, y});
  }

  processCellMouseEnter = (x, y) => {
    console.table({x, y});
  }

  processCellMouseLeave = (x, y) => {
    console.table({x, y});
  }
}

class Ship {
  constructor(size) {
    this.size = size;
    this.position = { x: 0, y: 0 };
    this.isHorizontal = true;
  }

  canBePlaced = (field, x, y) => {

  }

  place = (field, x, y) => {

  }

}

const game = new Game(document);

startButton.addEventListener('click', (e) => {
  game.start();
  startButton.remove();
});
