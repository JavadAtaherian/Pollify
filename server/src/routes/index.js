const express = require('express');
const surveysRouter = require('./surveys');
const questionsRouter = require('./questions');
const conditionsRouter = require('./conditions');
const responsesRouter = require('./responses');

const router = express.Router();

router.use('/surveys', surveysRouter);
router.use('/questions', questionsRouter);
router.use('/conditions', conditionsRouter);
router.use('/responses', responsesRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;