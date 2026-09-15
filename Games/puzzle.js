// =====================================================
// MONUMENT PUZZLE
// =====================================================

const monuments = [
  {
    name: "Taj Mahal",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "India Gate",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Red Fort",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Hawa Mahal",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=80"
  },
  {
    name: "Qutb Minar",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80"
  }
];

const puzzle = document.getElementById("puzzle");
const monumentEl = document.getElementById("monument");
const movesEl = document.getElementById("moves");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

const shuffleBtn = document.getElementById("shuffle");
const newPuzzleBtn = document.getElementById("newPuzzle");

let tiles = [];
let selected = null;
let moves = 0;
let score = 1000;
let currentMonument = null;


// =====================================================
// SHUFFLE
// =====================================================

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}


// =====================================================
// NEW PUZZLE
// =====================================================

function newPuzzle() {

  currentMonument =
    monuments[Math.floor(Math.random() * monuments.length)];

  monumentEl.textContent = currentMonument.name;

  moves = 0;
  score = 1000;
  selected = null;

  movesEl.textContent = moves;
  scoreEl.textContent = score;

  messageEl.textContent =
    "Click two tiles to swap them.";

  createPuzzle();
}


// =====================================================
// CREATE 4 × 4 PUZZLE
// =====================================================

function createPuzzle() {

  puzzle.innerHTML = "";

  tiles = [];

  const correctOrder = [];

  for (let i = 0; i < 16; i++) {
    correctOrder.push(i);
  }

  tiles = shuffle(correctOrder);

  tiles.forEach((tileNumber, position) => {

    const tile = document.createElement("button");

    tile.className = "tile";

    tile.dataset.position = position;

    tile.dataset.correct = tileNumber;

    // IMPORTANT:
    // This is what actually displays the image.
    tile.style.backgroundImage =
      `url("${currentMonument.image}")`;

    tile.style.backgroundSize = "400% 400%";

    const row = Math.floor(tileNumber / 4);
    const col = tileNumber % 4;

    tile.style.backgroundPosition =
      `${col * 33.3333}% ${row * 33.3333}%`;

    tile.addEventListener("click", () => selectTile(tile));

    puzzle.appendChild(tile);
  });

  updatePuzzle();
}


// =====================================================
// SELECT TILE
// =====================================================

function selectTile(tile) {

  if (selected === tile) {
    tile.classList.remove("selected");
    selected = null;
    return;
  }

  if (!selected) {

    selected = tile;

    tile.classList.add("selected");

    return;
  }

  swapTiles(selected, tile);

  selected.classList.remove("selected");

  selected = null;

  moves++;

  score = Math.max(0, score - 10);

  movesEl.textContent = moves;
  scoreEl.textContent = score;

  updatePuzzle();

  checkWin();
}


// =====================================================
// SWAP
// =====================================================

function swapTiles(a, b) {

  const aCorrect = a.dataset.correct;
  const bCorrect = b.dataset.correct;

  a.dataset.correct = bCorrect;
  b.dataset.correct = aCorrect;

  updateTileImage(a);
  updateTileImage(b);
}


// =====================================================
// UPDATE TILE IMAGE
// =====================================================

function updateTileImage(tile) {

  const tileNumber =
    Number(tile.dataset.correct);

  const row =
    Math.floor(tileNumber / 4);

  const col =
    tileNumber % 4;

  tile.style.backgroundImage =
    `url("${currentMonument.image}")`;

  tile.style.backgroundSize =
    "400% 400%";

  tile.style.backgroundPosition =
    `${col * 33.3333}% ${row * 33.3333}%`;
}


// =====================================================
// UPDATE PUZZLE
// =====================================================

function updatePuzzle() {

  document
    .querySelectorAll(".tile")
    .forEach(tile => {

      updateTileImage(tile);

    });
}


// =====================================================
// CHECK WIN
// =====================================================

function checkWin() {

  const allTiles =
    [...document.querySelectorAll(".tile")];

  const solved =
    allTiles.every((tile, index) => {

      return Number(tile.dataset.correct) === index;

    });

  if (!solved) return;

  score += 250;

  scoreEl.textContent = score;

  messageEl.textContent =
    "🎉 Puzzle complete! Excellent work.";

  allTiles.forEach(tile => {

    tile.disabled = true;

  });
}


// =====================================================
// SHUFFLE CURRENT PUZZLE
// =====================================================

shuffleBtn.addEventListener("click", () => {

  tiles = shuffle(
    [...document.querySelectorAll(".tile")]
      .map(tile => Number(tile.dataset.correct))
  );

  document
    .querySelectorAll(".tile")
    .forEach((tile, index) => {

      tile.dataset.correct = tiles[index];

      updateTileImage(tile);

    });

  selected = null;

  document
    .querySelectorAll(".tile")
    .forEach(tile =>
      tile.classList.remove("selected")
    );

  messageEl.textContent =
    "Puzzle shuffled.";

});


// =====================================================
// NEW PUZZLE BUTTON
// =====================================================

newPuzzleBtn.addEventListener(
  "click",
  newPuzzle
);


// =====================================================
// START
// =====================================================

newPuzzle();