"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secret = process.env.JWT_SECRET; // The '!' tells TS this is not undefined
const generateToken = (userId) => {
    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    else {
        return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn: options.expiresIn });
    }
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
const decodeToken = (token) => {
    return jsonwebtoken_1.default.decode(token);
};
exports.decodeToken = decodeToken;
