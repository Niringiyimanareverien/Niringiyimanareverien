const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create({ username, email, password, firstName, lastName, bio, role = 'user' }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO users (username, email, password, first_name, last_name, bio, role) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, username, email, first_name, last_name, bio, role, is_active, created_at`,
        [username, email, hashedPassword, firstName, lastName, bio, role]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT id, username, email, first_name, last_name, bio, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await query(
        `SELECT id, username, email, first_name, last_name, bio, avatar_url, role, is_active, created_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      const countResult = await query('SELECT COUNT(*) FROM users');
      const total = parseInt(countResult.rows[0].count);
      
      return {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} 
         RETURNING id, username, email, first_name, last_name, bio, avatar_url, role, is_active, updated_at`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Change password
  static async changePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const result = await query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [hashedPassword, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get user stats
  static async getStats(userId) {
    try {
      const result = await query(
        `SELECT 
          COUNT(CASE WHEN posts.status = 'published' THEN 1 END) as published_posts,
          COUNT(CASE WHEN posts.status = 'draft' THEN 1 END) as draft_posts,
          COALESCE(SUM(posts.views), 0) as total_views,
          COALESCE(SUM(posts.likes), 0) as total_likes
         FROM posts 
         WHERE posts.author_id = $1`,
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;