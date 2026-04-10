"use strict";
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
        app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Server is running on port ${port}`);
            console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
