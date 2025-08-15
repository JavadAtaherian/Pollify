// server/src/models/User.js
const pool = require('../database');
const crypto = require('crypto');

/**
 * Helper function to hash a password. Uses SHA-256 for simplicity.
 * In a production system you should use a stronger algorithm (e.g. bcrypt).
 *
 * @param {string} password The plaintext password
 * @returns {string} A hex-encoded SHA-256 hash
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

class User {
  /**
   * Create a new user in the database. Expects an object with
   * `email`, `password`, `name` and optional `role`. The password will
   * automatically be hashed before storage. Returns the created user row.
   *
   * @param {Object} data The user data
   */
  static async createUser(data) {
    const { email, password, name, role = 'admin' } = data;
    // Compute password hash
    const passwordHash = hashPassword(password);
    const query = `
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role
    `;
    const result = await pool.query(query, [email, passwordHash, name, role]);
    return result.rows[0];
  }

  /**
   * Find a user by email. Returns the full user record including
   * password_hash.
   *
   * @param {string} email The user email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find a user by id. Returns the full user record.
   *
   * @param {number} id The user ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Compare a plaintext password with a stored password hash. Returns true
   * if they match, false otherwise.
   *
   * @param {string} password The plaintext password provided by the user
   * @param {string} storedHash The stored password hash from the database
   */
  static verifyPassword(password, storedHash) {
    const hashed = hashPassword(password);
    return hashed === storedHash;
  }
}

module.exports = User;