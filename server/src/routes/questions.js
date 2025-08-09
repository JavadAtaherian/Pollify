const express = require('express');
const { Question, QuestionCondition } = require('../models');
const router = express.Router();

// Add question to survey
router.post('/', async (req, res) => {
  try {
    const questionData = {
      survey_id: req.body.survey_id,
      question_text: req.body.question_text,
      question_type: req.body.question_type,
      is_required: req.body.is_required || false,
      order_index: req.body.order_index,
      validation_rules: req.body.validation_rules || {}
    };

    let question;
    if (req.body.options && req.body.options.length > 0) {
      question = await Question.createWithOptions(questionData, req.body.options);
    } else {
      question = await Question.create(questionData);
    }

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create question'
    });
  }
});

// Update question
router.put('/:id', async (req, res) => {
  try {
    const updateData = {};
    const allowedFields = ['question_text', 'question_type', 'is_required', 'order_index', 'options', 'validation_rules'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'options' || field === 'validation_rules') {
          updateData[field] = JSON.stringify(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const question = await Question.update(req.params.id, updateData);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update question'
    });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.delete(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete question'
    });
  }
});

// Reorder questions
router.put('/reorder/:survey_id', async (req, res) => {
  try {
    const { questionOrders } = req.body; // Array of {questionId, orderIndex}
    await Question.reorderQuestions(req.params.survey_id, questionOrders);
    
    res.json({
      success: true,
      message: 'Questions reordered successfully'
    });
  } catch (error) {
    console.error('Reorder questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder questions'
    });
  }
});

module.exports = router;