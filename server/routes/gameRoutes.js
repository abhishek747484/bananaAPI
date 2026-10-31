
const express = require("express");

const { requireAuth } = require("../middleware/authMiddleware");

const {
  getProgress,
  startMemory,
  submitTurn,
  submitPuzzleAnswer,
  retryBananaPuzzle,
  getGameStatus
} = require("../controllers/gameController");

const router = express.Router();

router.use(requireAuth);

router.get("/progress", getProgress);
router.get("/status", getGameStatus);

router.post("/start", startMemory);
router.post("/turn", submitTurn);
router.post("/puzzle-answer", submitPuzzleAnswer);
router.post("/retry-puzzle", retryBananaPuzzle);

module.exports = router;
