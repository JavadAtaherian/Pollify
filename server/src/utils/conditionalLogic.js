class ConditionalLogicEngine {
  static evaluateCondition(condition, answerValue, answerOptions = []) {
    const { condition_operator, condition_value } = condition;

    switch (condition_operator) {
      case CONDITION_OPERATORS.EQUALS:
        return this.equals(answerValue, condition_value);
      
      case CONDITION_OPERATORS.NOT_EQUALS:
        return !this.equals(answerValue, condition_value);
      
      case CONDITION_OPERATORS.CONTAINS:
        return this.contains(answerValue, answerOptions, condition_value);
      
      case CONDITION_OPERATORS.NOT_CONTAINS:
        return !this.contains(answerValue, answerOptions, condition_value);
      
      case CONDITION_OPERATORS.GREATER_THAN:
        return this.greaterThan(answerValue, condition_value);
      
      case CONDITION_OPERATORS.LESS_THAN:
        return this.lessThan(answerValue, condition_value);
      
      case CONDITION_OPERATORS.GREATER_EQUAL:
        return this.greaterEqual(answerValue, condition_value);
      
      case CONDITION_OPERATORS.LESS_EQUAL:
        return this.lessEqual(answerValue, condition_value);
      
      case CONDITION_OPERATORS.IS_EMPTY:
        return this.isEmpty(answerValue, answerOptions);
      
      case CONDITION_OPERATORS.IS_NOT_EMPTY:
        return !this.isEmpty(answerValue, answerOptions);
      
      default:
        return false;
    }
  }

  static equals(answerValue, conditionValue) {
    return String(answerValue).toLowerCase() === String(conditionValue).toLowerCase();
  }

  static contains(answerValue, answerOptions, conditionValue) {
    if (answerOptions && answerOptions.length > 0) {
      return answerOptions.some(option => 
        String(option).toLowerCase().includes(String(conditionValue).toLowerCase())
      );
    }
    return String(answerValue).toLowerCase().includes(String(conditionValue).toLowerCase());
  }

  static greaterThan(answerValue, conditionValue) {
    const numAnswer = Number(answerValue);
    const numCondition = Number(conditionValue);
    return !isNaN(numAnswer) && !isNaN(numCondition) && numAnswer > numCondition;
  }

  static lessThan(answerValue, conditionValue) {
    const numAnswer = Number(answerValue);
    const numCondition = Number(conditionValue);
    return !isNaN(numAnswer) && !isNaN(numCondition) && numAnswer < numCondition;
  }

  static greaterEqual(answerValue, conditionValue) {
    const numAnswer = Number(answerValue);
    const numCondition = Number(conditionValue);
    return !isNaN(numAnswer) && !isNaN(numCondition) && numAnswer >= numCondition;
  }

  static lessEqual(answerValue, conditionValue) {
    const numAnswer = Number(answerValue);
    const numCondition = Number(conditionValue);
    return !isNaN(numAnswer) && !isNaN(numCondition) && numAnswer <= numCondition;
  }

  static isEmpty(answerValue, answerOptions) {
    if (answerOptions && answerOptions.length > 0) {
      return answerOptions.length === 0;
    }
    return !answerValue || String(answerValue).trim() === '';
  }

  static processConditionalLogic(questions, answers, conditions) {
    const visibleQuestions = [];
    const answerMap = new Map();

    // Create answer lookup map
    answers.forEach(answer => {
      answerMap.set(answer.question_id, answer);
    });

    // Process each question
    questions.forEach(question => {
      let shouldShow = true;
      
      // Check all conditions that target this question
      const relevantConditions = conditions.filter(c => c.target_question_id === question.id);
      
      for (const condition of relevantConditions) {
        const sourceAnswer = answerMap.get(condition.source_question_id);
        
        if (sourceAnswer) {
          const conditionMet = this.evaluateCondition(
            condition,
            sourceAnswer.answer_value || sourceAnswer.answer_text,
            sourceAnswer.selected_options
          );

          if (condition.condition_type === CONDITION_TYPES.SHOW_IF) {
            shouldShow = shouldShow && conditionMet;
          } else if (condition.condition_type === CONDITION_TYPES.HIDE_IF) {
            shouldShow = shouldShow && !conditionMet;
          }
        } else {
          // If source answer doesn't exist, handle based on condition type
          if (condition.condition_type === CONDITION_TYPES.SHOW_IF) {
            shouldShow = false;
          }
        }
      }

      if (shouldShow) {
        visibleQuestions.push(question);
      }
    });

    return visibleQuestions;
  }
}

module.exports = {
  QUESTION_TYPES,
  CONDITION_TYPES,
  CONDITION_OPERATORS,
  validateSurveyData,
  validateQuestionData,
  validateConditionData,
  validateAnswerData,
  ConditionalLogicEngine
};