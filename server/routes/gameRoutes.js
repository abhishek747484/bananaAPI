const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  startMemory,
  getChallenge,
  submitAnswer,
  recordMoves
} = require("../controllers/gameController");

const router = express.Router();

router.use(requireAuth);
router.post("/start", startMemory);
router.post("/moves", recordMoves);
router.get("/banana-challenge", getChallenge);
router.post("/banana-answer", submitAnswer);

module.exports = router;
