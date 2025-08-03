# Blog Management System

A modern, full-stack blog management system built with Node.js, Express.js, and PostgreSQL. This system provides a complete solution for managing blog posts, categories, users, and content with a beautiful, responsive web interface.

## 🚀 Features

- **Complete Blog Management**: Create, read, update, and delete blog posts
- **User Management**: Handle user accounts with role-based permissions
- **Category System**: Organize posts with customizable categories
- **Modern UI**: Responsive, mobile-friendly interface built with Tailwind CSS
- **PostgreSQL Database**: Robust, scalable database with proper relationships
- **RESTful API**: Well-documented API endpoints for all operations
- **Real-time Dashboard**: Overview of posts, users, and site statistics

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Security**: Helmet.js, CORS, bcryptjs for password hashing
- **Development**: Nodemon for hot reloading

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd blog-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database

```sql
-- Connect to PostgreSQL as the postgres user
createdb blogManager
```

#### Configure Environment Variables

Copy the example environment file and configure your database settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blogManager
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration (for future authentication)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Initialize Database Tables

Run the database setup script to create all necessary tables and insert default data:

```bash
npm run setup-db
```

This will create:
- Users table with an admin user (email: admin@blogmanager.com, password: admin123)
- Posts table for blog content
- Categories table with default categories
- Comments table for post comments
- Tags table and post-tags relationship
- Proper indexes for performance

### 4. Start the Application

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Health Check
- `GET /api/health` - Check server and database status

### Users
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Posts
- `GET /api/posts` - Get all posts (with filtering and pagination)
- `GET /api/posts/published` - Get published posts only
- `GET /api/posts/featured` - Get featured posts
- `GET /api/posts/recent` - Get recent posts
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/slug/:slug` - Get post by slug
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like a post

## 🗄️ Database Schema

### Users Table
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password` (Hashed)
- `first_name`, `last_name`
- `bio`, `avatar_url`
- `role` (user/admin)
- `is_active` (Boolean)
- `created_at`, `updated_at`

### Posts Table
- `id` (Primary Key)
- `title`, `slug` (Unique)
- `content`, `excerpt`
- `featured_image`
- `status` (draft/published)
- `author_id` (Foreign Key to Users)
- `category_id` (Foreign Key to Categories)
- `views`, `likes`
- `is_featured` (Boolean)
- `published_at`, `created_at`, `updated_at`

### Categories Table
- `id` (Primary Key)
- `name` (Unique), `slug` (Unique)
- `description`, `color`
- `created_at`, `updated_at`

### Comments Table
- `id` (Primary Key)
- `content`
- `author_name`, `author_email`
- `post_id` (Foreign Key to Posts)
- `parent_id` (Self-referencing for replies)
- `status` (pending/approved)
- `created_at`, `updated_at`

### Tags Table
- `id` (Primary Key)
- `name` (Unique), `slug` (Unique)
- `created_at`

### Post_Tags Table (Junction)
- `post_id` (Foreign Key to Posts)
- `tag_id` (Foreign Key to Tags)

## 🎨 Frontend Features

The web interface includes:

- **Dashboard**: Overview with statistics and recent posts
- **Posts Management**: Full CRUD operations for blog posts
- **Categories Management**: Create and manage post categories
- **Users Management**: User account administration
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Dynamic content loading
- **Modern UI**: Clean, professional interface with animations

## 🔒 Security Features

- Password hashing with bcryptjs
- SQL injection prevention with parameterized queries
- CORS protection
- Helmet.js for security headers
- Input validation and sanitization
- Error handling with appropriate HTTP status codes

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production` in your environment
2. Configure your production database credentials
3. Set up proper CORS origins for your domain

### Database Migration
The application includes automatic table creation and can be safely rerun to update schema.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure the database `blogManager` exists

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Kill the process using the port: `lsof -ti:3000 | xargs kill`

3. **Module Not Found**
   - Run `npm install` to install dependencies
   - Check Node.js version compatibility

### Database Reset
To reset the database and start fresh:

```bash
# Drop and recreate database (PostgreSQL)
dropdb blogManager
createdb blogManager
npm run setup-db
```

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

---

**Happy Blogging! 📝✨**
