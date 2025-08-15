const express = require('express');
const surveysRouter = require('./surveys');
const questionsRouter = require('./questions');
const conditionsRouter = require('./conditions');
const responsesRouter = require('./responses');
const authRouter = require('./auth');

const router = express.Router();

router.use('/surveys', surveysRouter);
router.use('/questions', questionsRouter);
router.use('/conditions', conditionsRouter);
router.use('/responses', responsesRouter);
router.use('/auth', authRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;