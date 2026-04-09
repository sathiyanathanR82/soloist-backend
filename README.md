# Soloist Backend API

Backend API for the Soloist social authentication and user profile management application.

## Features

- OAuth 2.0 Social Authentication (Facebook, Google, Microsoft)
- User Profile Management
- JWT Token-based Authentication
- User Data Persistence
- CORS Support for Frontend Integration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- OAuth Application Credentials from providers

## Installation

1. Clone the repository and navigate to the backend directory
```bash
cd soloist-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on `.env.example`
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
   - Set MongoDB URI
   - Add OAuth provider credentials
   - Configure JWT secret

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
Build the TypeScript files:
```bash
npm run build
```

Start the server:
```bash
npm start
```

## API Endpoints

### Authentication Routes

- `GET /api/auth/facebook` - Facebook OAuth login
- `GET /api/auth/facebook/callback` - Facebook OAuth callback

- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/microsoft` - Microsoft OAuth login
- `GET /api/auth/microsoft/callback` - Microsoft OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (protected route; JWT `userId` is the user's `uid`)

### User Profile Routes

- `GET /api/users/:id` - Get user profile (where `:id` is the user's unique UID)
- `PUT /api/users/:id` - Update user profile (where `:id` is the user's unique UID)
- `DELETE /api/users/:id` - Delete user account (where `:id` is the user's unique UID)

## Project Structure

```
src/
├── config/          # Configuration files (database, passport, etc.)
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── models/          # MongoDB schemas
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── index.ts         # Main application file
```

## Security Considerations

1. Always use HTTPS in production
2. Keep JWT_SECRET secure and unique
3. Validate and sanitize all user inputs
4. Implement rate limiting for API endpoints
5. Use environment variables for sensitive data

## Environment Setup for OAuth Providers

### Facebook OAuth
1. Go to https://developers.facebook.com/
2. Create an app and get App ID and App Secret
3. Add OAuth redirect URL to app settings



### Google OAuth
1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 credentials
3. Get Client ID and Secret
4. Add redirect URL to authorized redirect URIs

### Microsoft OAuth
1. Go to https://portal.azure.com/
2. Register an application
3. Create client secret
4. Add redirect URL

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  phone: String,
  location: String,
  headline: String,
  bio: String,
  website: String,
  avatar: String,
  providers: [
    {
      name: String,
      id: String,
      email: String,
      accessToken: String,
      refreshToken: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC
