const board = document.querySelector("#memoryBoard");
const moveCount = document.querySelector("#moveCount");
const pairCount = document.querySelector("#pairCount");
const timerDisplay = document.querySelector("#timer");
const gameMessage = document.querySelector("#gameMessage");
const challengePanel = document.querySelector("#challengePanel");
const completePanel = document.querySelector("#completePanel");

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matched = 0;
let seconds = 0;
let timerInterval = null;
let gameStarted = false;
let currentCards = [];

function formatTime(value) {
  const mins = String(Math.floor(value / 60)).padStart(2, "0");
  const secs = String(value % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function setMessage(message, type = "") {
  gameMessage.textContent = message;
  gameMessage.className = `game-message ${type}`;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  seconds = 0;
  timerDisplay.textContent = formatTime(seconds);
  timerInterval = setInterval(() => {
    seconds += 1;
    timerDisplay.textContent = formatTime(seconds);
  }, 1000);
}

async function loadUser() {
  try {
    const data = await apiRequest("/api/auth/me");
    document.querySelector("#playerName").textContent = data.user.username;
    document.querySelector("#playerAvatar").textContent = data.user.username.charAt(0).toUpperCase();
    document.querySelector("#winnerName").textContent = data.user.username;
  } catch {
    window.location.href = "/pages/login.html";
  }
}

function createCard(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "memory-card";
  button.dataset.id = card.id;
  button.setAttribute("aria-label", "Hidden memory card");
  button.innerHTML = `<span class="card-inner"><span class="card-back">✳</span><span class="card-front"><span>${card.symbol}</span><small>${card.label}</small></span></span>`;
  button.addEventListener("click", () => flipCard(button, card));
  return button;
}

async function startGame() {
  if (timerInterval) clearInterval(timerInterval);
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  matched = 0;
  gameStarted = false;
  currentCards = [];
  moveCount.textContent = "0";
  pairCount.innerHTML = '0 <small>/ 4</small>';
  challengePanel.classList.add("hidden");
  completePanel.classList.add("hidden");
  board.innerHTML = '<div class="board-loading">Preparing your cards…</div>';
  setMessage("Flip two cards and find their matching fruit.");

  try {
    const data = await apiRequest("/api/game/start", { method: "POST", body: JSON.stringify({}) });
    currentCards = data.cards;
    board.innerHTML = "";
    currentCards.forEach((card) => board.appendChild(createCard(card)));
    gameStarted = true;
    startTimer();
  } catch (error) {
    board.innerHTML = "";
    setMessage(error.message, "error");
  }
}

function flipCard(element, card) {
  if (!gameStarted || lockBoard || element.classList.contains("flipped") || element.classList.contains("matched")) return;
  element.classList.add("flipped");
  element.setAttribute("aria-label", `${card.label} card`);

  if (!firstCard) {
    firstCard = { element, card };
    return;
  }

  secondCard = { element, card };
  moves += 1;
  moveCount.textContent = String(moves);
  apiRequest("/api/game/moves", {
    method: "POST",
    body: JSON.stringify({ moves })
  }).catch(() => {});

  if (firstCard.card.label === secondCard.card.label) {
    firstCard.element.classList.add("matched");
    secondCard.element.classList.add("matched");
    firstCard.element.setAttribute("aria-label", `Matched ${card.label}`);
    secondCard.element.setAttribute("aria-label", `Matched ${card.label}`);
    matched += 1;
    pairCount.innerHTML = `${matched} <small>/ 4</small>`;
    resetTurn();

    if (matched === 4) {
      setMessage("All pairs matched! Your Banana Challenge is ready.", "success");
      gameStarted = false;
      clearInterval(timerInterval);
      loadBananaChallenge();
    } else {
      setMessage("Nice match! Keep going.", "success");
    }
  } else {
    lockBoard = true;
    setMessage("Not a match. Try to remember where they are.");
    setTimeout(() => {
      firstCard.element.classList.remove("flipped");
      secondCard.element.classList.remove("flipped");
      firstCard.element.setAttribute("aria-label", "Hidden memory card");
      secondCard.element.setAttribute("aria-label", "Hidden memory card");
      resetTurn();
    }, 850);
  }
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

async function loadBananaChallenge() {
  challengePanel.classList.remove("hidden");
  document.querySelector("#challengeLoading").classList.remove("hidden");
  document.querySelector("#bananaQuestion").classList.add("hidden");
  document.querySelector("#answerMessage").textContent = "";
  document.querySelector("#answerInput").value = "";

  try {
    const data = await apiRequest("/api/game/banana-challenge");
    const image = document.querySelector("#bananaQuestion");
    image.src = data.question;
    image.onload = () => {
      document.querySelector("#challengeLoading").classList.add("hidden");
      image.classList.remove("hidden");
    };
    image.onerror = () => {
      document.querySelector("#challengeLoading").textContent = "Puzzle image could not be loaded. Try another puzzle.";
    };
  } catch (error) {
    document.querySelector("#challengeLoading").textContent = error.message;
    document.querySelector("#challengeLoading").classList.remove("hidden");
    document.querySelector("#newChallengeButton").textContent = "↻ Retry loading puzzle";
  }
  challengePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelector("#answerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const answer = document.querySelector("#answerInput").value;
  const message = document.querySelector("#answerMessage");
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  message.textContent = "Checking your answer…";
  message.className = "game-message";

  try {
    const result = await apiRequest("/api/game/banana-answer", {
      method: "POST",
      body: JSON.stringify({ answer })
    });
    message.textContent = result.message;
    message.className = `game-message ${result.correct ? "success" : "error"}`;

    if (result.correct) {
      clearInterval(timerInterval);
      document.querySelector("#finalMoves").textContent = result.moves;
      document.querySelector("#finalTime").textContent = `${result.durationSeconds}s`;
      completePanel.classList.remove("hidden");
      completePanel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } catch (error) {
    message.textContent = error.message;
    message.className = "game-message error";
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#newChallengeButton").addEventListener("click", loadBananaChallenge);
document.querySelector("#restartButton").addEventListener("click", startGame);
document.querySelector("#playAgainButton").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  startGame();
});
document.querySelector("#logoutButton").addEventListener("click", async () => {
  try {
    await apiRequest("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
  } finally {
    window.location.href = "/";
  }
});

loadUser();
startGame();
