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
    ]
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
