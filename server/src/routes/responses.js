const express = require('express');
const { SurveyResponse } = require('../models');
const router = express.Router();

// Start a survey response
router.post('/start', async (req, res) => {
  try {
    const responseData = {
      survey_id: req.body.survey_id,
      respondent_id: req.body.respondent_id || null,
      respondent_email: req.body.respondent_email || null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };

    const response = await SurveyResponse.create(responseData);
    res.status(201).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Start response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start survey response'
    });
  }
});

// Submit complete survey response
router.post('/:response_id/submit', async (req, res) => {
  try {
    const { answers } = req.body;
    await SurveyResponse.complete(req.params.response_id, answers);
    
    res.json({
      success: true,
      message: 'Survey response submitted successfully'
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit survey response'
    });
  }
});

// Get all responses for a survey
router.get('/survey/:survey_id', async (req, res) => {
  try {
    const responses = await SurveyResponse.findBySurvey(req.params.survey_id);
    res.json({
      success: true,
      data: responses
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch responses'
    });
  }
});

// Get specific response with answers
router.get('/:id', async (req, res) => {
  try {
    const response = await SurveyResponse.getResponseWithAnswers(req.params.id);
    if (!response) {
      return res.status(404).json({
        success: false,
        error: 'Response not found'
      });
    }

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch response'
    });
  }
});

module.exports = router;