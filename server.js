const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import database and models
const { testConnection } = require('./config/database');
const User = require('./models/User');
const Post = require('./models/Post');
const Category = require('./models/Category');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};

// Success response helper
const successResponse = (res, data, message = 'Success') => {
  res.json({
    success: true,
    message,
    data
  });
};

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      success: true,
      message: 'Server is running',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// USER ROUTES
// Get all users
app.get('/api/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await User.findAll(parseInt(page), parseInt(limit));
    successResponse(res, result, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    successResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Create new user
app.post('/api/users', async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, bio, role } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      bio,
      role
    });

    successResponse(res, user, 'User created successfully');
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    next(error);
  }
});

// Update user
app.put('/api/users/:id', async (req, res, next) => {
  try {
    const user = await User.update(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    successResponse(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res, next) => {
  try {
    const user = await User.delete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    successResponse(res, { id: user.id }, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
});

// CATEGORY ROUTES
// Get all categories
app.get('/api/categories', async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    successResponse(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Get category by ID
app.get('/api/categories/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    successResponse(res, category, 'Category retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Create new category
app.post('/api/categories', async (req, res, next) => {
  try {
    const { name, slug, description, color } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required'
      });
    }

    const category = await Category.create({ name, slug, description, color });
    successResponse(res, category, 'Category created successfully');
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Category name or slug already exists'
      });
    }
    next(error);
  }
});

// Update category
app.put('/api/categories/:id', async (req, res, next) => {
  try {
    const category = await Category.update(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    successResponse(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
});

// Delete category
app.delete('/api/categories/:id', async (req, res, next) => {
  try {
    const category = await Category.delete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    successResponse(res, { id: category.id }, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
});

// POST ROUTES
// Get all posts
app.get('/api/posts', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      authorId,
      categoryId,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      authorId: authorId ? parseInt(authorId) : null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      search,
      sortBy,
      sortOrder
    };

    const result = await Post.findAll(options);
    successResponse(res, result, 'Posts retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Get published posts (public endpoint)
app.get('/api/posts/published', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, categoryId, search } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      categoryId: categoryId ? parseInt(categoryId) : null,
      search
    };

    const result = await Post.findPublished(options);
    successResponse(res, result, 'Published posts retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Get featured posts
app.get('/api/posts/featured', async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const posts = await Post.findFeatured(parseInt(limit));
    successResponse(res, posts, 'Featured posts retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Get recent posts
app.get('/api/posts/recent', async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const posts = await Post.getRecent(parseInt(limit));
    successResponse(res, posts, 'Recent posts retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Get post by ID
app.get('/api/posts/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Increment views
    await Post.incrementViews(req.params.id);
    
    successResponse(res, post, 'Post retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Get post by slug
app.get('/api/posts/slug/:slug', async (req, res, next) => {
  try {
    const post = await Post.findBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Increment views
    await Post.incrementViews(post.id);
    
    successResponse(res, post, 'Post retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Create new post
app.post('/api/posts', async (req, res, next) => {
  try {
    const { title, slug, content, excerpt, featuredImage, status, authorId, categoryId } = req.body;
    
    if (!title || !slug || !content || !authorId) {
      return res.status(400).json({
        success: false,
        message: 'Title, slug, content, and author ID are required'
      });
    }

    const post = await Post.create({
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      status,
      authorId: parseInt(authorId),
      categoryId: categoryId ? parseInt(categoryId) : null
    });

    successResponse(res, post, 'Post created successfully');
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Post slug already exists'
      });
    }
    next(error);
  }
});

// Update post
app.put('/api/posts/:id', async (req, res, next) => {
  try {
    const post = await Post.update(req.params.id, req.body);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    successResponse(res, post, 'Post updated successfully');
  } catch (error) {
    next(error);
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res, next) => {
  try {
    const post = await Post.delete(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    successResponse(res, { id: post.id }, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
});

// Like post
app.post('/api/posts/:id/like', async (req, res, next) => {
  try {
    const result = await Post.toggleLike(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    successResponse(res, { likes: result.likes }, 'Post liked successfully');
  } catch (error) {
    next(error);
  }
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Could not connect to database. Please check your configuration.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Blog Management Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: PostgreSQL (${process.env.DB_NAME})`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📱 Frontend URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();