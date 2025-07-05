const homePage = document.getElementById('home-page');
const gameContainer = document.getElementById('game-container');
const grid = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const timerDisplay = document.getElementById('timer');
const gameOverScreen = document.getElementById('game-over');
const gameWonScreen = document.getElementById('game-won');
const soundToggleButton = document.getElementById('sound-toggle');
const bgMusic = document.getElementById('bg-music');
const mergeSound = document.getElementById('merge-sound');
const gameOverSound = document.getElementById('game-over-sound');
let board = [];
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let timer = 30;
let timerInterval;
let hasWon = false;
let isPaused = false;
let isSoundOn = true;

function startGame() {
    homePage.style.display = 'none';
    gameContainer.style.display = 'block';
    initGame();
    if (isSoundOn) bgMusic.play();
}

function toggleSound() {
    isSoundOn = !isSoundOn;
    soundToggleButton.textContent = `Sound ${isSoundOn ? 'On' : 'Off'}`;
    if (isSoundOn) {
        bgMusic.play();
    } else {
        bgMusic.pause();
    }
}

function initGame() {
    board = Array(4).fill().map(() => Array(4).fill(0));
    score = 0;
    timer = 30;
    hasWon = false;
    isPaused = false;
    scoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    timerDisplay.textContent = timer;
    gameOverScreen.style.display = 'none';
    gameWonScreen.style.display = 'none';
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timer--;
            timerDisplay.textContent = timer;
            if (timer <= 0) {
                clearInterval(timerInterval);
                gameOverScreen.style.display = 'flex';
                if (isSoundOn) gameOverSound.play();
                sdk.showBanner();
            }
        }
    }, 1000);
    addTile();
    addTile();
    renderBoard();
    sdk.showBanner();
}

function renderBoard() {
    grid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            if (board[i][j] !== 0) {
                tile.textContent = board[i][j];
                tile.classList.add(`tile-${board[i][j]}`);
            }
            grid.appendChild(tile);
        }
    }
}

function addTile() {
    let empty = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) empty.push({ x: i, y: j });
        }
    }
    if (empty.length > 0) {
        const { x, y } = empty[Math.floor(Math.random() * empty.length)];
        board[x][y] = Math.random() < 0.9 ? 2 : 4;
    }
}

function slide(row) {
    let arr = row.filter(val => val);
    let result = [];
    let merged = false;
    for (let i = 0; i < arr.length; i++) {
        if (i < arr.length - 1 && arr[i] === arr[i + 1]) {
            result.push(arr[i] * 2);
            score += arr[i] * 2;
            if (isSoundOn) mergeSound.play();
            i++;
            merged = true;
        } else {
            result.push(arr[i]);
        }
    }
    while (result.length < 4) result.push(0);
    return { row: result, merged };
}

function moveLeft() {
    let moved = false;
    for (let i = 0; i < 4; i++) {
        const { row, merged } = slide(board[i]);
        if (row.join('') !== board[i].join('') || merged) moved = true;
        board[i] = row;
    }
    return moved;
}

function rotateBoard() {
    let newBoard = Array(4).fill().map(() => Array(4));
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            newBoard[i][j] = board[3 - j][i];
        }
    }
    board = newBoard;
}

function checkGameOver() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) return false;
            if (i < 3 && board[i][j] === board[i + 1][j]) return false;
            if (j < 3 && board[i][j] === board[i][j + 1]) return false;
        }
    }
    return true;
}

function checkWin() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 2048) return true;
        }
    }
    return false;
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
}

function move(direction) {
    if (isPaused || timer <= 0) return;
    let moved = false;
    if (direction === 'left') moved = moveLeft();
    else {
        for (let i = 0; i < { up: 1, right: 2, down: 3 }[direction]; i++) rotateBoard();
        moved = moveLeft();
        for (let i = 0; i < 4 - { up: 1, right: 2, down: 3 }[direction]; i++) rotateBoard();
    }
    if (moved) {
        addTile();
        renderBoard();
        scoreDisplay.textContent = score;
        updateHighScore();
        if (!hasWon && checkWin()) {
            hasWon = true;
            gameWonScreen.style.display = 'flex';
            sdk.showBanner();
        } else if (checkGameOver()) {
            clearInterval(timerInterval);
            gameOverScreen.style.display = 'flex';
            if (isSoundOn) gameOverSound.play();
            sdk.showBanner();
        }
    }
}

function resetGame() {
    initGame();
}

function continueGame() {
    gameWonScreen.style.display = 'none';
}

function pauseGame() {
    isPaused = true;
    if (isSoundOn) bgMusic.pause();
    console.log("Game paused by GameMonetize SDK");
}

function resumeGame() {
    isPaused = false;
    if (isSoundOn) bgMusic.play();
    console.log("Game resumed by GameMonetize SDK");
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': move('up'); break;
        case 'ArrowDown': move('down'); break;
        case 'ArrowLeft': move('left'); break;
        case 'ArrowRight': move('right'); break;
    }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

grid.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

grid.addEventListener('touchend', (e) => {
    if (isPaused || timer <= 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) move('right');
        else if (deltaX < -50) move('left');
    } else {
        if (deltaY > 50) move('down');
        else if (deltaY < -50) move('up');
    }
});