const { query, testConnection } = require('../config/database');

// SQL queries to create tables
const createTables = async () => {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Could not connect to database');
    }

    console.log('🔧 Setting up database tables...');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        bio TEXT,
        avatar_url VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create categories table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Categories table created');

    // Create posts table
    await query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        featured_image VARCHAR(255),
        status VARCHAR(20) DEFAULT 'draft',
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Posts table created');

    // Create comments table
    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        author_email VARCHAR(100) NOT NULL,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Comments table created');

    // Create tags table
    await query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tags table created');

    // Create post_tags junction table
    await query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      )
    `);
    console.log('✅ Post_tags table created');

    // Create indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`);
    console.log('✅ Database indexes created');

    // Insert default data
    await insertDefaultData();

    console.log('🎉 Database setup completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
};

// Insert default data
const insertDefaultData = async () => {
  try {
    // Insert default categories
    await query(`
      INSERT INTO categories (name, slug, description, color) 
      VALUES 
        ('Technology', 'technology', 'Posts about technology and programming', '#3b82f6'),
        ('Lifestyle', 'lifestyle', 'Posts about lifestyle and personal experiences', '#10b981'),
        ('Travel', 'travel', 'Posts about travel and adventures', '#f59e0b'),
        ('Food', 'food', 'Posts about food and recipes', '#ef4444')
      ON CONFLICT (slug) DO NOTHING
    `);
    console.log('✅ Default categories inserted');

    // Insert default tags
    await query(`
      INSERT INTO tags (name, slug) 
      VALUES 
        ('JavaScript', 'javascript'),
        ('Node.js', 'nodejs'),
        ('PostgreSQL', 'postgresql'),
        ('Web Development', 'web-development'),
        ('Tutorial', 'tutorial')
      ON CONFLICT (slug) DO NOTHING
    `);
    console.log('✅ Default tags inserted');

    // Insert default admin user (password: admin123)
    const hashedPassword = '$2a$10$X8K8qMqE8qF5qE8qF5qE8u.8K8qMqE8qF5qE8qF5qE8qF5qE8qF5qO'; // bcrypt hash for 'admin123'
    await query(`
      INSERT INTO users (username, email, password, first_name, last_name, role, bio) 
      VALUES 
        ('admin', 'admin@blogmanager.com', $1, 'Admin', 'User', 'admin', 'Blog administrator account')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);
    console.log('✅ Default admin user created (email: admin@blogmanager.com, password: admin123)');

  } catch (error) {
    console.error('Error inserting default data:', error.message);
  }
};

// Run the setup
createTables();