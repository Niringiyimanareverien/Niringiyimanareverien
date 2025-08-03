const { query } = require('../config/database');

class Category {
  // Create a new category
  static async create({ name, slug, description, color = '#6366f1' }) {
    try {
      const result = await query(
        `INSERT INTO categories (name, slug, description, color) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, slug, description, color]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find category by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM categories WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find category by slug
  static async findBySlug(slug) {
    try {
      const result = await query(
        'SELECT * FROM categories WHERE slug = $1',
        [slug]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get all categories with post counts
  static async findAll() {
    try {
      const result = await query(
        `SELECT 
          c.*,
          COUNT(p.id) as post_count
         FROM categories c
         LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
         GROUP BY c.id
         ORDER BY c.name ASC`
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update category
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
        `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Delete category
  static async delete(id) {
    try {
      const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get category with posts
  static async getWithPosts(slug, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Get category
      const category = await this.findBySlug(slug);
      if (!category) return null;

      // Get posts in this category
      const postsResult = await query(
        `SELECT 
          p.*,
          u.username as author_username,
          u.first_name as author_first_name,
          u.last_name as author_last_name
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         WHERE p.category_id = $1 AND p.status = 'published'
         ORDER BY p.published_at DESC
         LIMIT $2 OFFSET $3`,
        [category.id, limit, offset]
      );

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM posts WHERE category_id = $1 AND status = $2',
        [category.id, 'published']
      );
      const total = parseInt(countResult.rows[0].count);

      return {
        category,
        posts: postsResult.rows,
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
}

module.exports = Category;