
const board = document.querySelector("#memoryBoard");
const moveCount = document.querySelector("#moveCount");
const pairCount = document.querySelector("#pairCount");
const timerDisplay = document.querySelector("#timer");
const gameMessage = document.querySelector("#gameMessage");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const completePanel = document.querySelector("#completePanel");
const levelButtons = document.querySelector("#levelButtons");
const progressLevel = document.querySelector("#progressLevel");
const unlockHint = document.querySelector("#unlockHint");
const levelEyebrow = document.querySelector("#levelEyebrow");
const levelTitle = document.querySelector("#levelTitle");
const cardCount = document.querySelector("#cardCount");
const playerName = document.querySelector("#playerName");
const playerAvatar = document.querySelector("#playerAvatar");
const finalMoves = document.querySelector("#finalMoves");
const finalTime = document.querySelector("#finalTime");
const completeTitle = document.querySelector("#completeTitle");
const completeCopy = document.querySelector("#completeCopy");
const nextLevelButton = document.querySelector("#nextLevelButton");
const logoutButton = document.querySelector("#logoutButton");
const LEVELS = {
  1: { pairs: 2, cards: 4, title: "Level 1" },
  2: { pairs: 3, cards: 6, title: "Level 2" },
  3: { pairs: 4, cards: 8, title: "Level 3" },
  4: { pairs: 6, cards: 12, title: "Level 4" },
  5: { pairs: 8, cards: 16, title: "Level 5" }
};
const MAX_LEVEL = 5;
let currentLevel = 1;
let highestLevel = 1;
let selectedCards = [];
let moves = 0;
let pairsFound = 0;
let gameStarted = false;
let isChecking = false;
let timerInterval = null;
let elapsedSeconds = 0;
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
function setMessage(message) {
  if (gameMessage) gameMessage.textContent = message;
}
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    if (timerDisplay) timerDisplay.textContent = formatTime(elapsedSeconds);
  }, 1000);
}
function renderLevelButtons() {
  if (!levelButtons) return;
  levelButtons.innerHTML = "";
  Object.entries(LEVELS).forEach(([levelNumber, level]) => {
    const number = Number(levelNumber);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-button";
    button.textContent = number;
    if (number === currentLevel) button.classList.add("active");
    if (number > highestLevel) {
      button.disabled = true;
      button.classList.add("locked");
    }
    button.addEventListener("click", () => selectLevel(number));
    levelButtons.appendChild(button);
  });
}
function updateLevelInfo() {
  const level = LEVELS[currentLevel];
  if (!level) return;
  if (progressLevel) progressLevel.textContent = `Level ${currentLevel}`;
  if (levelEyebrow) levelEyebrow.textContent = `LEVEL ${currentLevel}`;
  if (levelTitle) levelTitle.textContent = level.title;
  if (cardCount) cardCount.textContent = `${level.cards} Cards`;
  if (unlockHint) {
    unlockHint.textContent = currentLevel < highestLevel
      ? "Level unlocked"
      : currentLevel === MAX_LEVEL
        ? "Final level"
        : "Complete this level to unlock the next one";
  }
  renderLevelButtons();
}
function resetBoardState() {
  stopTimer();
  selectedCards = [];
  moves = 0;
  pairsFound = 0;
  gameStarted = false;
  isChecking = false;
  elapsedSeconds = 0;
  if (board) board.innerHTML = "";
  if (moveCount) moveCount.textContent = "0";
  if (pairCount) pairCount.textContent = "0";
  if (timerDisplay) timerDisplay.textContent = "00:00";
  if (completePanel) completePanel.hidden = true;
  if (startButton) startButton.disabled = false;
  if (restartButton) restartButton.disabled = false;
  setMessage("Press Start Game to begin!");
}
async function loadUserAndProgress() {
  try {
    const userResponse = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (userResponse.status === 401) {
      window.location.href = "/pages/login.html";
      return;
    }
    const userData = await userResponse.json();
    if (!userResponse.ok) throw new Error(userData.message || "Could not load player.");
    const user = userData.user || userData;
    if (playerName) playerName.textContent = user.username || user.name || user.email || "Player";
    if (playerAvatar) {
      const name = user.username || user.name || "P";
      playerAvatar.textContent = name.charAt(0).toUpperCase();
    }
    const progressResponse = await fetch("/api/game/progress", { credentials: "same-origin" });
    const progressData = await progressResponse.json();
    if (!progressResponse.ok) throw new Error(progressData.message || "Could not load game progress.");
    highestLevel = Number(progressData.currentLevel) || 1;
    highestLevel = Math.max(1, Math.min(MAX_LEVEL, highestLevel));
    currentLevel = highestLevel;
    updateLevelInfo();
    resetBoardState();
  } catch (error) {
    console.error("Loading game error:", error);
    setMessage(error.message || "Could not load the game.");
  }
}
function selectLevel(level) {
  if (level < 1 || level > highestLevel) {
    setMessage("Complete the previous level to unlock this one.");
    return;
  }
  currentLevel = level;
  resetBoardState();
  updateLevelInfo();
}
function createCard(card) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "memory-card";
  element.dataset.id = card.id;
  element.dataset.symbol = card.symbol;
  element.innerHTML = `
    <span class="card-inner">
      <span class="card-front">?</span>
      <span class="card-back">${card.symbol}</span>
    </span>
  `;
  element.addEventListener("click", () => flipCard(element));
  return element;
}
async function startGame() {
  if (gameStarted) return;
  resetBoardState();
  setMessage("Preparing your fruit cards...");
  if (startButton) startButton.disabled = true;
  try {
    const response = await fetch("/api/game/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ level: currentLevel })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not start game.");
    selectedCards = [];
    moves = 0;
    pairsFound = 0;
    elapsedSeconds = 0;
    if (moveCount) moveCount.textContent = "0";
    if (pairCount) pairCount.textContent = "0";
    if (timerDisplay) timerDisplay.textContent = "00:00";
    board.innerHTML = "";
    result.cards.forEach(card => board.appendChild(createCard(card)));
    gameStarted = true;
    setMessage("Find the matching fruit pairs!");
    startTimer();
  } catch (error) {
    console.error("Starting game error:", error);
    setMessage(error.message || "Could not start the game.");
    if (startButton) startButton.disabled = false;
  }
}
async function flipCard(cardElement) {
  if (!gameStarted || isChecking || cardElement.classList.contains("flipped") || cardElement.classList.contains("matched") || selectedCards.length >= 2) return;
  cardElement.classList.add("flipped");
  selectedCards.push(cardElement);
  if (selectedCards.length !== 2) return;
  isChecking = true;
  const [firstCard, secondCard] = selectedCards;
  try {
    const response = await fetch("/api/game/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ firstCardId: firstCard.dataset.id, secondCardId: secondCard.dataset.id })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not check cards.");
    moves += 1;
    if (moveCount) moveCount.textContent = moves;
    if (result.matched) {
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      pairsFound += 1;
      if (pairCount) pairCount.textContent = pairsFound;
      setMessage("Great match! 🎉");
    } else {
      setMessage("Not a match. Try again!");
      await new Promise(resolve => setTimeout(resolve, 800));
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
    }
    selectedCards = [];
    if (result.memoryComplete && result.puzzleQuestion) {
      showBananaPuzzle(result.puzzleQuestion);
      return;
    }
    if (result.puzzleUnavailable) showPuzzleRetry();
  } catch (error) {
    console.error("Card matching error:", error);
    setMessage(error.message || "Something went wrong.");
    selectedCards.forEach(card => card.classList.remove("flipped"));
    selectedCards = [];
  } finally {
    isChecking = false;
  }
}
function showBananaPuzzle(question) {
  gameStarted = false;
  board.innerHTML = "";
  const challenge = document.createElement("div");
  challenge.className = "banana-puzzle-challenge";
  const heading = document.createElement("h2");
  heading.textContent = "🍌 Final Banana Challenge!";
  const description = document.createElement("p");
  description.textContent = "You matched all the fruits! Solve this puzzle to complete the level.";
  const image = document.createElement("img");
  image.src = question;
  image.alt = "Banana API maths puzzle";
  image.className = "banana-puzzle-image";
  image.onerror = () => {
    image.alt = "Puzzle image could not be loaded";
    setMessage("The puzzle image could not be displayed.");
  };
  const form = document.createElement("form");
  form.className = "puzzle-answer-form";
  const input = document.createElement("input");
  input.type = "number";
  input.id = "bananaAnswer";
  input.placeholder = "Enter your answer";
  input.required = true;
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit Answer";
  const message = document.createElement("p");
  message.id = "bananaMessage";
  form.append(input, submitButton);
  challenge.append(heading, description, image, form, message);
  board.appendChild(challenge);
  setMessage("Solve the Banana puzzle to finish the level!");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const answer = input.value.trim();
    if (!answer) return;
    submitButton.disabled = true;
    message.textContent = "Checking your answer...";
    try {
      const response = await fetch("/api/game/puzzle-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ answer })
      });
      const result = await response.json();
      if (!response.ok) {
        message.textContent = result.message || "Incorrect answer. Try again!";
        submitButton.disabled = false;
        input.focus();
        return;
      }
      if (result.correct && result.levelComplete) {
        message.textContent = "";
        form.remove();
        setMessage("🍌 Correct answer! Level completed!");
        finishLevel(result);
      }
    } catch (error) {
      console.error("Puzzle answer error:", error);
      message.textContent = "Connection error. Please try again.";
      submitButton.disabled = false;
    }
  });
  input.focus();
}
function showPuzzleRetry() {
  gameStarted = false;
  board.innerHTML = `
    <div class="banana-puzzle-challenge">
      <h2>🍌 Almost there!</h2>
      <p>All fruit pairs are matched, but the Banana puzzle could not load.</p>
      <button id="retryPuzzleButton" type="button">Retry Puzzle</button>
      <p id="retryMessage"></p>
    </div>
  `;
  const retryButton = document.querySelector("#retryPuzzleButton");
  const message = document.querySelector("#retryMessage");
  retryButton.addEventListener("click", async () => {
    retryButton.disabled = true;
    message.textContent = "Loading puzzle...";
    try {
      const response = await fetch("/api/game/retry-puzzle", {
        method: "POST",
        credentials: "same-origin"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load puzzle.");
      showBananaPuzzle(result.puzzleQuestion);
    } catch (error) {
      console.error("Puzzle retry error:", error);
      message.textContent = error.message;
      retryButton.disabled = false;
    }
  });
}
function finishLevel(result) {
  stopTimer();
  gameStarted = false;
  isChecking = false;
  highestLevel = Math.max(highestLevel, Number(result.unlockedLevel) || currentLevel);
  const completedLastLevel = currentLevel === MAX_LEVEL;
  if (finalMoves) finalMoves.textContent = result.moves ?? moves;
  if (finalTime) finalTime.textContent = formatTime(result.elapsedSeconds ?? elapsedSeconds);
  if (completeTitle) completeTitle.textContent = completedLastLevel ? "🏆 Congratulations!" : "🎉 Level Completed!";
  if (completeCopy) {
    completeCopy.textContent = completedLastLevel
      ? "You completed all five levels of Banana Memory Quest!"
      : "Great job! You completed the memory quest and solved the Banana puzzle. The next level is unlocked!";
  }
  if (completePanel) completePanel.hidden = false;
  if (nextLevelButton) {
    nextLevelButton.textContent = completedLastLevel ? "Play Again" : "Next Level";
    nextLevelButton.disabled = false;
  }
  updateLevelInfo();
}
function restartGame() {
  startGame();
}
function goToNextLevel() {
  if (currentLevel >= MAX_LEVEL) {
    currentLevel = 1;
  } else {
    currentLevel += 1;
  }
  if (currentLevel > highestLevel) currentLevel = highestLevel;
  resetBoardState();
  updateLevelInfo();
  startGame();
}
async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.href = "/pages/login.html";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "/pages/login.html";
  }
}
if (startButton) startButton.addEventListener("click", startGame);
if (restartButton) restartButton.addEventListener("click", restartGame);
if (nextLevelButton) nextLevelButton.addEventListener("click", goToNextLevel);
if (logoutButton) logoutButton.addEventListener("click", logout);
loadUserAndProgress();
