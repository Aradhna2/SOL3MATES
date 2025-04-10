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

// ✅ Show "Catch as many 320s..." on start
function showStartInstructions() {
  const msg = document.createElement("div");
  msg.id = "startInstructions";
  msg.innerText = "Catch as many 320s as you can";
  game.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 7000);
}

// ✅ Handle form submission and start game
form.addEventListener("submit", function (e) {
  e.preventDefault();
  playerName = document.getElementById("formName").value.trim();
  playerEmail = document.getElementById("formEmail").value.trim();
  playerShoeSize = document.getElementById("formShoe").value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const shoeRegex = /^(EU|UK|US)\s?(?:[1-9]|[1-3][0-9]|4[0-7])(\.5)?$/i;

  if (!playerName || playerName.length < 2) {
    alert("Please enter a valid name.");
    return;
  }
  if (!emailRegex.test(playerEmail)) {
    alert("Please enter a valid email.");
    return;
  }
  if (!shoeRegex.test(playerShoeSize)) {
    alert("Please enter a valid shoe size (e.g., EU 42.5).");
    return;
  }

  formContainer.style.display = "none";
  game.style.display = "block";
  startGame();
});

submitBtn.onclick = function () {
  alert(`Score submitted: ${score}`);
  submitBtn.style.display = "none";
};

retryBtn.onclick = function () {
  popup.style.display = "none";
  clearGame();
  startGame();
};

function startGame() {
  score = 0;
  timeLeft = 30;
  moreHazards = false;
  itemFallSpeed = 5;
  spawnRate = 700;
  scoreDisplay.textContent = "Score: 0";
  updateTimerDisplay();
  gameRunning = true;
  showStartInstructions();
  startCountdown();
  spawnItem();
}

function clearGame() {
  document.querySelectorAll(".item").forEach(item => item.remove());
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
      itemRect.right > catcherRect.left &&
      itemRect.top < catcherRect.bottom
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
  submitBtn.style.display = "inline-block";
}

// Touch + mouse control
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