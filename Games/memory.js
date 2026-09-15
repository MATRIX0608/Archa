const heritageBank = [
  ["Taj Mahal","🕌"],["Qutb Minar","🗼"],["Red Fort","🏰"],["Hampi","🛕"],
  ["Ajanta Caves","🪨"],["Ellora Caves","🪨"],["Konark Temple","☀️"],["Sanchi Stupa","☸️"],
  ["Khajuraho","🛕"],["Rani-ki-Vav","💧"],["Nalanda","📚"],["Dholavira","🏺"],
  ["Gateway of India","🏛️"],["Charminar","🕌"],["Mysore Palace","👑"],["India Gate","🏛️"],
  ["Jantar Mantar","🔭"],["Mahabodhi Temple","☸️"],["Fatehpur Sikri","🏰"],["Agra Fort","🏰"],
  ["Pattadakal","🛕"],["Mahabalipuram","🌊"],["Elephanta Caves","🪨"],["Humayun's Tomb","🏛️"],
  ["Chola Temples","🛕"],["Victoria Memorial","🏛️"],["Brihadeeswarar","🛕"],["Gol Gumbaz","🏛️"],
  ["Mehrangarh Fort","🏰"],["Nalanda Mahavihara","📚"]
];

const grid = document.getElementById("memoryGrid");
const movesEl = document.getElementById("moves");
const pairsEl = document.getElementById("pairs");
const scoreEl = document.getElementById("score");
const result = document.getElementById("result");
const finalScore = document.getElementById("finalScore");
let first=null, second=null, lock=false, moves=0, pairs=0, score=0;

function shuffle(a){return [...a].sort(()=>Math.random()-0.5)}
function startGame(){
  first=second=null;lock=false;moves=pairs=score=0;
  result.classList.add("hidden"); grid.innerHTML="";
  const selected=shuffle(heritageBank).slice(0,8);
  const cards=shuffle(selected.flatMap(([name,symbol])=>[
    {name,symbol},{name,symbol}
  ]));
  cards.forEach((card,i)=>{
    const btn=document.createElement("button");
    btn.className="memory-card"; btn.dataset.name=card.name;
    btn.innerHTML=`<div class="card-inner"><div class="card-face card-back">✦</div><div class="card-face card-front"><div><div class="symbol">${card.symbol}</div><div class="card-name">${card.name}</div></div></div></div>`;
    btn.addEventListener("click",()=>flip(btn));
    grid.appendChild(btn);
  });
  update();
}
function flip(card){
  if(lock||card===first||card.classList.contains("matched"))return;
  card.classList.add("flipped");
  if(!first){first=card;return}
  second=card;moves++;update();lock=true;
  if(first.dataset.name===second.dataset.name){
    first.classList.add("matched");second.classList.add("matched");
    pairs++;score+=Math.max(40,120-(moves-pairs)*5);resetTurn();update();
    if(pairs===8)setTimeout(finish,500);
  }else{
    score=Math.max(0,score-5);update();
    setTimeout(()=>{first.classList.remove("flipped");second.classList.remove("flipped");resetTurn()},750);
  }
}
function resetTurn(){first=second=null;lock=false}
function update(){movesEl.textContent=moves;pairsEl.textContent=`${pairs}/8`;scoreEl.textContent=score}
function finish(){finalScore.textContent=score;result.classList.remove("hidden")}
document.getElementById("playAgain").onclick=startGame;
startGame();
