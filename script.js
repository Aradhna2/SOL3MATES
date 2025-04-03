import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getDatabase, ref, push, onValue,
  query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1my79wPEDlsfsgg2oW6lCv-PI1_XqLZs",
  authDomain: "sol3mates.firebaseapp.com",
  databaseURL: "https://sol3mates-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sol3mates",
  storageBucket: "sol3mates.firebasestorage.app",
  messagingSenderId: "412759700453",
  appId: "1:412759700453:web:fc9269184892d60176350c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const catcher = document.getElementById("catcher");
const scoreDisplay = document.getElementById("score");
const popup = document.getElementById("popup");
const scoresList = document.getElementById("scores");
const timerDisplay = document.getElementById("timer");
const submitBtn = document.getElementById("submitScoreBtn");
const retryBtn = document.getElementById("retryBtn");
const game = document.getElementById("game");
const form = document.getElementById("playerForm");
const formContainer = document.getElementById("formContainer");

let playerName = "", playerEmail = "", playerShoeSize = "";
let score = 0, gameRunning = false;
let itemFallSpeed = 5, spawnRate = 700;
let countdownInterval, timeLeft = 30, moreHazards = false;

form.addEventListener("submit", function (e) {
  e.preventDefault();
  playerName = document.getElementById("formName").value.trim();
  playerEmail = document.getElementById("formEmail").value.trim();
  playerShoeSize = document.getElementById("formShoe").value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const shoeRegex = /^(EU|UK|US)\s?(?:[1-9]|[1-3][0-9]|4[0-7])(\.5)?$/i;

  if (!playerName || playerName.length < 2) {
    alert("Please enter a valid name (min 2 characters).");
    return;
  }
  if (!emailRegex.test(playerEmail)) {
    alert("Please enter a valid email address.");
    return;
  }
  if (!shoeRegex.test(playerShoeSize)) {
    alert("Shoe size must include UK, US, or EU followed by a size up to 47 (e.g., EU 42.5).");
    return;
  }

  formContainer.style.display = "none";
  game.style.display = "block";
  startGame();
});

submitBtn.onclick = function () {
  if (!playerName) return;
  push(ref(db, "scores"), {
    name: playerName,
    score: score,
    email: playerEmail,
    shoeSize: playerShoeSize,
    timestamp: Date.now()
  });
  submitBtn.style.display = "none";
};

retryBtn.onclick = function () {
  popup.style.display = "none";
  clearGame();
  startGame();
};

function updateLeaderboard() {
  const leaderboardRef = query(ref(db, "scores"), orderByChild("score"), limitToLast(3));
  onValue(leaderboardRef, (snapshot) => {
    const scores = [];
    snapshot.forEach((child) => {
      scores.push(child.val());
    });
    scores.reverse();
    scoresList.innerHTML = "";
    scores.forEach(entry => {
      const li = document.createElement("li");
      li.textContent = `${entry.name}: ${entry.score}`;
      scoresList.appendChild(li);
    });
  });
}

function startGame() {
  gameRunning = true;
  updateLeaderboard();
  countdownInterval = setInterval(updateCountdown, 1000);
  spawnItem();
}

function clearGame() {
  score = 0;
  timeLeft = 30;
  itemFallSpeed = 5;
  spawnRate = 700;
  moreHazards = false;
  gameRunning = false;
  scoreDisplay.textContent = "Score: 0";
  updateTimerDisplay();
  document.querySelectorAll(".item").forEach(el => el.remove());
}

function spawnItem() {
  if (!gameRunning) return;
  const item = document.createElement("div");
  const rand = Math.random();
  let type = rand < 0.7 ? "good" : rand < 0.9 ? "bad" : "deadly";
  if (moreHazards && rand >= 0.4) type = rand < 0.8 ? "bad" : "deadly";

  item.classList.add("item", type);
  item.dataset.type = type;
  item.style.left = `${Math.random() * (game.offsetWidth - 100)}px`;
  item.style.top = "0px";
  game.appendChild(item);

  function fall() {
    if (!gameRunning) return item.remove();
    let top = parseFloat(item.style.top || 0);
    item.style.top = `${top + itemFallSpeed}px`;
    const itemRect = item.getBoundingClientRect();
    const catcherRect = catcher.getBoundingClientRect();
    if (
      itemRect.bottom >= catcherRect.top &&
      itemRect.left < catcherRect.right &&
      itemRect.right > catcherRect.left
    ) {
      handleItemCatch(type);
      item.remove();
    } else if (top > window.innerHeight) {
      item.remove();
    } else {
      requestAnimationFrame(fall);
    }
  }
  fall();
  setTimeout(spawnItem, spawnRate);
}

function handleItemCatch(type) {
  if (type === "good") {
    score++;
    itemFallSpeed += 0.5;
    spawnRate = Math.max(300, spawnRate - 30);
  } else if (type === "bad") {
    score--;
    itemFallSpeed += 0.3;
    spawnRate = Math.max(300, spawnRate - 20);
  } else if (type === "deadly") {
    gameRunning = false;
    clearInterval(countdownInterval);
    endGame();
    return;
  }
  scoreDisplay.textContent = `Score: ${score}`;
}

function updateCountdown() {
  if (!gameRunning) return;
  timeLeft--;
  updateTimerDisplay();
  if (timeLeft <= 23 && !moreHazards) {
    moreHazards = true;
    itemFallSpeed += 1.5;
  }
  if (timeLeft <= 0) {
    clearInterval(countdownInterval);
    gameRunning = false;
    endGame();
  }
}

function updateTimerDisplay() {
  timerDisplay.textContent = `Time: ${timeLeft}`;
}

function endGame() {
  popup.style.display = "block";
  submitBtn.style.display = "inline-block";
}

document.addEventListener("touchmove", (e) => {
  if (!gameRunning) return;
  const touchX = e.touches[0].clientX;
  const newLeft = touchX - catcher.offsetWidth / 2;
  catcher.style.left = `${Math.min(game.offsetWidth - catcher.offsetWidth, Math.max(0, newLeft))}px`;
});

document.addEventListener("mousemove", (e) => {
  if (!gameRunning) return;
  const mouseX = e.clientX;
  const newLeft = mouseX - catcher.offsetWidth / 2;
  catcher.style.left = `${Math.min(game.offsetWidth - catcher.offsetWidth, Math.max(0, newLeft))}px`;
});

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  const step = 30;
  let catcherLeft = catcher.offsetLeft;
  if (e.key === "ArrowLeft") catcherLeft -= step;
  if (e.key === "ArrowRight") catcherLeft += step;
  catcher.style.left = `${Math.min(game.offsetWidth - catcher.offsetWidth, Math.max(0, catcherLeft))}px`;
});