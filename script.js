const firebaseConfig = {
  apiKey: "AIzaSyD1my79wPEDlsfsgg2oW6lCv-PI1_XqLZs",
  authDomain: "sol3mates.firebaseapp.com",
  databaseURL: "https://sol3mates-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sol3mates",
  storageBucket: "sol3mates.appspot.com",
  messagingSenderId: "412759700453",
  appId: "1:412759700453:web:fc9269184892d60176350c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const catcher = document.getElementById("catcher");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");
const submitBtn = document.getElementById("submitScoreBtn");
const retryBtn = document.getElementById("retryBtn");
const form = document.getElementById("playerForm");
const game = document.getElementById("game");
const formContainer = document.getElementById("formContainer");
const scoresList = document.getElementById("scores");

let playerName = "", playerEmail = "", playerShoe = "";
let score = 0, timeLeft = 30, gameRunning = false;
let fallSpeed = 5, spawnRate = 700, hazardBoost = false;
let countdownInterval;

form.addEventListener("submit", function (e) {
  e.preventDefault();
  playerName = document.getElementById("formName").value.trim();
  playerEmail = document.getElementById("formEmail").value.trim();
  playerShoe = document.getElementById("formShoe").value.trim();

  if (!playerName || !playerEmail || !playerShoe) {
    alert("All fields required.");
    return;
  }

  formContainer.style.display = "none";
  game.style.display = "block";
  startGame();
});

function startGame() {
  score = 0;
  timeLeft = 30;
  fallSpeed = 5;
  spawnRate = 700;
  hazardBoost = false;
  gameRunning = true;

  scoreDisplay.textContent = "Score: 0";
  timerDisplay.textContent = "Time: 30";
  popup.style.display = "none";
  document.querySelectorAll(".item").forEach(item => item.remove());

  startCountdown();
  updateLeaderboard();
  spawnItem();
}

function startCountdown() {
  countdownInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 23 && !hazardBoost) {
      hazardBoost = true;
      fallSpeed += 1.5;
    }
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      endGame();
    }
  }, 1000);
}

function spawnItem() {
  if (!gameRunning) return;

  const item = document.createElement("div");
  const rand = Math.random();
  let type = rand < 0.7 ? "good" : rand < 0.9 ? "bad" : "deadly";
  if (hazardBoost && rand >= 0.4) type = rand < 0.8 ? "bad" : "deadly";

  item.classList.add("item", type);
  item.dataset.type = type;
  item.style.left = `${Math.random() * (game.offsetWidth - 100)}px`;
  item.style.top = "0px";
  game.appendChild(item);

  function fall() {
    if (!gameRunning) return item.remove();
    let top = parseFloat(item.style.top || 0);
    item.style.top = `${top + fallSpeed}px`;

    const itemRect = item.getBoundingClientRect();
    const catcherRect = catcher.getBoundingClientRect();
    const isTouching =
      itemRect.bottom >= catcherRect.top &&
      itemRect.top <= catcherRect.bottom &&
      itemRect.right >= catcherRect.left &&
      itemRect.left <= catcherRect.right;

    if (isTouching) {
      handleItem(type);
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

  function fall() {
    if (!gameRunning) return item.remove();
    let top = parseFloat(item.style.top || 0);
    item.style.top = `${top + fallSpeed}px`;

    const itemRect = item.getBoundingClientRect();
    const catcherRect = catcher.getBoundingClientRect();
    const isTouching =
      itemRect.bottom >= catcherRect.top &&
      itemRect.top <= catcherRect.bottom &&
      itemRect.right >= catcherRect.left &&
      itemRect.left <= catcherRect.right;

    if (isTouching) {
      handleItem(type);
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

function handleItem(type) {
  if (type === "good") {
    score++;
    fallSpeed += 0.3;
  } else if (type === "bad") {
    score--;
  } else if (type === "deadly") {
    gameRunning = false;
    clearInterval(countdownInterval);
    endGame();
    return;
  }
  scoreDisplay.textContent = `Score: ${score}`;
}

function endGame() {
  gameRunning = false;
  popup.style.display = "block";
  popupMessage.textContent = `Game Over — Your Score: ${score}`;
  submitBtn.style.display = "inline-block";
  retryBtn.style.display = "inline-block";
}

retryBtn.addEventListener("click", () => {
  popup.style.display = "none";
  startGame();
});

submitBtn.addEventListener("click", () => {
  if (playerName && gameRunning === false) {
    firebase.database().ref("scores").push({
      name: playerName,
      email: playerEmail,
      shoeSize: playerShoe,
      score: score,
      timestamp: Date.now()
    });
    popupMessage.textContent = "Score submitted!";
    submitBtn.style.display = "none";
  }
});

function updateLeaderboard() {
  const refScores = db.ref("scores").orderByChild("score").limitToLast(3);
  refScores.on("value", (snapshot) => {
    const data = [];
    snapshot.forEach(child => data.push(child.val()));
    scoresList.innerHTML = "";
    data.reverse().forEach(entry => {
      const li = document.createElement("li");
      li.textContent = `${entry.name}: ${entry.score}`;
      scoresList.appendChild(li);
    });
  });
}

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  let x = catcher.offsetLeft;
  if (e.key === "ArrowLeft") x -= 30;
  if (e.key === "ArrowRight") x += 30;
  catcher.style.left = `${Math.max(0, Math.min(x, game.offsetWidth - catcher.offsetWidth))}px`;
});
document.addEventListener("mousemove", (e) => {
  if (!gameRunning) return;
  const x = e.clientX - catcher.offsetWidth / 2;
  catcher.style.left = `${Math.max(0, Math.min(x, game.offsetWidth - catcher.offsetWidth))}px`;
});
document.addEventListener("touchmove", (e) => {
  if (!gameRunning) return;
  const x = e.touches[0].clientX - catcher.offsetWidth / 2;
  catcher.style.left = `${Math.max(0, Math.min(x, game.offsetWidth - catcher.offsetWidth))}px`;
});
