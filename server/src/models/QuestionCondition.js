const pool = require('../database');


class QuestionCondition {
  static async create(conditionData) {
    const { survey_id, source_question_id, target_question_id, condition_type, condition_operator, condition_value } = conditionData;
    const query = `
      INSERT INTO question_conditions (survey_id, source_question_id, target_question_id, condition_type, condition_operator, condition_value)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [survey_id, source_question_id, target_question_id, condition_type, condition_operator, condition_value]);
    return result.rows[0];
  }

  static async findBySurvey(surveyId) {
    const query = 'SELECT * FROM question_conditions WHERE survey_id = $1 ORDER BY source_question_id';
    const result = await pool.query(query, [surveyId]);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM question_conditions WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = QuestionCondition;
