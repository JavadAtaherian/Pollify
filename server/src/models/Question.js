const pool = require('../database');

class Question {
  static async create(questionData) {
    const { survey_id, question_text, question_type, is_required, order_index, options, validation_rules } = questionData;
    const query = `
      INSERT INTO questions (survey_id, question_text, question_type, is_required, order_index, options, validation_rules)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [
      survey_id, question_text, question_type, is_required, order_index, 
      JSON.stringify(options), JSON.stringify(validation_rules)
    ]);
    return result.rows[0];
  }

  static async createWithOptions(questionData, optionsArray) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create question
      const questionQuery = `
        INSERT INTO questions (survey_id, question_text, question_type, is_required, order_index, validation_rules)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const questionResult = await client.query(questionQuery, [
        questionData.survey_id, questionData.question_text, questionData.question_type,
        questionData.is_required, questionData.order_index, JSON.stringify(questionData.validation_rules)
      ]);
      
      const question = questionResult.rows[0];

      // Create options if provided
      if (optionsArray && optionsArray.length > 0) {
        for (let i = 0; i < optionsArray.length; i++) {
          const option = optionsArray[i];
          await client.query(
            'INSERT INTO question_options (question_id, option_text, option_value, order_index) VALUES ($1, $2, $3, $4)',
            [question.id, option.text, option.value || option.text, i]
          );
        }
      }

      await client.query('COMMIT');
      return question;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`);
    const query = `UPDATE questions SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const values = [id, ...Object.values(updateData)];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM questions WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async reorderQuestions(surveyId, questionOrders) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const { questionId, orderIndex } of questionOrders) {
        await client.query(
          'UPDATE questions SET order_index = $1 WHERE id = $2 AND survey_id = $3',
          [orderIndex, questionId, surveyId]
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
}

module.exports = Question;
