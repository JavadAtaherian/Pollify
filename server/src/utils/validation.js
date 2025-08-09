// server/src/utils/validation.js
const QUESTION_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  DROPDOWN: 'dropdown',
  RATING: 'rating',
  SCALE: 'scale',
  DATE: 'date',
  EMAIL: 'email',
  NUMBER: 'number',
  FILE: 'file'
};

const CONDITION_TYPES = {
  SHOW_IF: 'show_if',
  HIDE_IF: 'hide_if',
  SKIP_TO: 'skip_to'
};

const CONDITION_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_EQUAL: 'greater_equal',
  LESS_EQUAL: 'less_equal',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty'
};

function validateSurveyData(data) {
  const errors = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (data.title && data.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }

  if (data.creator_id && !Number.isInteger(Number(data.creator_id))) {
    errors.push('Creator ID must be a valid integer');
  }

  return errors;
}

function validateQuestionData(data) {
  const errors = [];

  if (!data.question_text || data.question_text.trim().length === 0) {
    errors.push('Question text is required');
  }

  if (!data.question_type || !Object.values(QUESTION_TYPES).includes(data.question_type)) {
    errors.push('Valid question type is required');
  }

  if (!Number.isInteger(Number(data.survey_id))) {
    errors.push('Survey ID must be a valid integer');
  }

  if (!Number.isInteger(Number(data.order_index))) {
    errors.push('Order index must be a valid integer');
  }

  // Validate options for choice-based questions
  const choiceTypes = [QUESTION_TYPES.RADIO, QUESTION_TYPES.CHECKBOX, QUESTION_TYPES.DROPDOWN];
  if (choiceTypes.includes(data.question_type)) {
    if (!data.options || !Array.isArray(data.options) || data.options.length === 0) {
      errors.push(`${data.question_type} questions must have at least one option`);
    }
  }

  // Validate rating/scale questions
  if (data.question_type === QUESTION_TYPES.RATING || data.question_type === QUESTION_TYPES.SCALE) {
    if (!data.validation_rules || !data.validation_rules.max_value) {
      errors.push(`${data.question_type} questions must have a maximum value`);
    }
  }

  return errors;
}

function validateConditionData(data) {
  const errors = [];

  if (!Number.isInteger(Number(data.survey_id))) {
    errors.push('Survey ID must be a valid integer');
  }

  if (!Number.isInteger(Number(data.source_question_id))) {
    errors.push('Source question ID must be a valid integer');
  }

  if (!Number.isInteger(Number(data.target_question_id))) {
    errors.push('Target question ID must be a valid integer');
  }

  if (data.source_question_id === data.target_question_id) {
    errors.push('Source and target questions cannot be the same');
  }

  if (!Object.values(CONDITION_TYPES).includes(data.condition_type)) {
    errors.push('Valid condition type is required');
  }

  if (!Object.values(CONDITION_OPERATORS).includes(data.condition_operator)) {
    errors.push('Valid condition operator is required');
  }

  if (!data.condition_value) {
    errors.push('Condition value is required');
  }

  return errors;
}

function validateAnswerData(data) {
  const errors = [];

  if (!Number.isInteger(Number(data.question_id))) {
    errors.push('Question ID must be a valid integer');
  }

  // At least one form of answer must be provided
  if (!data.answer_text && !data.answer_value && !data.selected_options) {
    errors.push('Answer data is required');
  }

  return errors;
}