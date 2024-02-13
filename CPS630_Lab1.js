let playerGrid; 
let pcGrid;
let isPlayerTurn = true; 
let playerHits = 0;
let playerMisses = 0;
let pcHits = 0;
let pcMisses = 0;
let hitSound = document.getElementById('hit-sound');
let missSound = document.getElementById('miss-sound');

document.addEventListener('DOMContentLoaded', () => {
    gameAlertIntro("Welcome to Battleship! Please place your 6 ships on the grid to start the game.")
    const userBoard = document.getElementById('user-board');
    const pcBoard = document.getElementById('pc-board');

    playerGrid = createGrid(userBoard, 'player');
    pcGrid = createGrid(pcBoard, 'pc'); 
    
     placeShipsRandomly(pcGrid, 6);

    const ships = document.querySelectorAll('.ship');
    ships.forEach(ship => {
        ship.addEventListener('dragstart', dragStart);
    });

    let shipsPlaced = 0; 

    playerGrid.forEach(row => {
        row.forEach(cell => {
            cell.addEventListener('dragover', dragOver);
            cell.addEventListener('dragenter', dragEnter);
            cell.addEventListener('dragleave', dragLeave);
            cell.addEventListener('drop', drop);
        });
    });

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
        this.classList.add('hovered');
    }

    function dragLeave() {
        this.classList.remove('hovered');
    }

    function drop(e) {
        e.preventDefault();
        const shipId = e.dataTransfer.getData('text/plain');
        const ship = document.getElementById(shipId);
        const position = getCellPosition(e);
        const row = position.row;
        const col = position.col;
    
        // Check if the drop is within the bounds of the grid
        if (row < 10 && col < 10 && !ship.classList.contains('placed')) {
            // Check if the cell where the ship will be placed is empty
            if (!playerGrid[row][col].classList.contains('ship')) {
                playerGrid[row][col].appendChild(ship);
                ship.classList.add('ship', 'placed');
                playerGrid[row][col].classList.add('ship'); // Add ship class to the cell
                shipsPlaced++; // Increment shipsPlaced counter
    
                if (shipsPlaced === ships.length) { // If all ships are placed
                    startGame(playerGrid, pcGrid); // Start the game
                }
            }
        }
    
        this.classList.remove('hovered');
    }
    
    function getCellPosition(e) {
        const cell = e.target.closest('.cell');
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        return { row, col };
    }

    function createGrid(board, playerClass) {
        const grid = [];
        for (let i = 0; i < 10; i++) {
            const row = [];
            for (let j = 0; j < 10; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', playerClass);
                cell.dataset.row = i;
                cell.dataset.col = j;
                row.push(cell);
                board.appendChild(cell);
            }
            grid.push(row);
        }
        return grid;
    }

    const resetButton = document.getElementById('reset-btn');
    resetButton.addEventListener('click', resetGame);
});

function startGame(playerGrid, pcGrid) {
    pcGrid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            cell.addEventListener('click', () => {
                if (isPlayerTurn && playerHits < 6 && pcHits < 6) { // Check if it's still the player's turn and player hasn't reached 6 hits
                    handlePlayerTurn(rowIndex, colIndex, pcGrid);
                    if (checkEqual() && playerHits < 6) { // Check if either player has won before proceeding to PC's turn
                        isPlayerTurn = true;
                    } else {
                        isPlayerTurn = false;
                        setTimeout(() => {
                            if (pcHits < 6 && playerHits < 6) { // Proceed to PC's turn only if the game is still ongoing
                                handlePCTurn(playerGrid);
                                isPlayerTurn = true;
                            }
                        }, 500);
                    }
                } else if (!isPlayerTurn && pcHits < 6 && playerHits < 6) { // Check if it's the PC's turn and PC hasn't reached 6 hits
                    handlePCTurn(playerGrid);
                    if (checkEqual() && pcHits < 6) { // Check if either player has won before proceeding to player's turn
                        isPlayerTurn = false;
                    } else {
                        isPlayerTurn = true;
                    }
                }
            });
        });
    });
}

function handlePlayerTurn(row, col, pcGrid) {
    const cell = pcGrid[row][col];
    const hasHiddenShip = cell.classList.contains('hidden-ship');
    const hasVisited = cell.classList.contains('visited');

    if (hasVisited) {
        gameAlert("This location has already been bombed. Please select another.")
        return;
    }

    if (hasHiddenShip) {
        cell.classList.add('hit');
        playerHits++;
        updateHitMissCounters();
        hitSound.play(); // Play hit sound
        if (playerHits === 6) {
            gameAlertWin("Player wins! Press restart to play again.");
            disableAllClickEvents(pcGrid);
            disableAllClickEvents(playerGrid);
            return;
        }
    } else {
        cell.classList.add('miss');
        playerMisses++;
        updateHitMissCounters();
        missSound.play(); // Play miss sound
    }

    cell.classList.add('visited');
    isPlayerMoveMade = true;
}



