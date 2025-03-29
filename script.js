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
const usernameInput = document.getElementById("username");
const startMessage = document.getElementById("startMessage");
const timerDisplay = document.getElementById("timer");
const submitBtn = document.getElementById("submitScoreBtn");
const game = document.getElementById("game");

let score = 0, gameRunning = false, gameStarted = false;
let catcherSpeed = 30, itemFallSpeed = 5, spawnRate = 700;
let countdownInterval, timeLeft = 30, moreHazards = false;

submitBtn.onclick = submitScore;
updateLeaderboard();

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

function submitScore() {
  const name = usernameInput.value.trim();
  const validNamePattern = /^[a-zA-Z\s]{2,20}$/;
  const forbiddenWords = /badword1|badword2|offensiveword/i;

  if (!name) {
    alert("Please enter your name.");
    return;
  }
  if (!validNamePattern.test(name)) {
    alert("Name must be 2–20 letters only (no numbers or symbols).");
    return;
  }
  if (forbiddenWords.test(name)) {
    alert("Please choose a respectful name.");
    return;
  }

  push(ref(db, "scores"), { name, score, timestamp: Date.now() });
  popup.style.display = "none";
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  gameRunning = true;
  startMessage.style.display = "none";
  score = 0;
  timeLeft = 30;
  itemFallSpeed = 5;
  spawnRate = 700;
  moreHazards = false;
  scoreDisplay.textContent = "Score: 0";
  updateTimerDisplay();
  startCountdown();
  spawnItem();
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

function startCountdown() {
  countdownInterval = setInterval(() => {
    if (!gameRunning) return clearInterval(countdownInterval);
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
  }, 1000);
}

function updateTimerDisplay() {
  timerDisplay.textContent = `Time: ${timeLeft}`;
}

function endGame() {
  popup.style.display = "block";
}

document.addEventListener("keydown", (e) => {
  if (!gameStarted && (e.key === " " || e.key === "Spacebar")) startGame();
  if (!gameRunning) return;
  const catcherLeft = catcher.offsetLeft;
  if (e.key === "ArrowLeft" && catcherLeft > 0)
    catcher.style.left = `${catcherLeft - catcherSpeed}px`;
  else if (e.key === "ArrowRight" && catcherLeft + catcher.offsetWidth < game.offsetWidth)
    catcher.style.left = `${catcherLeft + catcherSpeed}px`;
});

document.addEventListener("mousemove", (e) => {
  if (!gameRunning) return;
  const mouseX = e.clientX;
  catcher.style.left = `${Math.min(game.offsetWidth - catcher.offsetWidth, Math.max(0, mouseX - catcher.offsetWidth / 2))}px`;
});

document.addEventListener("click", startGame);
document.addEventListener("touchstart", (e) => {
  if (!gameStarted) startGame();
});

document.addEventListener("touchmove", (e) => {
  if (!gameRunning) return;
  const touchX = e.touches[0].clientX;
  catcher.style.left = `${Math.min(game.offsetWidth - catcher.offsetWidth, Math.max(0, touchX - catcher.offsetWidth / 2))}px`;
});