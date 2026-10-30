const { getBananaQuestion } = require("../services/bananaService");

const cards = [
  { id: "a1", pair: "banana", symbol: "🍌", label: "Banana" },
  { id: "a2", pair: "apple", symbol: "🍎", label: "Apple" },
  { id: "a3", pair: "grapes", symbol: "🍇", label: "Grapes" },
  { id: "a4", pair: "orange", symbol: "🍊", label: "Orange" },
  { id: "a5", pair: "banana", symbol: "🍌", label: "Banana" },
  { id: "a6", pair: "apple", symbol: "🍎", label: "Apple" },
  { id: "a7", pair: "grapes", symbol: "🍇", label: "Grapes" },
  { id: "a8", pair: "orange", symbol: "🍊", label: "Orange" }
];

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function startMemory(req, res) {
  req.session.game = {
    phase: "memory",
    matchedPairs: [],
    moves: 0,
    startedAt: Date.now(),
    bananaSolution: null,
    bananaQuestion: null
  };

  return res.json({
    cards: shuffle(cards).map(({ id, symbol, label }) => ({ id, symbol, label }))
  });
}

async function getChallenge(req, res) {
  if (!req.session.game || !["memory", "banana"].includes(req.session.game.phase)) {
    return res.status(400).json({ message: "Start a new game first." });
  }

  try {
    const challenge = await getBananaQuestion();
    req.session.game.phase = "banana";
    req.session.game.bananaSolution = challenge.solution;
    req.session.game.bananaQuestion = challenge.question;

    return res.json({ question: challenge.question });
  } catch (error) {
    console.error("Banana API error:", error.message);
    return res.status(502).json({
      message: "The Banana Game API is temporarily unavailable. Please try again."
    });
  }
}

function submitAnswer(req, res) {
  if (!req.session.game || req.session.game.phase !== "banana") {
    return res.status(400).json({ message: "There is no active Banana Challenge." });
  }

  const answer = Number(req.body.answer);
  if (!Number.isFinite(answer)) {
    return res.status(400).json({ message: "Enter a valid number." });
  }

  if (answer === Number(req.session.game.bananaSolution)) {
    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - req.session.game.startedAt) / 1000)
    );
    req.session.game.phase = "complete";
    return res.json({
      correct: true,
      message: "Correct! You completed Banana Memory Quest.",
      moves: Number(req.session.game.moves || 0),
      durationSeconds
    });
  }

  return res.json({
    correct: false,
    message: "Not quite. Have another look and try again."
  });
}

function recordMoves(req, res) {
  if (!req.session.game) {
    return res.status(400).json({ message: "Start a game first." });
  }
  const moves = Number(req.body.moves);
  if (!Number.isInteger(moves) || moves < 0 || moves > 10000) {
    return res.status(400).json({ message: "Invalid move count." });
  }
  req.session.game.moves = moves;
  return res.json({ message: "Moves updated." });
}

module.exports = { startMemory, getChallenge, submitAnswer, recordMoves };
