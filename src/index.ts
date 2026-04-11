import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import "reflect-metadata";
import { Server } from 'socket.io';
import { verifyToken } from './utils/jwt';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

// Import config
import { connectDB } from './config/database';
import './config/passport';

// Import middleware
import { corsHeaders } from './middleware/auth';

const app: Express = express();
const port = process.env.PORT || 3000;

// Trust reverse proxy for secure cookies (required for Render)
app.set('trust proxy', 1);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

// Custom CORS headers middleware
app.use(corsHeaders);

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Microsoft domain verification (served without auth)
app.get('/.well-known/microsoft-identity-association.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    associatedApplications: [
      {
        applicationId: 'f37b95dd-1432-46c6-9402-8654dc11d93a'
      }
    ]
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    const httpServer = app.listen(port as number, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
    });

    // Socket.io setup
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Socket auth middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token as string;
      if (!token) return next(new Error('Authentication error: No token provided'));

      const decoded = verifyToken(token);
      if (!decoded || !decoded.userId) return next(new Error('Authentication error: Invalid token'));
      
      socket.data.userId = decoded.userId;
      next();
    });

    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.userId}`);

      // Join network rooms
      socket.on('join-network', (networkUids: string[]) => {
        networkUids.forEach(uid => {
          const room = [socket.data.userId, uid].sort().join('-');
          socket.join(room);
        });
      });

      // Message send (server-side emit)
      socket.on('send-message', async ({ targetId, text }: { targetId: string, text: string }) => {
        try {
          const { AuthService } = await import('./services/auth.service');
          const authService = new AuthService();
          await authService.sendMessage(socket.data.userId!, targetId, text);

          const room = [socket.data.userId!, targetId].sort().join('-');
          io.to(room).emit('new-message', {
            from: socket.data.userId!,
            to: targetId,
            text,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.userId}`);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
