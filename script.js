const catcher = document.getElementById("catcher");
const scoreDisplay = document.getElementById("score");
const popup = document.getElementById("popup");
const scoresList = document.getElementById("scores");
const usernameInput = document.getElementById("username");
const startMessage = document.getElementById("startMessage");
const timerDisplay = document.getElementById("timer");
const game = document.getElementById("game");

let score = 0;
let gameRunning = false;
let gameStarted = false;
let catcherSpeed = 30;
let itemFallSpeed = 5;
let spawnRate = 700;
let countdownInterval;
let timeLeft = 30;
let moreHazards = false;

let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
updateLeaderboard();

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
  item.classList.add("item");

  const rand = Math.random();
  if (!moreHazards) {
    if (rand < 0.7) item.classList.add("good"), item.dataset.type = "good";
    else if (rand < 0.9) item.classList.add("bad"), item.dataset.type = "bad";
    else item.classList.add("deadly"), item.dataset.type = "deadly";
  } else {
    if (rand < 0.4) item.classList.add("good"), item.dataset.type = "good";
    else if (rand < 0.8) item.classList.add("bad"), item.dataset.type = "bad";
    else item.classList.add("deadly"), item.dataset.type = "deadly";
  }

  item.style.left = `${Math.random() * (game.offsetWidth - 100)}px`;
  item.style.top = "0px";
  game.appendChild(item);

  function fall() {
    if (!gameRunning) {
      item.remove();
      return;
    }

    let top = parseFloat(item.style.top || 0);
    item.style.top = `${top + itemFallSpeed}px`;

    const itemRect = item.getBoundingClientRect();
    const catcherRect = catcher.getBoundingClientRect();

    if (
      itemRect.bottom >= catcherRect.top &&
      itemRect.left < catcherRect.right &&
      itemRect.right > catcherRect.left
    ) {
      const type = item.dataset.type;

      if (type === "good") {
        score++;
        itemFallSpeed += 0.5;
        spawnRate = Math.max(300, spawnRate - 30);
      } else if (type === "bad") {
        score--;
        itemFallSpeed += 0.3;
        spawnRate = Math.max(300, spawnRate - 20);
      } else if (type === "deadly") {
        clearInterval(countdownInterval);
        gameRunning = false;
        endGame();
        return;
      }

      scoreDisplay.textContent = `Score: ${score}`;
      item.remove();
    } else if (top > window.innerHeight) {
      item.remove(); // Green object missed — no consequence
    } else {
      requestAnimationFrame(fall);
    }
  }

  fall();
  setTimeout(spawnItem, spawnRate);
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
  gameRunning = false;
  popup.style.display = "block";
}

function submitScore() {
  const name = usernameInput.value || "Anonymous";
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  updateLeaderboard();
  popup.style.display = "none";
}

function updateLeaderboard() {
  scoresList.innerHTML = "";
  leaderboard.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.score}`;
    scoresList.appendChild(li);
  });
}

function restartGame() {
  document.querySelectorAll(".item").forEach(el => el.remove());
  score = 0;
  itemFallSpeed = 5;
  spawnRate = 700;
  scoreDisplay.textContent = "Score: 0";
  catcher.style.left = "50%";
  popup.style.display = "none";
  gameRunning = true;
  timeLeft = 30;
  moreHazards = false;
  updateTimerDisplay();
  startCountdown();
  spawnItem();
}

// ========== CONTROLS ==========

// Keyboard
document.addEventListener("keydown", (e) => {
  if (!gameStarted && (e.key === " " || e.key === "Spacebar")) startGame();
  if (!gameRunning) return;
  const catcherLeft = catcher.offsetLeft;
  if (e.key === "ArrowLeft" && catcherLeft > 0)
    catcher.style.left = `${catcherLeft - catcherSpeed}px`;
  else if (e.key === "ArrowRight" && catcherLeft + catcher.offsetWidth < game.offsetWidth)
    catcher.style.left = `${catcherLeft + catcherSpeed}px`;
});

// Mouse
document.addEventListener("mousemove", (e) => {
  if (!gameRunning) return;
  const mouseX = e.clientX;
  catcher.style.left = `${Math.min(game.offsetWidth - catcher.offsetWidth, Math.max(0, mouseX - catcher.offsetWidth / 2))}px`;
});

// Tap/Click to Start
document.addEventListener("click", startGame);
document.addEventListener("touchstart", (e) => {
  if (!gameStarted) startGame();
});

// Touch Move
document.addEventListener("touchmove", (e) => {
  if (!gameRunning) return;
  const touchX = e.touches[0].clientX;
  catcher.style.left = `${Math.min(game.offsetWidth - catcher.offsetWidth, Math.max(0, touchX - catcher.offsetWidth / 2))}px`;
});

// Swipe Support
let touchStartX = null;
let touchEndX = null;
const swipeThreshold = 30;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});
document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  if (!touchStartX || !touchEndX) return;
  const deltaX = touchEndX - touchStartX;
  const catcherLeft = catcher.offsetLeft;
  if (Math.abs(deltaX) > swipeThreshold) {
    if (deltaX > 0 && catcherLeft + catcher.offsetWidth < game.offsetWidth) {
      catcher.style.left = `${catcherLeft + catcherSpeed}px`;
    } else if (deltaX < 0 && catcherLeft > 0) {
      catcher.style.left = `${catcherLeft - catcherSpeed}px`;
    }
  }
  touchStartX = null;
  touchEndX = null;
}