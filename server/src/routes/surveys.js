const express = require('express');
const { Survey, Question, QuestionCondition } = require('../models');
const router = express.Router();

// Create a new survey
router.post('/', async (req, res) => {
  try {
    const surveyData = {
      title: req.body.title,
      description: req.body.description,
      creator_id: req.body.creator_id, // In real app, get from JWT token
      // Respect explicit boolean values from the client. Default to true for
      // is_active when unspecified. Use double negation to cast to boolean
      // for the other flags so undefined becomes false.
      is_active: typeof req.body.is_active === 'boolean' ? req.body.is_active : true,
      allow_multiple_responses: !!req.body.allow_multiple_responses,
      requires_login: !!req.body.requires_login
    };

    const survey = await Survey.create(surveyData);
    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create survey'
    });
  }
});

// Get all surveys by creator
router.get('/creator/:creator_id', async (req, res) => {
  try {
    const surveys = await Survey.findByCreator(req.params.creator_id);
    res.json({
      success: true,
      data: surveys
    });
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch surveys'
    });
  }
});

// Get survey with questions and conditions
router.get('/:id', async (req, res) => {
  try {
    const survey = await Survey.getSurveyWithQuestions(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch survey'
    });
  }
});

// Update survey
router.put('/:id', async (req, res) => {
  try {
    const updateData = {};
    const allowedFields = ['title', 'description', 'is_active', 'allow_multiple_responses', 'requires_login'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const survey = await Survey.update(req.params.id, updateData);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update survey'
    });
  }
});

// Delete survey
router.delete('/:id', async (req, res) => {
  try {
    const survey = await Survey.delete(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    res.json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete survey'
    });
  }
});

module.exports = router;