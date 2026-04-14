// 🌍 GLOBALT
let playerId, playerName, roomCode, roomRef;

const db = firebase.database();

// 🎴 KORT
const riskTiles = [7,22,36];
const shotTiles = [2,17,33];

// 🏠 EIENDOMMER (eksempel – du kan fylle flere)
const properties = {
  1:{name:"Sentrumsgata",price:100,rent:20,color:"brown"},
  3:{name:"Brugata",price:120,rent:25,color:"brown"},
  6:{name:"Svandalsvegen",price:140,rent:30,color:"lightblue"},
  8:{name:"Fjordgata",price:160,rent:35,color:"lightblue"},
  9:{name:"Sjøenveien",price:180,rent:40,color:"lightblue"},
  37:{name:"Rådhusgata",price:500,rent:150,color:"darkblue"},
  39:{name:"Fabrikkvegen",price:600,rent:200,color:"darkblue"}
};

// 🔑 GENERER ROMKODE
function generateCode(){
  return Math.random().toString(36).substr(2,4).toUpperCase();
}

// 🏠 LAG ROM
function createRoom(){
  playerName = document.getElementById("name").value;
  roomCode = generateCode();

  roomRef = db.ref("rooms/" + roomCode);

  alert("Romkode: " + roomCode);

  roomRef.set({
    host:null,
    players:{},
    started:false
  });

  joinRoomInternal();
}

// 🚪 JOIN ROM
function joinRoom(){
  playerName = document.getElementById("name").value;
  roomCode = document.getElementById("roomCode").value.toUpperCase();

  roomRef = db.ref("rooms/" + roomCode);

  joinRoomInternal();
}

// 🎮 FELLES JOIN
function joinRoomInternal(){
  playerId = "p" + Math.random().toString(36).substr(2,5);

  localStorage.setItem("playerId", playerId);
  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("playerName", playerName);

  roomRef.child("players/"+playerId).set({
    name:playerName,
    pos:0,
    money:1500,
    owned:[]
  });

  roomRef.once("value", snap=>{
    const data = snap.val() || {};

    if(!data.host){
      roomRef.child("host").set(playerId);
    }

    if(!data.turn){
      roomRef.child("turn").set(playerId);
    }
  });

  document.getElementById("startScreen").style.display="none";

  listenRoom();
}

// 👀 LYTTE
function listenRoom(){
  roomRef.on("value", snap=>{
    const data = snap.val();
    if(!data) return;

    if(!data.started){
      document.getElementById("lobby").style.display="block";
      document.getElementById("game").style.display="none";
      updateLobby(data);
    } else {
      document.getElementById("lobby").style.display="none";
      document.getElementById("game").style.display="block";
      drawBoard(data);
    }

    renderPlayers(data);

    document.getElementById("turnInfo").innerText =
      data.turn === playerId ? "🎯 DIN TUR" : "⏳ Vent...";
  });
}

// 🏠 LOBBY
function updateLobby(data){
  document.getElementById("players").innerHTML =
    Object.entries(data.players||{}).map(([id,p])=>
      `👤 ${p.name} ${id===data.host ? "👑" : ""}`
    ).join("<br>");
}

// 🚀 START SPILL
function startGame(){
  roomRef.once("value", snap=>{
    const data = snap.val();

    if(data.host !== playerId){
      alert("Kun host kan starte!");
      return;
    }

    roomRef.child("started").set(true);
  });
}

// 🎲 TERNNING
function rollDice(){
  roomRef.once("value", snap=>{
    const data = snap.val();

    if(data.turn !== playerId){
      alert("Ikke din tur!");
      return;
    }

    let p = data.players[playerId];

    let roll = Math.floor(Math.random()*6)+1;
    p.pos = (p.pos + roll) % 40;

    handleTile(p, data);

    roomRef.child("players/"+playerId).set(p);

    nextTurn(data);
  });
}

// 🧱 HÅNDTER RUTE
function handleTile(p,data){

  if(p.pos === 4) p.money -= 200;
  if(p.pos === 38) p.money -= 100;

  if(riskTiles.includes(p.pos)) drawRisk(p);
  if(shotTiles.includes(p.pos)) drawShot(p);

  if(properties[p.pos]){
    const owner = findOwner(p.pos,data);

    if(owner && owner !== playerId){
      let rent = properties[p.pos].rent;
      p.money -= rent;
      data.players[owner].money += rent;
    } else if(!owner){
      if(confirm("Kjøp "+properties[p.pos].name+"?")){
        if(p.money >= properties[p.pos].price){
          p.money -= properties[p.pos].price;
          p.owned.push(p.pos);
        }
      }
    }
  }

  checkBankruptcy(playerId,data);
}

// 🎴 KORT
function drawRisk(p){
  let cards=[
    ()=>p.money+=200,
    ()=>p.money-=150,
    ()=>p.pos=10
  ];
  cards[Math.floor(Math.random()*cards.length)]();
}

function drawShot(p){
  let cards=[
    ()=>p.money+=100,
    ()=>p.money+=50
  ];
  cards[Math.floor(Math.random()*cards.length)]();
}

// 👑 FINN OWNER
function findOwner(tile,data){
  for(let id in data.players){
    if(data.players[id].owned.includes(tile)) return id;
  }
}

// 🏆 KONKURS
function checkBankruptcy(id,data){
  if(data.players[id].money < 0){
    delete data.players[id];
    roomRef.set(data);
  }
}

// 🔄 NESTE TUR
function nextTurn(data){
  const ids = Object.keys(data.players);
  let i = ids.indexOf(data.turn);
  roomRef.child("turn").set(ids[(i+1)%ids.length]);
}

// 🎨 BRETT
function drawBoard(data){
  const b = document.getElementById("board");
  b.innerHTML = "";

  for(let i=0;i<40;i++){
    let d = document.createElement("div");
    d.className="tile";

    if(properties[i]){
      d.innerText = properties[i].name;
      d.classList.add(properties[i].color);
    } else {
      d.innerText = i;
    }

    Object.values(data.players).forEach(p=>{
      if(p.pos === i){
        let token = document.createElement("div");
        token.className="token";
        token.style.background="red";
        d.appendChild(token);
      }
    });

    b.appendChild(d);
  }
}

// 🧍 SPILLER PANEL
function renderPlayers(data){
  document.getElementById("playerPanel").innerHTML =
    Object.values(data.players||{}).map(p=>`
      <div class="playerCard">
        ${p.name}<br>
        💰 ${p.money} kr
      </div>
    `).join("");
}

// 💬 CHAT
function sendMessage(){
  const text = document.getElementById("chatInput").value;

  roomRef.child("chat").push({
    name: playerName,
    text: text
  });

  document.getElementById("chatInput").value="";
}

roomRef?.child("chat").on("child_added", snap=>{
  const msg = snap.val();

  const div = document.createElement("div");
  div.innerText = msg.name + ": " + msg.text;

  document.getElementById("messages").appendChild(div);
});

// 🔄 RECONNECT
window.onload = ()=>{
  const savedId = localStorage.getItem("playerId");
  const savedRoom = localStorage.getItem("roomCode");
  const savedName = localStorage.getItem("playerName");

  if(savedId && savedRoom){
    playerId = savedId;
    playerName = savedName;
    roomCode = savedRoom;

    roomRef = db.ref("rooms/" + roomCode);

    document.getElementById("startScreen").style.display="none";

    listenRoom();
  }
  
};
