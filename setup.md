# UFC Picks Application Setup Guide

## Prerequisites

- Node.js (v16 or higher, tested with v20.10.0)
- npm or yarn
- SQLite (included with Node.js)

## Quick Setup

### 1. Install Dependencies

```bash
npm run install-all
```

This command installs dependencies for:
- Root project (concurrently)
- Server (Express, Sequelize, etc.)
- Client (React, TypeScript, etc.)

### 2. SQLite Setup

SQLite is included with Node.js and requires no additional installation. The database file will be created automatically when the server starts.

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp server/env.example server/.env
```

The default configuration includes:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### 4. Seed the Database (Recommended)

```bash
cd server
npm run seed
```

This will create sample data including:
- Admin user: `admin@ufcpicks.com` / `admin123`

- 3 upcoming UFC events with realistic fight cards (dated in 2026)

### 5. Start the Application

#### Development Mode (Both client and server)
```bash
npm run dev
```

#### Or start them separately:

**Server only:**
```bash
npm run server
```

**Client only:**
```bash
npm run client
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Project Configuration

### Frontend Configuration

The React application uses several key configurations:

1. **CRACO Configuration** (`client/craco.config.js`):
   ```javascript
   module.exports = {
     devServer: {
       allowedHosts: 'all',
     },
   };
   ```

2. **Package Scripts** (`client/package.json`):
   - `start`: Uses CRACO to override webpack configuration
   - `build`: Uses CRACO for production builds
   - `test`: Uses CRACO for testing

3. **Proxy Configuration**: API requests from localhost:3000 are automatically proxied to localhost:5000

### Backend Configuration

1. **Database**: SQLite with Sequelize ORM
2. **Authentication**: JWT-based with bcrypt password hashing
3. **Security**: Helmet.js for security headers, CORS configured
4. **Logging**: Morgan for HTTP request logging
5. **API Transformation**: Automatic data transformation to match frontend TypeScript interfaces

## Troubleshooting

### SQLite Database Issues

1. **Check if database file exists**:
   ```bash
   ls server/database.sqlite
   ```

2. **Reset database** (if needed):
   - Delete `server/database.sqlite`
   - Restart the server (it will recreate the database)

3. **View database contents** (optional):
   ```bash
   sqlite3 server/database.sqlite
   .tables
   .quit
   ```

### Port Issues

If ports 3000 or 5000 are in use:

1. **Change client port**:
   Create `client/.env`:
   ```
   PORT=3001
   ```

2. **Change server port**:
   Update `server/.env`:
   ```
   PORT=5001
   ```

### TypeScript Issues

The application uses TypeScript 4.9.5 for compatibility with react-scripts 5.0.1. If you encounter TypeScript errors:

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm run install-all
   ```

2. Restart your development server

### Webpack Dev Server Issues

The project uses CRACO (Create React App Configuration Override) to handle webpack configuration issues:

1. **If you see "allowedHosts" errors**:
   - The `client/craco.config.js` file handles this automatically
   - No additional configuration needed

2. **If you see OpenSSL errors**:
   - These are handled by the current configuration
   - No manual intervention required

### Common Error Solutions

1. **"Module not found" errors**:
   ```bash
   npm run install-all
   ```

2. **"Port already in use" errors**:
   - Kill existing processes or change ports as described above

3. **"Database locked" errors**:
   - Restart the server
   - Check if multiple server instances are running

4. **"Dashboard not loading events" errors**:
   - Ensure database is seeded with future-dated events
   - Check server is running on port 5000
   - Verify API endpoints are responding

5. **"Cannot read properties of undefined" errors**:
   - Usually indicates API structure mismatch
   - The backend automatically transforms data to match frontend expectations
   - Ensure both client and server are running

## Application Features

- **User Authentication**: Register, login, profile management
- **Event Management**: View upcoming UFC events
- **Pick Submission**: Make predictions for fight outcomes
- **Leaderboards**: Global and event-specific rankings
- **Real-time Updates**: Live scoring and results

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `GET /api/events` - Get all events
- `GET /api/events/upcoming` - Get next upcoming event
- `POST /api/picks` - Submit fight picks
- `GET /api/leaderboard` - Get global leaderboard

## Development

### Project Structure

```
UFC Picks/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   ├── craco.config.js    # CRACO configuration
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Utility functions
│   └── config/            # Database configuration
└── package.json           # Root package.json
```

### Available Scripts

- `npm run dev` - Start both client and server in development
- `npm run server` - Start server only
- `npm run client` - Start client only
- `npm run build` - Build client for production
- `npm run install-all` - Install all dependencies
- `npm run seed` - Seed database with sample data (run from server directory)

### Key Dependencies

**Frontend:**
- React 18.2.0
- TypeScript 4.9.5
- react-scripts 5.0.1
- @craco/craco 7.1.0
- Tailwind CSS 3.3.6
- React Router DOM 6.20.1

**Backend:**
- Express 4.18.2
- Sequelize 6.35.2
- SQLite3 5.1.6
- JWT 9.0.2
- bcryptjs 2.4.3

## Production Deployment

1. Build the client:
   ```bash
   npm run build
   ```

2. Set environment variables for production:
   - Update `server/.env` with production values
   - Set proper JWT_SECRET
   - Configure CORS_ORIGIN for your domain

3. Deploy server to your hosting platform

4. Configure SQLite database for production (or migrate to PostgreSQL/MySQL for better performance)

5. Set up proper CORS origins for your domain

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify the SQLite database file exists and is accessible
3. Ensure all environment variables are set correctly
4. Check that all dependencies are installed with `npm run install-all`
5. Review the troubleshooting section above
6. Ensure database is seeded with future-dated events

For additional help, check the application logs or create an issue in the repository. 