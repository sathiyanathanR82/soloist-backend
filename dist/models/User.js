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
exports.User = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto_1.default.randomUUID()
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        default: null
    },
    phone: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    headline: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: '',
        maxlength: 500
    },
    website: {
        type: String,
        default: ''
    },
    profilePic: {
        type: String,
        default: null
    },
    registerUser: {
        type: Boolean,
        default: false
    },
    providers: [
        {
            name: {
                type: String,
                required: true
            },
            id: {
                type: String,
                required: true
            },
            email: String,
            accessToken: String,
            refreshToken: String
        }
    ],
    network: {
        myNetwork: {
            type: [String],
            default: []
        },
        request: {
            type: [String],
            default: []
        },
        block: {
            type: [String],
            default: []
        },
        removalRequest: {
            type: [String],
            default: []
        }
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    profileVisibility: {
        type: String,
        enum: ['All users', 'Only my network', 'Only me'],
        default: 'All users'
    },
    emailVisibility: {
        type: String,
        enum: ['All users', 'Only my network', 'Only me'],
        default: 'All users'
    },
    phoneVisibility: {
        type: String,
        enum: ['All users', 'Only my network', 'Only me'],
        default: 'All users'
    },
    showInNearbySearch: {
        type: Boolean,
        default: true
    },
    deletion: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
exports.User = mongoose_1.default.model('User', userSchema);
