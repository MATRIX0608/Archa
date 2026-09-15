// =====================================================
// HERITAGE WORD SEARCH
// =====================================================

const BANK = [
  "TajMahal",
  "QutbMinar",
  "RedFort",
  "Hampi",
  "Ajanta",
  "Ellora",
  "Konark",
  "Sanchi",
  "Khajuraho",
  "RaniVav",
  "Nalanda",
  "Dholavira",
  "Charminar",
  "MysorePalace",
  "JantarMantar",
  "Mahabodhi",
  "FatehpurSikri",
  "AgraFort",
  "Pattadakal",
  "Mahabalipuram",
  "Elephanta",
  "HumayunTomb",
  "CholaTemples",
  "GolGumbaz",
  "Mehrangarh",
  "GatewayIndia",
  "IndiaGate",
  "Sarnath",
  "Bhimbetka",
  "Harappa",
  "Lothal",
  "Mughal",
  "Maurya",
  "Gupta",
  "Vijayanagara",
  "Rajput",
  "Ajmer",
  "Bharatanatyam",
  "Kathak",
  "Bihu",
  "Garba",
  "Ghoomar",
  "Yakshagana",
  "Pattachitra",
  "Madhubani",
  "Warli",
  "Kalamkari",
  "Banarasi",
  "Chikankari",
  "Phulkari",
  "Kanchipuram",
  "Dhokra",
  "BluePottery",
  "Pashmina",
  "Channapatna",
  "Bidri"
];

const SIZE = 15;

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [-1, -1]
];


// =====================================================
// VARIABLES
// =====================================================

let grid = [];
let placements = [];
let selected = [];
let found = new Set();

let score = 0;
let seconds = 0;
let timer = null;
let startCell = null;


// =====================================================
// ELEMENTS
// =====================================================

const gridEl = document.getElementById("grid");
const wordsEl = document.getElementById("words");
const foundEl = document.getElementById("found");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");

const resultEl = document.getElementById("result");
const resultTextEl = document.getElementById("resultText");

const newRoundBtn = document.getElementById("newRound");
const againBtn = document.getElementById("again");


// =====================================================
// CHECK HTML
// =====================================================

if (!gridEl) {
  console.error("Word Search error: #grid not found.");
}


// =====================================================
// SHUFFLE
// =====================================================

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}


// =====================================================
// FORMAT WORD
// =====================================================

function prettyWord(word) {

  const names = {
    TajMahal: "Taj Mahal",
    QutbMinar: "Qutb Minar",
    RedFort: "Red Fort",
    RaniVav: "Rani ki Vav",
    MysorePalace: "Mysore Palace",
    JantarMantar: "Jantar Mantar",
    Mahabodhi: "Mahabodhi",
    FatehpurSikri: "Fatehpur Sikri",
    AgraFort: "Agra Fort",
    Mahabalipuram: "Mahabalipuram",
    HumayunTomb: "Humayun's Tomb",
    CholaTemples: "Chola Temples",
    GolGumbaz: "Gol Gumbaz",
    GatewayIndia: "Gateway of India",
    IndiaGate: "India Gate",
    BluePottery: "Blue Pottery",
    Bharatanatyam: "Bharatanatyam",
    Vijayanagara: "Vijayanagara",
    Pattachitra: "Pattachitra",
    Madhubani: "Madhubani",
    Kanchipuram: "Kanchipuram",
    Channapatna: "Channapatna"
  };

  return names[word] || word.replace(/([a-z])([A-Z])/g, "$1 $2");
}


// =====================================================
// CREATE EMPTY GRID
// =====================================================

function createGrid() {

  grid = Array.from(
    { length: SIZE },
    () => Array(SIZE).fill("")
  );

  placements = [];
}


// =====================================================
// PLACE WORD
// =====================================================

function placeWord(word) {

  if (word.length > SIZE) {
    return false;
  }

  for (let attempt = 0; attempt < 1000; attempt++) {

    const row =
      Math.floor(Math.random() * SIZE);

    const col =
      Math.floor(Math.random() * SIZE);

    const direction =
      DIRECTIONS[
        Math.floor(Math.random() * DIRECTIONS.length)
      ];

    const cells = [];

    let possible = true;

    for (let i = 0; i < word.length; i++) {

      const r = row + direction[0] * i;
      const c = col + direction[1] * i;

      if (
        r < 0 ||
        r >= SIZE ||
        c < 0 ||
        c >= SIZE
      ) {
        possible = false;
        break;
      }

      if (
        grid[r][c] !== "" &&
        grid[r][c] !== word[i]
      ) {
        possible = false;
        break;
      }

      cells.push([r, c]);
    }

    if (!possible) continue;

    cells.forEach(([r, c], i) => {
      grid[r][c] = word[i];
    });

    placements.push({
      word: word,
      cells: cells
    });

    return true;
  }

  return false;
}


// =====================================================
// FILL EMPTY CELLS
// =====================================================

function fillGrid() {

  for (let r = 0; r < SIZE; r++) {

    for (let c = 0; c < SIZE; c++) {

      if (!grid[r][c]) {

        grid[r][c] =
          String.fromCharCode(
            65 + Math.floor(Math.random() * 26)
          );
      }
    }
  }
}


// =====================================================
// RENDER GRID
// =====================================================

