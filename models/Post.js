const { query } = require('../config/database');

class Post {
  // Create a new post
  static async create({ title, slug, content, excerpt, featuredImage, status = 'draft', authorId, categoryId }) {
    try {
      const result = await query(
        `INSERT INTO posts (title, slug, content, excerpt, featured_image, status, author_id, category_id, published_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id, title, slug, content, excerpt, featured_image, status, author_id, category_id, views, likes, is_featured, published_at, created_at`,
        [title, slug, content, excerpt, featuredImage, status, authorId, categoryId, status === 'published' ? new Date() : null]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find post by ID with author and category details
  static async findById(id) {
    try {
      const result = await query(
        `SELECT 
          p.*,
          u.username as author_username,
          u.first_name as author_first_name,
          u.last_name as author_last_name,
          c.name as category_name,
          c.slug as category_slug,
          c.color as category_color
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find post by slug
  static async findBySlug(slug) {
    try {
      const result = await query(
        `SELECT 
          p.*,
          u.username as author_username,
          u.first_name as author_first_name,
          u.last_name as author_last_name,
          c.name as category_name,
          c.slug as category_slug,
          c.color as category_color
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = $1`,
        [slug]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get all posts with pagination and filters
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status = null,
        authorId = null,
        categoryId = null,
        search = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 1;

      // Build WHERE conditions
      if (status) {
        whereConditions.push(`p.status = $${paramCount}`);
        queryParams.push(status);
        paramCount++;
      }

      if (authorId) {
        whereConditions.push(`p.author_id = $${paramCount}`);
        queryParams.push(authorId);
        paramCount++;
      }

      if (categoryId) {
        whereConditions.push(`p.category_id = $${paramCount}`);
        queryParams.push(categoryId);
        paramCount++;
      }

      if (search) {
        whereConditions.push(`(p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Main query
      queryParams.push(limit, offset);
      const result = await query(
        `SELECT 
          p.*,
          u.username as author_username,
          u.first_name as author_first_name,
          u.last_name as author_last_name,
          c.name as category_name,
          c.slug as category_slug,
          c.color as category_color
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         LEFT JOIN categories c ON p.category_id = c.id
         ${whereClause}
         ORDER BY p.${sortBy} ${sortOrder}
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        queryParams
      );

      // Count query
      const countResult = await query(
        `SELECT COUNT(*) FROM posts p ${whereClause}`,
        queryParams.slice(0, -2) // Remove limit and offset params
      );
      const total = parseInt(countResult.rows[0].count);

      return {
        posts: result.rows,
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

  // Get published posts for public view
  static async findPublished(options = {}) {
    return await this.findAll({ ...options, status: 'published' });
  }

  // Get featured posts
  static async findFeatured(limit = 5) {
    try {
      const result = await query(
        `SELECT 
          p.*,
          u.username as author_username,
          u.first_name as author_first_name,
          u.last_name as author_last_name,
          c.name as category_name,
          c.slug as category_slug,
          c.color as category_color
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.status = 'published' AND p.is_featured = true
         ORDER BY p.published_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update post
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          // Convert camelCase to snake_case for database columns
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      // Set published_at if status is being changed to published
      if (updateData.status === 'published') {
        fields.push(`published_at = CURRENT_TIMESTAMP`);
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await query(
        `UPDATE posts SET ${fields.join(', ')} WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Delete post
  static async delete(id) {
    try {
      const result = await query('DELETE FROM posts WHERE id = $1 RETURNING id', [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Increment views
  static async incrementViews(id) {
    try {
      const result = await query(
        'UPDATE posts SET views = views + 1 WHERE id = $1 RETURNING views',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Toggle like
  static async toggleLike(id) {
    try {
      const result = await query(
        'UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING likes',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get post tags
  static async getTags(postId) {
    try {
      const result = await query(
        `SELECT t.* FROM tags t
         JOIN post_tags pt ON t.id = pt.tag_id
         WHERE pt.post_id = $1
         ORDER BY t.name`,
        [postId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Add tags to post
  static async addTags(postId, tagIds) {
    try {
      // First remove existing tags
      await query('DELETE FROM post_tags WHERE post_id = $1', [postId]);
      
      // Add new tags
      if (tagIds && tagIds.length > 0) {
        const values = tagIds.map((tagId, index) => `($1, $${index + 2})`).join(', ');
        const params = [postId, ...tagIds];
        
        await query(
          `INSERT INTO post_tags (post_id, tag_id) VALUES ${values}`,
          params
        );
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get recent posts
  static async getRecent(limit = 5) {
    try {
      const result = await query(
        `SELECT 
          p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published_at,
          u.username as author_username,
          c.name as category_name
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.status = 'published'
         ORDER BY p.published_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Post;