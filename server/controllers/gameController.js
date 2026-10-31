
const User = require("../models/User");
const { getBananaQuestion } = require("../services/bananaService");

const FRUITS = [
  { symbol: "🍎", label: "Apple" },
  { symbol: "🍌", label: "Banana" },
  { symbol: "🍇", label: "Grapes" },
  { symbol: "🍊", label: "Orange" },
  { symbol: "🍓", label: "Strawberry" },
  { symbol: "🍉", label: "Watermelon" },
  { symbol: "🍍", label: "Pineapple" },
  { symbol: "🥝", label: "Kiwi" },
  { symbol: "🍒", label: "Cherries" },
  { symbol: "🥭", label: "Mango" },
  { symbol: "🍑", label: "Peach" },
  { symbol: "🍐", label: "Pear" },
  { symbol: "🫐", label: "Blueberry" },
  { symbol: "🥥", label: "Coconut" },
  { symbol: "🍋", label: "Lemon" },
  { symbol: "🍈", label: "Melon" }
];

const LEVELS = {
  1: { pairs: 2, cards: 4 },
  2: { pairs: 3, cards: 6 },
  3: { pairs: 4, cards: 8 },
  4: { pairs: 6, cards: 12 },
  5: { pairs: 8, cards: 16 }
};

const MAX_LEVEL = 5;

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// GET PLAYER PROGRESS
async function getProgress(req, res) {
  try {
    const user = await User.findById(req.session.user.id)
      .select("highestLevel");

    if (!user) {
      return res.status(404).json({ message: "Player not found." });
    }

    const currentLevel = Math.max(
      1,
      Math.min(MAX_LEVEL, Number(user.highestLevel) || 1)
    );

    return res.json({
      currentLevel,
      maxLevel: MAX_LEVEL,
      levels: LEVELS
    });

  } catch (error) {
    console.error("Progress error:", error.message);
    return res.status(500).json({
      message: "Could not load progress."
    });
  }
}

// START MEMORY GAME
async function startMemory(req, res) {
  try {
    const user = await User.findById(req.session.user.id)
      .select("highestLevel");

    if (!user) {
      return res.status(404).json({ message: "Player not found." });
    }

    const highestLevel = Math.max(
      1,
      Math.min(MAX_LEVEL, Number(user.highestLevel) || 1)
    );

    const requestedLevel = Number(
      req.body.level || highestLevel
    );

    if (
      !Number.isInteger(requestedLevel) ||
      requestedLevel < 1 ||
      requestedLevel > highestLevel
    ) {
      return res.status(403).json({
        message: "Complete the previous level first."
      });
    }

    const config = LEVELS[requestedLevel];

    const selectedFruits = shuffle(FRUITS).slice(
      0,
      config.pairs
    );

    const cards = shuffle(
      selectedFruits.flatMap((fruit, index) => [
        {
          id: `${requestedLevel}-${index}-a`,
          pairId: `pair-${index}`,
          symbol: fruit.symbol,
          label: fruit.label
        },
        {
          id: `${requestedLevel}-${index}-b`,
          pairId: `pair-${index}`,
          symbol: fruit.symbol,
          label: fruit.label
        }
      ])
    );

    req.session.game = {
      phase: "memory",
      level: requestedLevel,
      cards: cards.map(({ id, pairId }) => ({ id, pairId })),
      matchedCardIds: [],
      moves: 0,
      startedAt: Date.now(),
      challengePuzzle: null
    };

    return res.json({
      level: requestedLevel,
      totalPairs: config.pairs,
      totalCards: config.cards,
      cards: cards.map(({ id, symbol, label }) => ({
        id,
        symbol,
        label
      }))
    });

  } catch (error) {
    console.error("Start game error:", error.message);

    return res.status(500).json({
      message: "Could not start the memory game."
    });
  }
}

