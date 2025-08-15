const express = require('express');
const { SurveyResponse, Survey } = require('../models');
const router = express.Router();

// Start a survey response
router.post('/start', async (req, res) => {
  try {
    const { survey_id, respondent_id, respondent_email } = req.body;
    const surveyIdNum = Number(survey_id);
    // Fetch the survey to check flags
    const survey = await Survey.findById(surveyIdNum);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }
    // If the survey requires login, ensure an email is provided
    if (survey.requires_login && (!respondent_email || respondent_email.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Email is required to respond to this survey'
      });
    }
    // If multiple responses are not allowed and an email is provided, check for existing responses
    if (survey.requires_login && !survey.allow_multiple_responses && respondent_email) {
      const existing = await SurveyResponse.findBySurveyAndEmail(surveyIdNum, respondent_email);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'You have already submitted a response to this survey'
        });
      }
    }
    const responseData = {
      survey_id: surveyIdNum,
      respondent_id: respondent_id || null,
      respondent_email: respondent_email || null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };
    const response = await SurveyResponse.create(responseData);
    return res.status(201).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Start response error:', error);
    return res.status(500).json({
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