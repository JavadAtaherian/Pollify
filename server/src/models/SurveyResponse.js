const pool = require('../database');


class SurveyResponse {
  static async create(responseData) {
    const { survey_id, respondent_id, respondent_email, ip_address, user_agent } = responseData;
    const query = `
      INSERT INTO survey_responses (survey_id, respondent_id, respondent_email, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [survey_id, respondent_id, respondent_email, ip_address, user_agent]);
    return result.rows[0];
  }

  static async complete(responseId, answers) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Mark response as complete
      await client.query(
        'UPDATE survey_responses SET is_complete = true, completed_at = CURRENT_TIMESTAMP WHERE id = $1',
        [responseId]
      );

      // Save all answers
      for (const answer of answers) {
        await client.query(
          `INSERT INTO question_answers (response_id, question_id, answer_text, answer_value, selected_options)
           VALUES ($1, $2, $3, $4, $5)`,
          [responseId, answer.question_id, answer.answer_text, answer.answer_value, JSON.stringify(answer.selected_options)]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findBySurvey(surveyId) {
    const query = `
      SELECT sr.*, 
             COUNT(qa.id) as answer_count,
             u.name as respondent_name
      FROM survey_responses sr
      LEFT JOIN question_answers qa ON sr.id = qa.response_id
      LEFT JOIN users u ON sr.respondent_id = u.id
      WHERE sr.survey_id = $1
      GROUP BY sr.id, u.name
      ORDER BY sr.completed_at DESC
    `;
    const result = await pool.query(query, [surveyId]);
    return result.rows;
  }

  static async getResponseWithAnswers(responseId) {
    const responseQuery = 'SELECT * FROM survey_responses WHERE id = $1';
    const answersQuery = `
      SELECT qa.*, q.question_text, q.question_type
      FROM question_answers qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.response_id = $1
      ORDER BY q.order_index
    `;

    const [responseResult, answersResult] = await Promise.all([
      pool.query(responseQuery, [responseId]),
      pool.query(answersQuery, [responseId])
    ]);

    if (!responseResult.rows[0]) return null;

    return {
      ...responseResult.rows[0],
      answers: answersResult.rows
    };
  }

  /**
   * Return all survey responses for a survey along with each answer for the
   * associated questions. The results include respondent name/email and an
   * array of answers for each response. Answers are returned in the order
   * they appear in the survey (by question order).
   *
   * @param {number} surveyId The survey ID
   */
  static async findDetailedBySurvey(surveyId) {
    const query = `
      SELECT sr.*, u.name as respondent_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'question_id', qa.question_id,
                   'answer_text', qa.answer_text,
                   'answer_value', qa.answer_value,
                   'selected_options', qa.selected_options
                 ) ORDER BY qa.question_id
               ) FILTER (WHERE qa.id IS NOT NULL),
               '[]'::json
             ) as answers
      FROM survey_responses sr
      LEFT JOIN question_answers qa ON sr.id = qa.response_id
      LEFT JOIN users u ON sr.respondent_id = u.id
      WHERE sr.survey_id = $1
      GROUP BY sr.id, u.name
      ORDER BY sr.started_at
    `;
    const result = await pool.query(query, [surveyId]);
    return result.rows;
  }

  /**
   * Find a survey response by survey ID and respondent email. Returns the first
   * matching response or null if none exist. This is used to enforce
   * single-response-per-user when a survey does not allow multiple responses.
   *
   * @param {number} surveyId The survey ID
   * @param {string} email The respondent email
   */
  static async findBySurveyAndEmail(surveyId, email) {
    const query = `
      SELECT * FROM survey_responses
      WHERE survey_id = $1 AND respondent_email = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [surveyId, email]);
    return result.rows[0] || null;
  }
}

module.exports = SurveyResponse;