function renderGrid() {

  gridEl.innerHTML = "";

  for (let r = 0; r < SIZE; r++) {

    for (let c = 0; c < SIZE; c++) {

      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "cell";

      button.textContent = grid[r][c];

      button.dataset.row = r;
      button.dataset.col = c;

      button.addEventListener(
        "pointerdown",
        () => startSelection(r, c)
      );

      gridEl.appendChild(button);
    }
  }
}


// =====================================================
// RENDER WORD LIST
// =====================================================

function renderWords(words) {

  wordsEl.innerHTML = "";

  words.forEach(word => {

    const span =
      document.createElement("span");

    span.className = "word";

    span.dataset.word = word;

    span.textContent = prettyWord(word);

    wordsEl.appendChild(span);
  });
}


// =====================================================
// START SELECTION
// =====================================================

function startSelection(row, col) {

  startCell = [row, col];

  selected = [[row, col]];

  paintSelection();
}


// =====================================================
// POINTER MOVE
// =====================================================

gridEl.addEventListener("pointerover", event => {

  if (!startCell) return;

  const cell = event.target;

  if (!cell.classList.contains("cell")) {
    return;
  }

  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  const rowDiff = row - startCell[0];
  const colDiff = col - startCell[1];

  const distance =
    Math.max(
      Math.abs(rowDiff),
      Math.abs(colDiff)
    );

  const rowStep =
    rowDiff === 0 ? 0 : rowDiff > 0 ? 1 : -1;

  const colStep =
    colDiff === 0 ? 0 : colDiff > 0 ? 1 : -1;

  selected = [];

  for (let i = 0; i <= distance; i++) {

    selected.push([
      startCell[0] + rowStep * i,
      startCell[1] + colStep * i
    ]);
  }

  paintSelection();
});


// =====================================================
// POINTER UP
// =====================================================

window.addEventListener(
  "pointerup",
  finishSelection
);


// =====================================================
// PAINT SELECTION
// =====================================================

function paintSelection() {

  clearSelection();

  selected.forEach(([row, col]) => {

    const cell =
      getCell(row, col);

    if (cell) {
      cell.classList.add("selected");
    }
  });
}


// =====================================================
// CLEAR SELECTION
// =====================================================

function clearSelection() {

  gridEl
    .querySelectorAll(".cell.selected")
    .forEach(cell => {
      cell.classList.remove("selected");
    });
}


// =====================================================
// GET CELL
// =====================================================

function getCell(row, col) {

  return gridEl.querySelector(
    `.cell[data-row="${row}"][data-col="${col}"]`
  );
}


// =====================================================
// FINISH SELECTION
// =====================================================

function finishSelection() {

  if (!startCell) {
    return;
  }

  const selectedWord =
    selected
      .map(([row, col]) => grid[row][col])
      .join("");

  const reversed =
    selectedWord
      .split("")
      .reverse()
      .join("");

  const match =
    placements.find(item => {

      return (
        !found.has(item.word) &&
        (
          item.word === selectedWord ||
          item.word === reversed
        )
      );

    });


  if (match) {

    found.add(match.word);

    match.cells.forEach(([row, col]) => {

      const cell =
        getCell(row, col);

      if (cell) {
        cell.classList.add("found");
      }

    });


    const wordElement =
      document.querySelector(
        `[data-word="${match.word}"]`
      );

    if (wordElement) {
      wordElement.classList.add("done");
    }


    score += 100;

    updateStats();


    if (found.size === 8) {
      finishGame();
    }
  }


  startCell = null;
  selected = [];

  clearSelection();
}


// =====================================================
// UPDATE STATS
// =====================================================

function updateStats() {

  foundEl.textContent =
    `${found.size}/8`;

  const currentScore =
    Math.max(
      0,
      score - Math.floor(seconds / 10) * 2
    );

  scoreEl.textContent =
    currentScore;

  timeEl.textContent =
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}


// =====================================================
// START NEW ROUND
// =====================================================

function newRound() {

  clearInterval(timer);

  seconds = 0;
  score = 0;

  found = new Set();

  selected = [];
  startCell = null;

  createGrid();


  // Pick 8 random words
  const words =
    shuffle(
      BANK.filter(word => word.length <= SIZE)
    ).slice(0, 8);


  // Place words
  words.forEach(word => {
    placeWord(word.toUpperCase());
  });


  fillGrid();

  renderGrid();

  renderWords(
    placements.map(item => item.word)
  );

  updateStats();


  resultEl.classList.add("hidden");


  timer =
    setInterval(() => {

      seconds++;

      updateStats();

    }, 1000);
}


// =====================================================
// FINISH GAME
// =====================================================

function finishGame() {

  clearInterval(timer);

  const finalScore =
    Math.max(
      0,
      score - Math.floor(seconds / 10) * 2
    );

  score = finalScore;

  scoreEl.textContent = finalScore;

  resultTextEl.textContent =
    `You found all 8 words in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}. Final score: ${finalScore}.`;

  resultEl.classList.remove("hidden");
}


// =====================================================
// BUTTONS
// =====================================================

if (newRoundBtn) {
  newRoundBtn.addEventListener(
    "click",
    newRound
  );
}

if (againBtn) {
  againBtn.addEventListener(
    "click",
    newRound
  );
}


// =====================================================
// START
// =====================================================

newRound();