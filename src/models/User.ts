import crypto from 'crypto';
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  headline?: string;
  bio?: string;
  website?: string;
  profilePic?: string;
  registerUser?: boolean;
  providers: {
    name: string;
    id: string;
    email?: string;
    accessToken?: string;
    refreshToken?: string;
  }[];
  network: {
    myNetwork: string[];
    request: {userId: string, inviteMessage?: string}[];
    block: string[];
    removalRequest: string[];
    messages: {
      withUserId: string;
      messages: {
        from: string;
        to: string;
        text: string;
        timestamp: Date;
        type?: 'invite' | 'message';
      }[];
    }[];
  };

  lastLogin?: Date;
  isOnline?: boolean;
  profileVisibility?: 'All users' | 'Only my network' | 'Only me';
  emailVisibility?: 'All users' | 'Only my network' | 'Only me';
  phoneVisibility?: 'All users' | 'Only my network' | 'Only me';
  showInNearbySearch?: boolean;
  deletion?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID()
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
      request: [{
        userId: {
          type: String,
          required: true
        },
        inviteMessage: {
          type: String,
          default: ''
        }
      }],
      block: {
        type: [String],
        default: []
      },
      removalRequest: {
        type: [String],
        default: []
      },
      messages: [{
        withUserId: {
          type: String,
          required: true
        },
        messages: [{
          from: String,
          to: String,
          text: String,
          timestamp: {
            type: Date,
            default: Date.now
          },
          type: {
            type: String,
            enum: ['invite', 'message'],
            default: 'message'
          }
        }]
      }]
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
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
