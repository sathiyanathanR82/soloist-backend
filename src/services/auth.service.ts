import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';

export class AuthService {
  
  async findOrCreateUser(profile: any, provider: string): Promise<{ user: IUser; token: string; isNewUser: boolean }> {
    try {
      const email = profile.emails?.[0]?.value || profile.email;
      
      let user = await User.findOne({ email });
      let isNewUser = false;
      
      if (!user) {
        isNewUser = true;
        user = new User({
          email,
          firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
          lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
          avatar: profile.photos?.[0]?.value || '',
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
        // Check if provider already exists
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
      
      const token = generateToken(user._id.toString());
      
      return { user, token, isNewUser };
    } catch (error) {
      throw new Error(`Failed to find or create user: ${error}`);
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<IUser>): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: profileData },
        { new: true, runValidators: true }
      );
      
      return user;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error}`);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await User.findByIdAndDelete(userId);
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
