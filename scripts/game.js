const startButton = document.getElementById('start-btn');

startButton.addEventListener('click', (e) => {
  generateGameField(9, 9);
  startButton.remove();
});


const generateGameField = (width, height) => {
  const gameField = document.createElement('table');
  gameField.setAttribute('owner', 'player');
  for (let i = 0; i < height; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < width; j++) {
      const cell = document.createElement('td');
      cell.innerHTML = '&#8203;';
      cell.setAttribute('x', j);
      cell.setAttribute('y', i);
      row.appendChild(cell);
      cell.addEventListener('click', (e) => {
        cell.setAttribute('style', 'background-color: #fff');
      })
    }
    gameField.appendChild(row);
  }
  document.body.appendChild(gameField);
}