// CHECK TWO SELECTED CARDS
async function submitTurn(req, res) {
  const game = req.session.game;

  if (!game || game.phase !== "memory") {
    return res.status(400).json({
      message: "Start a level before playing."
    });
  }

  const firstId = String(req.body.firstCardId || "");
  const secondId = String(req.body.secondCardId || "");

  if (!firstId || !secondId || firstId === secondId) {
    return res.status(400).json({
      message: "Choose two different cards."
    });
  }

  const first = game.cards.find(card => card.id === firstId);
  const second = game.cards.find(card => card.id === secondId);

  if (
    !first ||
    !second ||
    game.matchedCardIds.includes(firstId) ||
    game.matchedCardIds.includes(secondId)
  ) {
    return res.status(400).json({
      message: "Invalid card selection."
    });
  }

  game.moves++;

  const matched = first.pairId === second.pairId;

  if (matched) {
    game.matchedCardIds.push(firstId, secondId);
  }

  const memoryComplete =
    game.matchedCardIds.length === LEVELS[game.level].cards;

  // ALL FRUIT PAIRS MATCHED: LOAD ONE BANANA PUZZLE
  if (memoryComplete) {
    try {
      const puzzle = await getBananaQuestion();

      game.challengePuzzle = puzzle;
      game.phase = "puzzle";

      return res.json({
        matched: true,
        moves: game.moves,
        memoryComplete: true,
        levelComplete: false,
        puzzleQuestion: puzzle.question,
        message: "Solve the Banana puzzle to complete the level!"
      });

    } catch (error) {
      console.error("Banana puzzle error:", error.message);

      game.challengePuzzle = null;

      return res.status(502).json({
        matched: true,
        moves: game.moves,
        memoryComplete: true,
        puzzleUnavailable: true,
        message: "Puzzle unavailable. Please retry."
      });
    }
  }

  return res.json({
    matched,
    moves: game.moves,
    memoryComplete: false,
    matchedPairs: game.matchedCardIds.length / 2,
    totalPairs: LEVELS[game.level].pairs
  });
}

// RETRY BANANA PUZZLE
async function retryBananaPuzzle(req, res) {
  const game = req.session.game;

  if (
    !game ||
    game.phase !== "memory" ||
    !LEVELS[game.level] ||
    game.matchedCardIds.length !== LEVELS[game.level].cards
  ) {
    return res.status(400).json({
      message: "Finish the memory game first."
    });
  }

  try {
    const puzzle = await getBananaQuestion();

    game.challengePuzzle = puzzle;
    game.phase = "puzzle";

    return res.json({
      puzzleQuestion: puzzle.question,
      message: "Banana puzzle loaded."
    });

  } catch (error) {
    console.error("Puzzle retry error:", error.message);

    return res.status(502).json({
      message: "Could not load puzzle. Try again."
    });
  }
}

// CHECK BANANA PUZZLE ANSWER
async function submitPuzzleAnswer(req, res) {
  const game = req.session.game;

  if (
    !game ||
    game.phase !== "puzzle" ||
    !game.challengePuzzle
  ) {
    return res.status(400).json({
      message: "No active Banana puzzle."
    });
  }

  const answer = String(req.body.answer ?? "").trim();
  const correctAnswer = String(
    game.challengePuzzle.solution
  ).trim();

  if (!answer) {
    return res.status(400).json({
      message: "Enter your answer."
    });
  }

  if (answer !== correctAnswer) {
    return res.status(400).json({
      correct: false,
      message: "Incorrect answer. Try again!"
    });
  }

  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Player not found."
      });
    }

    const completedLevel = game.level;

    const currentHighest = Math.max(
      1,
      Math.min(MAX_LEVEL, Number(user.highestLevel) || 1)
    );

    if (
      completedLevel < MAX_LEVEL &&
      currentHighest <= completedLevel
    ) {
      user.highestLevel = completedLevel + 1;
      await user.save();
    }

    game.phase = "complete";

    return res.json({
      correct: true,
      levelComplete: true,
      level: completedLevel,
      unlockedLevel: Math.max(
        currentHighest,
        Number(user.highestLevel) || 1
      ),
      maxLevel: MAX_LEVEL,
      moves: game.moves,
      elapsedSeconds: Math.max(
        1,
        Math.round((Date.now() - game.startedAt) / 1000)
      ),
      message: "Correct! Level completed!"
    });

  } catch (error) {
    console.error("Answer checking error:", error.message);

    return res.status(500).json({
      message: "Could not save your progress."
    });
  }
}

// GET CURRENT GAME STATUS
function getGameStatus(req, res) {
  const game = req.session.game;

  if (!game) {
    return res.json({ active: false });
  }

  return res.json({
    active: game.phase === "memory" || game.phase === "puzzle",
    phase: game.phase,
    level: game.level,
    moves: game.moves,
    matchedPairs: game.matchedCardIds.length / 2,
    totalPairs: LEVELS[game.level].pairs
  });
}

// EXPORT ALL FUNCTIONS
module.exports = {
  getProgress,
  startMemory,
  submitTurn,
  submitPuzzleAnswer,
  retryBananaPuzzle,
  getGameStatus
};
