# UFC Picks 🥊

A full-stack web application for making and tracking UFC fight predictions. Users can submit picks for upcoming UFC events, compete on leaderboards, and track their prediction accuracy.

## Features

- **User Authentication**: Register, login, and manage user profiles
- **Event Management**: View upcoming UFC events with detailed fight cards
- **Pick Submission**: Make predictions for fight winners, methods, and rounds
- **Leaderboards**: Compete with other users and track rankings
- **Statistics**: View personal stats including accuracy, total points, and participation
- **Real-time Updates**: Live scoring and results tracking

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **Sequelize ORM** with SQLite database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ufc-picks
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In the server directory, copy the example env file
   cd ../server
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   JWT_SECRET=your-secret-key-here
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   cd server
   npm run seed
   ```

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend client**
   ```bash
   cd client
   npm start
   ```
   The client will run on `http://localhost:3000`

### Production Mode

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Start the server**
   ```bash
   cd server
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Events
- `GET /api/events` - Get all events
- `GET /api/events/upcoming` - Get next upcoming event
- `GET /api/events/:id` - Get specific event
- `POST /api/events` - Create new event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)

### Picks
- `POST /api/picks` - Submit picks for an event
- `GET /api/picks/my-picks` - Get user's picks
- `GET /api/picks/event/:eventId` - Get picks for specific event

### Leaderboard
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/event/:eventId` - Get event-specific leaderboard

## Database Schema

### Users
- Basic user information and authentication
- Statistics tracking (points, accuracy, participation)

### Events
- Event details (name, date, venue)
- Fight cards with fighter information
- Status tracking (upcoming, live, completed)

### Picks
- User predictions for fights
- Scoring and results tracking

## Sample Data

The application comes with sample data including:
- Admin user with full privileges
- Sample UFC events with fight cards
- Test data for development

**Default login credentials:**
- Admin: `admin@ufcpicks.com` / `admin123`


## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- UFC for fight data and inspiration
- React and Node.js communities for excellent documentation
- All contributors and users of this application 