const express = require('express');
const { QuestionCondition } = require('../models');
const router = express.Router();

// Add condition to question
router.post('/', async (req, res) => {
  try {
    const conditionData = {
      survey_id: req.body.survey_id,
      source_question_id: req.body.source_question_id,
      target_question_id: req.body.target_question_id,
      condition_type: req.body.condition_type, // 'show_if', 'hide_if', 'skip_to'
      condition_operator: req.body.condition_operator, // 'equals', 'not_equals', etc.
      condition_value: req.body.condition_value
    };

    const condition = await QuestionCondition.create(conditionData);
    res.status(201).json({
      success: true,
      data: condition
    });
  } catch (error) {
    console.error('Create condition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create condition'
    });
  }
});

// Get conditions for survey
router.get('/survey/:survey_id', async (req, res) => {
  try {
    const conditions = await QuestionCondition.findBySurvey(req.params.survey_id);
    res.json({
      success: true,
      data: conditions
    });
  } catch (error) {
    console.error('Get conditions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conditions'
    });
  }
});

// Delete condition
router.delete('/:id', async (req, res) => {
  try {
    const condition = await QuestionCondition.delete(req.params.id);
    if (!condition) {
      return res.status(404).json({
        success: false,
        error: 'Condition not found'
      });
    }

    res.json({
      success: true,
      message: 'Condition deleted successfully'
    });
  } catch (error) {
    console.error('Delete condition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete condition'
    });
  }
});

module.exports = router;