// server/src/models/index.js
const Survey = require('./Survey');
const Question = require('./Question');
const QuestionCondition = require('./QuestionCondition');
const SurveyResponse = require('./SurveyResponse');
const User = require('./User');

module.exports = {
  Survey,
  Question,
  QuestionCondition,
  SurveyResponse,
  User
};