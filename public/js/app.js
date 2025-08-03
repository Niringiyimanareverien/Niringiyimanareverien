// Blog Management System Frontend
class BlogManager {
    constructor() {
        this.baseURL = '/api';
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkConnection();
        this.showSection('dashboard');
        await this.loadDashboardData();
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                this.showSection(section);
            });
        });

        // Mobile sidebar toggle
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.getElementById('sidebar-overlay').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshCurrentSection();
        });

        // Create buttons
        document.getElementById('create-post-btn').addEventListener('click', () => {
            this.showCreatePostModal();
        });

        document.getElementById('create-category-btn').addEventListener('click', () => {
            this.showCreateCategoryModal();
        });

        document.getElementById('create-user-btn').addEventListener('click', () => {
            this.showCreateUserModal();
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        document.getElementById(`${sectionName}-section`).classList.remove('hidden');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-blue-50', 'text-blue-700');
            link.classList.add('text-gray-700');
        });

        document.querySelector(`[data-section="${sectionName}"]`).classList.remove('text-gray-700');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('bg-blue-50', 'text-blue-700');

        this.currentSection = sectionName;

        // Load section data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'posts':
                this.loadPosts();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'users':
                this.loadUsers();
                break;
        }

        // Close mobile sidebar
        if (window.innerWidth < 768) {
            this.toggleSidebar();
        }
    }

    async refreshCurrentSection() {
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
        
        await this.showSection(this.currentSection);
        
        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }, 1000);
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();
            
            const statusEl = document.getElementById('connection-status');
            if (data.success && data.database === 'connected') {
                statusEl.innerHTML = `
                    <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span class="text-sm text-green-600">Connected</span>
                `;
            } else {
                statusEl.innerHTML = `
                    <div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span class="text-sm text-red-600">Disconnected</span>
                `;
            }
        } catch (error) {
            const statusEl = document.getElementById('connection-status');
            statusEl.innerHTML = `
                <div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span class="text-sm text-red-600">Error</span>
            `;
        }
    }

    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            this.showNotification('API call failed: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    async loadDashboardData() {
        try {
            // Load stats
            const [postsRes, categoriesRes, usersRes] = await Promise.all([
                this.apiCall('/posts'),
                this.apiCall('/categories'),
                this.apiCall('/users')
            ]);

            if (postsRes.success) {
                document.getElementById('total-posts').textContent = postsRes.data.pagination.total;
                const totalViews = postsRes.data.posts.reduce((sum, post) => sum + (post.views || 0), 0);
                document.getElementById('total-views').textContent = totalViews.toLocaleString();
            }

            if (categoriesRes.success) {
                document.getElementById('total-categories').textContent = categoriesRes.data.length;
            }

            if (usersRes.success) {
                document.getElementById('total-users').textContent = usersRes.data.pagination.total;
            }

            // Load recent posts
            const recentRes = await this.apiCall('/posts/recent?limit=5');
            if (recentRes.success) {
                this.renderRecentPosts(recentRes.data);
            }

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    renderRecentPosts(posts) {
        const container = document.getElementById('recent-posts');
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-file-alt text-2xl mb-2"></i>
                    <p>No posts found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="flex-1">
                    <h4 class="text-sm font-medium text-gray-900">${post.title}</h4>
                    <p class="text-sm text-gray-500">by ${post.author_username || 'Unknown'}</p>
                    <p class="text-xs text-gray-400">${new Date(post.published_at || post.created_at).toLocaleDateString()}</p>
                </div>
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span><i class="fas fa-eye mr-1"></i>${post.views || 0}</span>
                    ${post.category_name ? `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${post.category_name}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadPosts() {
        const container = document.getElementById('posts-list');
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading posts...</p>
            </div>
        `;

        const response = await this.apiCall('/posts');
        if (response.success) {
            this.renderPosts(response.data.posts);
        } else {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Failed to load posts</p>
                </div>
            `;
        }
    }

    renderPosts(posts) {
        const container = document.getElementById('posts-list');
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-file-alt text-2xl mb-2"></i>
                    <p>No posts found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${posts.map(post => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${post.title}</div>
                                    <div class="text-sm text-gray-500">${post.excerpt || 'No excerpt'}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${post.author_username || 'Unknown'}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    ${post.category_name ? `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${post.category_name}</span>` : '-'}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 rounded-full text-xs ${this.getStatusColor(post.status)}">
                                        ${post.status}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${post.views || 0}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${new Date(post.created_at).toLocaleDateString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="blogManager.editPost(${post.id})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                                    <button onclick="blogManager.deletePost(${post.id})" class="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async loadCategories() {
        const container = document.getElementById('categories-list');
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading categories...</p>
            </div>
        `;

        const response = await this.apiCall('/categories');
        if (response.success) {
            this.renderCategories(response.data);
        } else {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Failed to load categories</p>
                </div>
            `;
        }
    }

    renderCategories(categories) {
        const container = document.getElementById('categories-list');
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-tags text-2xl mb-2"></i>
                    <p>No categories found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${categories.map(category => `
                    <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center">
                                <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${category.color}"></div>
                                <h3 class="text-lg font-medium text-gray-900">${category.name}</h3>
                            </div>
                            <span class="text-sm text-gray-500">${category.post_count} posts</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">${category.description || 'No description'}</p>
                        <div class="flex justify-end space-x-2">
                            <button onclick="blogManager.editCategory(${category.id})" class="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                            <button onclick="blogManager.deleteCategory(${category.id})" class="text-red-600 hover:text-red-900 text-sm">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadUsers() {
        const container = document.getElementById('users-list');
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading users...</p>
            </div>
        `;

        const response = await this.apiCall('/users');
        if (response.success) {
            this.renderUsers(response.data.users);
        } else {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Failed to load users</p>
                </div>
            `;
        }
    }

    renderUsers(users) {
        const container = document.getElementById('users-list');
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-2xl mb-2"></i>
                    <p>No users found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${users.map(user => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${user.first_name || ''} ${user.last_name || ''}</div>
                                    <div class="text-sm text-gray-500">@${user.username}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">${user.role}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                        ${user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="blogManager.editUser(${user.id})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                                    <button onclick="blogManager.deleteUser(${user.id})" class="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getStatusColor(status) {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    showCreatePostModal() {
        this.showNotification('Create post functionality coming soon!', 'info');
    }

    showCreateCategoryModal() {
        this.showNotification('Create category functionality coming soon!', 'info');
    }

    showCreateUserModal() {
        this.showNotification('Create user functionality coming soon!', 'info');
    }

    editPost(id) {
        this.showNotification(`Edit post ${id} functionality coming soon!`, 'info');
    }

    deletePost(id) {
        if (confirm('Are you sure you want to delete this post?')) {
            this.showNotification(`Delete post ${id} functionality coming soon!`, 'info');
        }
    }

    editCategory(id) {
        this.showNotification(`Edit category ${id} functionality coming soon!`, 'info');
    }

    deleteCategory(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            this.showNotification(`Delete category ${id} functionality coming soon!`, 'info');
        }
    }

    editUser(id) {
        this.showNotification(`Edit user ${id} functionality coming soon!`, 'info');
    }

    deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.showNotification(`Delete user ${id} functionality coming soon!`, 'info');
        }
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
const blogManager = new BlogManager();