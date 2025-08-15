// server/src/models/Survey.js
const pool = require('../database');

class Survey {
  static async create(surveyData) {
    const { title, description, creator_id, is_active, allow_multiple_responses, requires_login } = surveyData;
    const query = `
      INSERT INTO surveys (title, description, creator_id, is_active, allow_multiple_responses, requires_login)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [title, description, creator_id, is_active, allow_multiple_responses, requires_login]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM surveys WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByCreator(creator_id) {
    const query = `
      SELECT s.*, u.name as creator_name,
             COALESCE(COUNT(sr.id), 0) AS response_count
      FROM surveys s
      JOIN users u ON s.creator_id = u.id
      LEFT JOIN survey_responses sr ON sr.survey_id = s.id
      WHERE s.creator_id = $1
      GROUP BY s.id, u.name
      ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query, [creator_id]);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`);
    const query = `
      UPDATE surveys 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;
    const values = [id, ...Object.values(updateData)];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM surveys WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getSurveyWithQuestions(surveyId) {
    const surveyQuery = 'SELECT * FROM surveys WHERE id = $1';
    const questionsQuery = `
      SELECT q.*, 
             COALESCE(
               json_agg(
                 json_build_object('id', qo.id, 'text', qo.option_text, 'value', qo.option_value)
                 ORDER BY qo.order_index
               ) FILTER (WHERE qo.id IS NOT NULL), 
               '[]'::json
             ) as options
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.survey_id = $1
      GROUP BY q.id
      ORDER BY q.order_index
    `;
    
    const conditionsQuery = `
      SELECT * FROM question_conditions 
      WHERE survey_id = $1
      ORDER BY source_question_id
    `;

    const [surveyResult, questionsResult, conditionsResult] = await Promise.all([
      pool.query(surveyQuery, [surveyId]),
      pool.query(questionsQuery, [surveyId]),
      pool.query(conditionsQuery, [surveyId])
    ]);

    if (!surveyResult.rows[0]) return null;

    return {
      ...surveyResult.rows[0],
      questions: questionsResult.rows,
      conditions: conditionsResult.rows
    };
  }
}

module.exports = Survey;
