# UFC Picks 🥊

A full-stack web application for making and tracking UFC fight predictions. Users can submit picks for upcoming UFC events, compete on leaderboards, and track their prediction accuracy. The application includes comprehensive admin features for event management and user administration.

## ✨ Features

### 🥊 Core Features
- **User Authentication**: Secure registration, login, and profile management
- **Event Management**: View upcoming UFC events with detailed fight cards and fighter information
- **Pick Submission**: Make predictions for fight winners, methods, and rounds
- **Leaderboards**: Compete with other users and track global rankings
- **Personal Statistics**: Track your prediction accuracy, total points, and participation history
- **Real-time Updates**: Live scoring and results tracking (from an admin)

### 🛡️ Admin Features
- **Event Management**: Create, edit, and manage UFC events
- **Fight Card Management**: Add fighters and configure matchups
- **Results Management**: Input fight results and calculate user scores
- **User Administration**: Manage user accounts, roles, and permissions
- **System Monitoring**: View application statistics and user activity

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and Headless UI components
- **Smooth Animations**: Framer Motion for engaging user interactions
- **Real-time Notifications**: Toast notifications for user feedback

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive styling
- **React Router v6** for client-side navigation
- **React Hot Toast** for user notifications
- **Axios** for HTTP API communication
- **Framer Motion** for smooth animations
- **Headless UI** for accessible UI components
- **Heroicons** for beautiful SVG icons
- **Date-fns** for date manipulation
- **CRACO** for Create React App configuration

### Backend
- **Node.js** with Express.js framework
- **Sequelize ORM** with MySQL database support
- **JWT** for secure authentication
- **bcryptjs** for password hashing
- **Express Rate Limiting** for API protection
- **Helmet** for security headers
- **Morgan** for request logging
- **CORS** enabled for cross-origin requests
- **Express Validator** for input validation

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ufc-picks
   ```

2. **Install all dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   
   # Return to root directory
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Environment
   NODE_ENV=development
   
   # Server Configuration
   PORT=5000
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # CORS Configuration (for development)
   CORS_ORIGIN=http://localhost:3000
   
   # MySQL Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=ufc_picks
   
   # Security (optional, uses defaults if not set)
   RATE_LIMIT_AUTH=5
   RATE_LIMIT_GENERAL=100
   
   # Logging
   LOG_LEVEL=info

   # Optional: Cloudinary for avatar uploads
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Set up MySQL database**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE ufc_picks;
   exit;
   ```

5. **Initialize the database**
   ```bash
   cd server
   npm run seed
   ```

## 🚀 Running the Application

### Development Mode

1. **Start both server and client simultaneously**
   ```bash
   # From root directory
   npm run dev
   ```
   
   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend client on `http://localhost:3000`

2. **Or start them separately**
   ```bash
   # Terminal 1 - Start backend server
   npm run server
   
   # Terminal 2 - Start frontend client
   npm run client
   ```

### Production Mode

1. **Build the client**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/avatar` - Upload avatar image (requires Cloudinary)
- `GET /api/auth/users` - Get all users (Admin only)
- `PUT /api/auth/users/:userId/role` - Update user role (Admin only)
- `PUT /api/auth/users/:userId/status` - Update user status (Admin only)

### Events
- `GET /api/events` - Get all events
- `GET /api/events/upcoming` - Get next upcoming event
- `GET /api/events/:id` - Get specific event details
- `POST /api/events` - Create new event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Delete event (Admin only)

### Picks
- `POST /api/picks` - Submit picks for an event
- `GET /api/picks/my-picks` - Get user's picks
- `GET /api/picks/event/:eventId` - Get picks for specific event
- `PUT /api/picks/:id` - Update picks (before event starts)

### Leaderboard
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/event/:eventId` - Get event-specific leaderboard
- `GET /api/leaderboard/user/:userId` - Get user's leaderboard position

## 🗄️ Database Schema

### Users
- Authentication credentials and profile information
- Role-based permissions (User, Admin, Owner)
- Statistics tracking (points, accuracy, participation)
- Account status and activity tracking

### Events
- Event details (name, date, venue, status)
- Fight cards with fighter information and matchups
- Event lifecycle management (upcoming, live, completed)

### Picks
- User predictions for individual fights
- Scoring calculation and results tracking
- Historical pick data for statistics

### Fighters
- Fighter profiles and statistics
- Match history and performance data

## 🛠️ Database Management

The application includes comprehensive database management tools:

### Available Commands
```bash
# Check database status
npm run db:status

# Seed the database with sample data
npm run db:seed

# Reset the database (⚠️ WARNING: This will delete all data)
npm run db:reset

# Create a new admin user
npm run db:create-admin
```

### Database Utilities
- **`manage-database.js`**: Comprehensive CLI for database operations
- **`seed-database.js`**: Dedicated script for populating sample data
- **Automatic synchronization**: Database tables are created automatically on startup

## 🎯 Sample Data

The application comes with pre-loaded sample data including:
- **Admin User**: `admin@ufcpicks.com` / `[PASSWORD CHANGED - was admin123]` but password has been changed
- **Sample UFC Events**: Multiple events with complete fight cards
- **Fighter Database**: Comprehensive fighter profiles
- **Test Data**: Sample picks and results for development

## 🔒 Security Features

- **Rate Limiting**: API protection against abuse
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Configurable cross-origin restrictions
- **Security Headers**: Helmet.js for enhanced security
- **Role-based Access**: Admin-only routes and features

## 📱 User Interface

### Public Pages
- **Home/Dashboard**: Event overview and quick actions
- **Events**: Browse upcoming and past UFC events
- **Event Details**: Comprehensive fight card information
- **Leaderboard**: Global and event-specific rankings
- **Login/Register**: User authentication

### User Pages
- **Make Picks**: Submit predictions for upcoming events
- **My Picks**: View and manage your predictions
- **Profile**: Personal statistics and account settings
- **Security**: Password and account security settings

### Admin Pages
- **Admin Dashboard**: System overview and quick actions
- **Event Management**: Create, edit, and manage events
- **User Management**: Administer user accounts and roles
- **Results Management**: Input fight results and calculate scores

## 🚀 Deployment

### Heroku (Recommended)
```bash
# Set up Heroku
heroku create your-ufc-picks-app
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret

# Set MySQL database configuration
heroku config:set DB_HOST=your-mysql-host
heroku config:set DB_PORT=3306
heroku config:set DB_USER=your-mysql-user
heroku config:set DB_PASSWORD=your-mysql-password
heroku config:set DB_NAME=your-mysql-database

# Deploy
git push heroku main
```

### Environment Variables for Production
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-production-key
CORS_ORIGIN=https://yourdomain.com
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **UFC** for fight data and inspiration
- **React** and **Node.js** communities for excellent documentation
- **Tailwind CSS** for the beautiful design system
- All contributors and users of this application

---

**Ready to make some picks?** 🥊 Start predicting UFC fights and climb the leaderboard! 