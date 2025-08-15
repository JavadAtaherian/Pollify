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

// Get detailed responses for a survey (including answers)
router.get('/survey/:survey_id/detailed', async (req, res) => {
  try {
    const responses = await SurveyResponse.findDetailedBySurvey(req.params.survey_id);
    res.json({
      success: true,
      data: responses
    });
  } catch (error) {
    console.error('Get detailed responses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detailed responses'
    });
  }
});

// Export all responses for a survey as CSV
router.get('/survey/:survey_id/export', async (req, res) => {
  try {
    const surveyId = req.params.survey_id;
    // Load survey with questions
    const survey = await Survey.getSurveyWithQuestions(surveyId);
    if (!survey) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    // Load detailed responses including answers
    const responses = await SurveyResponse.findDetailedBySurvey(surveyId);
    // Generate CSV header: fixed respondent fields + question texts and response times
    // Each question produces two columns: answer value and timestamp
    const header = [
      'Respondent',
      'Respondent Email',
      'Started At',
      'Completed At',
      'Status',
      ...survey.questions.flatMap((q) => [q.question_text, `${q.question_text} - Time`])
    ];
    // Helper to escape CSV values
    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';
      const string = String(value).replace(/"/g, '""');
      if (/[",\n]/.test(string)) {
        return `"${string}"`;
      }
      return string;
    };
    // Build rows
    const rows = responses.map((resp) => {
      const row = [];
      // Respondent name/email and timestamps
      row.push(resp.respondent_name || resp.respondent_email || 'Anonymous');
      row.push(resp.respondent_email || '');
      row.push(resp.started_at);
      row.push(resp.completed_at || '');
      row.push(resp.is_complete ? 'Completed' : 'In Progress');
      // Answers per question (in order): push both the value and the timestamp
      survey.questions.forEach((q) => {
        const ans = resp.answers?.find((a) => a.question_id === q.id);
        let val = '';
        let time = '';
        if (ans) {
          // Determine answer value
          if (ans.selected_options && ans.selected_options.length > 0) {
            try {
              const opts = Array.isArray(ans.selected_options)
                ? ans.selected_options
                : JSON.parse(ans.selected_options);
              val = opts.join('; ');
            } catch (e) {
              val = ans.selected_options;
            }
          } else if (ans.answer_value) {
            val = ans.answer_value;
          } else if (ans.answer_text) {
            val = ans.answer_text;
          }
          // Response timestamp
          time = ans.created_at || '';
        }
        row.push(val);
        row.push(time);
      });
      return row;
    });
    const csvLines = [header, ...rows].map((row) => row.map(escapeCsv).join(','));
    const csvContent = csvLines.join('\n');
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="survey_${surveyId}_responses.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Export responses error:', error);
    return res.status(500).json({ success: false, error: 'Failed to export survey responses' });
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