function handlePCTurn(playerGrid) {
    let isHit = false;
    let randomRow, randomCol;
    do {
        randomRow = Math.floor(Math.random() * 10);
        randomCol = Math.floor(Math.random() * 10);
        const cell = playerGrid[randomRow][randomCol];
        isHit = cell.classList.contains('ship') && !cell.classList.contains('hit') && !cell.classList.contains('miss');
    } while (!isHit && playerGrid[randomRow][randomCol].classList.contains('visited'));

    const cell = playerGrid[randomRow][randomCol];

    if (isHit) {
        cell.classList.add('hit');
        pcHits++;
        updateHitMissCounters();
        hitSound.play(); // Play hit sound

        if (pcHits === 6) {
            gameAlertWin("PC wins! Press restart to play again.");
            disableAllClickEvents(pcGrid);
            disableAllClickEvents(playerGrid);
            return; 
        }
    } else {
        cell.classList.add('miss');
        pcMisses++;
        updateHitMissCounters();
        missSound.play(); // Play miss sound
    }

    cell.classList.add('visited');
}



function checkAllHiddenShipsFound(pcGrid) {
    for (let row of pcGrid) {
        for (let cell of row) {
            if (cell.classList.contains('hidden-ship') && !cell.classList.contains('hit')) {
                return false; // There is still an unsunk hidden ship
            }
        }
    }
    return true; // All hidden ships have been found
}

function checkAllPlayerShipsSunk(playerGrid) {
    for (let row of playerGrid) {
        for (let cell of row) {
            if (cell.classList.contains('ship') && !cell.classList.contains('hit')) {
                return false; 
            }
        }
    }
    return true;
}

function checkEqual() {
    return playerHits + playerMisses === pcHits + pcMisses;
}

function placeShipsRandomly(grid, numberOfShips) {
    for (let i = 0; i < numberOfShips; i++) {
        let randomRow, randomCol;
        do {
            randomRow = Math.floor(Math.random() * 10);
            randomCol = Math.floor(Math.random() * 10);
        } while (grid[randomRow][randomCol].classList.contains('ship') || grid[randomRow][randomCol].classList.contains('hidden-ship'));
        grid[randomRow][randomCol].classList.add('hidden-ship');
    }
}

function disableAllClickEvents(grid) {
    grid.forEach((row) => {
        row.forEach((cell) => {
            cell.removeEventListener('click', handlePlayerTurn);
        });
    });
}


function updateHitMissCounters() {
    const playerHitsElement = document.getElementById('player-hits');
    const playerMissesElement = document.getElementById('player-misses');
    const pcHitsElement = document.getElementById('pc-hits');
    const pcMissesElement = document.getElementById('pc-misses');

    playerHitsElement.textContent = `Player Hits: ${playerHits}`;
    playerMissesElement.textContent = `Player Misses: ${playerMisses}`;
    pcHitsElement.textContent = `PC Hits: ${pcHits}`;
    pcMissesElement.textContent = `PC Misses: ${pcMisses}`;
}

function gameAlertIntro(message) {
    const alertContainer = document.createElement('div');
    alertContainer.classList.add('alert');
    alertContainer.textContent = message;
    document.body.appendChild(alertContainer);

    setTimeout(() => {
        alertContainer.remove();
    }, 5000); // Remove the alert after 3 seconds
}

function gameAlertWin(message) {
    const alertContainer = document.createElement('div');
    alertContainer.classList.add('alert');
    alertContainer.textContent = message;
    document.body.appendChild(alertContainer);

    setTimeout(() => {
        alertContainer.remove();
    }, 4000); // Remove the alert after 3 seconds
}

function gameAlert(message) {
    const alertContainer = document.createElement('div');
    alertContainer.classList.add('alert');
    alertContainer.textContent = message;
    document.body.appendChild(alertContainer);

    setTimeout(() => {
        alertContainer.remove();
    }, 2000); // Remove the alert after 3 seconds
}


function resetGame() {
    isPlayerTurn = true;
    playerHits = 0;
    playerMisses = 0;
    pcHits = 0;
    pcMisses = 0;

    clearGrid(playerGrid);
    clearGrid(pcGrid);

    shipsPlaced = 0;

    const ships = document.querySelectorAll('.ship');
    ships.forEach(ship => {
        ship.classList.remove('placed');
        ship.style.transform = ''; // Reset ship transform property
        ship.style.top = '0'; // Reset ship position if it's being dragged
        ship.style.left = '0';
    });

    // Move ships back to their original position on the side
    const shipsContainer = document.querySelector('.ships-container');
    ships.forEach(ship => {
        shipsContainer.appendChild(ship);
    });

    placeShipsRandomly(pcGrid, 6);

    // Reset hit/miss counters
    updateHitMissCounters();

    if (checkEqual){
        isPlayerTurn = true;
    }

    gameAlertIntro("The game has restarted! Please place your 6 ships on the grid to start.")

}

function clearGrid(grid) {
    grid.forEach(row => {
        row.forEach(cell => {
            cell.classList.remove('ship', 'hidden-ship', 'hit', 'miss', 'visited');
        });
    });
}

