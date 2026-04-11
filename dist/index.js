"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
require("reflect-metadata");
const socket_io_1 = require("socket.io");
const jwt_1 = require("./utils/jwt");
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
// Import config
const database_1 = require("./config/database");
require("./config/passport");
// Import middleware
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Trust reverse proxy for secure cookies (required for Render)
app.set('trust proxy', 1);
// Body parser middleware
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// CORS middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true
}));
// Custom CORS headers middleware
app.use(auth_1.corsHeaders);
// Session middleware
app.use((0, express_session_1.default)({
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
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
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
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
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
        await (0, database_1.connectDB)();
        const httpServer = app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Server is running on port ${port}`);
            console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
        });
        // Socket.io setup
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:4200',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
        // Socket auth middleware
        io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token)
                return next(new Error('Authentication error: No token provided'));
            const decoded = (0, jwt_1.verifyToken)(token);
            if (!decoded || !decoded.userId)
                return next(new Error('Authentication error: Invalid token'));
            socket.data.userId = decoded.userId;
            next();
        });
        io.on('connection', (socket) => {
            console.log(`User connected: ${socket.data.userId}`);
            // Join network rooms
            socket.on('join-network', (networkUids) => {
                networkUids.forEach(uid => {
                    const room = [socket.data.userId, uid].sort().join('-');
                    socket.join(room);
                });
            });
            // Message send (server-side emit)
            socket.on('send-message', async ({ targetId, text }) => {
                try {
                    const { AuthService } = await Promise.resolve().then(() => __importStar(require('./services/auth.service')));
                    const authService = new AuthService();
                    await authService.sendMessage(socket.data.userId, targetId, text);
                    const room = [socket.data.userId, targetId].sort().join('-');
                    io.to(room).emit('new-message', {
                        from: socket.data.userId,
                        to: targetId,
                        text,
                        timestamp: new Date().toISOString()
                    });
                }
                catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.data.userId}`);
            });
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
