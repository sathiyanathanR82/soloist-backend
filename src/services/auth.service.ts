import crypto from 'crypto';
import mongoose from 'mongoose';
import axios from 'axios';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';

export class AuthService {
  private buildUserQuery(userId: string) {
    const query: any = { uid: userId };

    if (mongoose.isValidObjectId(userId)) {
      query.$or = [{ _id: userId }, { uid: userId }];
    }

    return query;
  }

  private async generateBase64Image(imageUrl: string): Promise<string | null> {
    if (!imageUrl) return null;

    // If the image is already a Base64 string, return it immediately
    if (imageUrl.startsWith('data:')) return imageUrl;

    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const contentType = response.headers['content-type'];
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Failed to generate base64 image:', error);
      return null;
    }
  }

  async findOrCreateUser(profile: any, provider: string): Promise<{ user: IUser; token: string; isNewUser: boolean }> {
    try {
      const email = profile.emails?.[0]?.value || profile.email;

      let user = await User.findOne({ email });
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        user = new User({
          email,
          registerUser: false,
          firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
          lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
          profilePic: await this.generateBase64Image(profile.photos?.[0]?.value),
          providers: [
            {
              name: provider,
              id: profile.id,
              email,
              accessToken: profile.accessToken,
              refreshToken: profile.refreshToken
            }
          ]
        });
      } else {
        if (!user.uid) {
          user.uid = crypto.randomUUID();
        }

        // Update profilePic if needed
        const newAvatar = profile.photos?.[0]?.value || '';
        if (newAvatar && !user.profilePic) {
          user.profilePic = await this.generateBase64Image(newAvatar) || undefined;
        }

        const providerExists = user.providers.some(p => p.name === provider);

        if (!providerExists) {
          user.providers.push({
            name: provider,
            id: profile.id,
            email,
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken
          });
        }
      }

      await user.save();

      const token = generateToken(user.uid);

      return { user, token, isNewUser };
    } catch (error) {
      throw new Error(`Failed to find or create user: ${error}`);
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    try {
      console.log('getUserById: Searching for user with userId:', userId);
      const query = this.buildUserQuery(userId);
      console.log('getUserById: Query:', JSON.stringify(query));
      const user = await User.findOne(query);
      console.log('getUserById: Found user:', user ? 'YES' : 'NO');
      return user;
    } catch (error: any) {
      console.error('getUserById error:', error);
      throw new Error(`Failed to get user: ${error?.message}`);
    }
  }

  async updateUserProfile(userId: string, profileData: any): Promise<IUser | null> {
    try {
      // Handle legacy 'avatar' or standardized 'profilePic' fields
      const imageToProcess = profileData.avatar || profileData.profilePic;
      if (imageToProcess) {
        profileData.profilePic = await this.generateBase64Image(imageToProcess) || undefined;
        delete profileData.avatar;
      }

      if (profileData.registerUser !== undefined) {
        profileData.registerUser = Boolean(profileData.registerUser);
      }

      const user = await User.findOneAndUpdate(
        this.buildUserQuery(userId),
        {
          $set: profileData,
          $unset: { avatar: "" } // Ensure legacy avatar field is removed from DB
        },
        { new: true, runValidators: true }
      );

      return user;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error}`);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await User.findOneAndDelete(this.buildUserQuery(userId));
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  async listAllUsers(limit: number = 10, skip: number = 0): Promise<IUser[]> {
    try {
      return await User.find()
        .limit(limit)
        .skip(skip)
        .exec();
    } catch (error) {
      throw new Error(`Failed to list users: ${error}`);
    }
  }
}
