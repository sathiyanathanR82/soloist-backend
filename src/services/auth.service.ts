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

  public sanitizeUser(user: any, requesterId?: string): any {
    if (!user) return null;

    const userData = user.toObject ? user.toObject() : { ...user };
    const requesterUid = requesterId;
    const targetUid = userData.uid || userData._id?.toString();

    const isMe = requesterUid && targetUid && requesterUid === targetUid;
    const isNetwork = requesterUid && userData.network?.myNetwork?.includes(requesterUid);

    // Profile Visibility Enforcement
    if (!isMe) {
      if (userData.profileVisibility === 'Only me') {
        // If profile visibility is 'Only me', hide almost everything except name and photo
        // Actually, maybe we should return null or a very minimal object?
        return {
          uid: userData.uid,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePic: userData.profilePic,
          profileVisibility: userData.profileVisibility,
          registerUser: userData.registerUser
        };
      }

      if (userData.profileVisibility === 'Only my network' && !isNetwork) {
        // Restricted profile for non-network users
        return {
          uid: userData.uid,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePic: userData.profilePic,
          headline: userData.headline,
          profileVisibility: userData.profileVisibility,
          registerUser: userData.registerUser
        };
      }
    }

    // Field-level visibility (Email)
    if (!isMe && userData.emailVisibility) {
      if (userData.emailVisibility === 'Only me' || 
         (userData.emailVisibility === 'Only my network' && !isNetwork)) {
        delete userData.email;
      }
    }

    // Field-level visibility (Phone)
    if (!isMe && userData.phoneVisibility) {
      if (userData.phoneVisibility === 'Only me' || 
         (userData.phoneVisibility === 'Only my network' && !isNetwork)) {
        delete userData.phone;
      }
    }

    // Always remove sensitive internal fields
    delete userData.providers;
    delete userData.__v;

    return userData;
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

      user.lastLogin = new Date();
      user.isOnline = true;
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

  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      await User.findOneAndUpdate(
        this.buildUserQuery(userId),
        { $set: { isOnline, lastLogin: new Date() } }
      );
    } catch (error) {
      throw new Error(`Failed to update user status: ${error}`);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await User.findOneAndUpdate(this.buildUserQuery(userId), { $set: { deletion: true } });
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  async listAllUsers(limit: number = 10, skip: number = 0): Promise<IUser[]> {
    try {
      return await User.find({ showInNearbySearch: { $ne: false }, deletion: { $ne: true } })
        .limit(limit)
        .skip(skip)
        .exec();
    } catch (error) {
      throw new Error(`Failed to list users: ${error}`);
    }
  }

async sendNetworkRequest(fromUserId: string, toUserId: string, inviteMessage = ''): Promise<void> {
    try {
      const sender = await User.findOne({ uid: fromUserId });
      const recipient = await User.findOne({ uid: toUserId });
      if (!recipient || !sender) throw new Error('User not found');

      if (!recipient.network.request.some((r: any) => r.userId === fromUserId) && 
          !recipient.network.myNetwork.includes(fromUserId)) {
        // Add to request list
        recipient.network.request.push({ userId: fromUserId, inviteMessage });
        
        // Store message in network.messages array if message is provided
        if (inviteMessage) {
          const msg = {
            from: fromUserId,
            to: toUserId,
            text: inviteMessage,
            timestamp: new Date(),
            type: 'invite' as const
          };
          
          // Add message to recipient's messages
          let recipientConvIndex = recipient.network.messages?.findIndex((c: any) => c.withUserId === fromUserId);
          if (recipientConvIndex === -1 || recipientConvIndex === undefined) {
            recipientConvIndex = recipient.network.messages?.length || 0;
            recipient.network.messages = recipient.network.messages || [];
            recipient.network.messages.push({ withUserId: fromUserId, messages: [] });
          }
          recipient.network.messages![recipientConvIndex].messages.push(msg);
          
          // Add message to sender's messages
          let senderConvIndex = sender.network.messages?.findIndex((c: any) => c.withUserId === toUserId);
          if (senderConvIndex === -1 || senderConvIndex === undefined) {
            senderConvIndex = sender.network.messages?.length || 0;
            sender.network.messages = sender.network.messages || [];
            sender.network.messages.push({ withUserId: toUserId, messages: [] });
          }
          sender.network.messages![senderConvIndex].messages.push(msg);
        }
        
        await recipient.save();
        await sender.save();
      }
    } catch (error) {
      throw new Error(`Failed to send network request: ${error}`);
    }
  }


async approveNetworkRequest(userId: string, requesterId: string): Promise<void> {
    try {
      const user = await User.findOne({ uid: userId });
      const requester = await User.findOne({ uid: requesterId });

      if (!user || !requester) throw new Error('User or requester not found');

      // Find invite message
      const reqData = user.network.request.find((r: any) => r.userId === requesterId);
      const inviteMessage = reqData?.inviteMessage || '';

      // Remove from request list\n      user.network.request = user.network.request.filter((r: any) => r.userId !== requesterId);\n\n      // Remove any pending request from target to user\n      if (requester) {\n        requester.network.request = requester.network.request.filter((r: any) => r.userId !== userId);\n      }

      // Add to myNetwork for both
      if (!user.network.myNetwork.includes(requesterId)) {
        user.network.myNetwork.push(requesterId);
      }
      if (!requester.network.myNetwork.includes(userId)) {
        requester.network.myNetwork.push(userId);
      }

      // Start message thread with invite as first message (if any)
      if (inviteMessage) {
        const msg = {
          from: requesterId,
          to: userId,
          text: inviteMessage,
          timestamp: new Date(),
          type: 'invite' as const
        };
        // Check if conversation exists, else create new
        let userConvIndex = user.network.messages?.findIndex((c: any) => c.withUserId === requesterId);
        if (userConvIndex === -1) {
          userConvIndex = user.network.messages?.length || 0;
          user.network.messages = user.network.messages || [];
          user.network.messages.push({ withUserId: requesterId, messages: [] });
        }
        user.network.messages![userConvIndex].messages.push(msg);

        let requesterConvIndex = requester.network.messages?.findIndex((c: any) => c.withUserId === userId);
        if (requesterConvIndex === -1) {
          requesterConvIndex = requester.network.messages?.length || 0;
          requester.network.messages = requester.network.messages || [];
          requester.network.messages.push({ withUserId: userId, messages: [] });
        }
        requester.network.messages![requesterConvIndex].messages.push(msg);
      }

      await user.save();
      await requester.save();
    } catch (error) {
      throw new Error(`Failed to approve network request: ${error}`);
    }
  }


async rejectNetworkRequest(userId: string, requesterId: string): Promise<void> {
    try {
      const user = await User.findOne({ uid: userId });
      if (!user) throw new Error('User not found');

      user.network.request = user.network.request.filter((r: any) => r.userId !== requesterId);
      await user.save();
    } catch (error) {
      throw new Error(`Failed to reject network request: ${error}`);
    }
  }


async getInviteMessages(user: any, targetUid: string): Promise<any[]> {
    const conv = user.network.messages?.find((c: any) => c.withUserId === targetUid);
    if (!conv || !conv.messages) return [];

    return conv.messages
      .filter((msg: any) => msg.type === 'invite')
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getNetworkInfo(userId: string): Promise<any> {
    try {
      const user = await User.findOne({ uid: userId });
      if (!user) throw new Error('User not found');

      // Heartbeat: update last active status
      user.lastLogin = new Date();
      user.isOnline = true;
      await user.save();

      const requestUids = user.network.request.map((r: any) => r.userId);
      const myNetworkRaw = await User.find({ uid: { $in: user.network.myNetwork } })
        .select('uid firstName lastName email phone profilePic headline profileVisibility emailVisibility phoneVisibility showInNearbySearch');
      const requestsRaw = await User.find({ uid: { $in: requestUids } })
        .select('uid firstName lastName email phone profilePic headline profileVisibility emailVisibility phoneVisibility showInNearbySearch');
      const removalRequestsRaw = await User.find({ uid: { $in: user.network.removalRequest } })
        .select('uid firstName lastName email phone profilePic headline profileVisibility emailVisibility phoneVisibility showInNearbySearch');

      return {
        createdAt: user.createdAt,
        myNetwork: myNetworkRaw.map(u => this.sanitizeUser(u, userId)),
        requests: requestsRaw.map(u => {
          const reqData = user.network.request.find((r: any) => r.userId === u.uid);
          const inviteMessages = this.getInviteMessages(user, u.uid);
          return {
            ...this.sanitizeUser(u, userId),
            inviteMessage: reqData?.inviteMessage || '',
            inviteMessages: inviteMessages
          };
        }),
        removalRequests: removalRequestsRaw.map(u => this.sanitizeUser(u, userId)),
        block: user.network.block
      };

    } catch (error) {
      throw new Error(`Failed to get network info: ${error}`);
    }
  }

  async removeNetworkConnection(userId: string, targetId: string): Promise<void> {
    // This is now a request-based action
    return this.requestNetworkRemoval(userId, targetId);
  }

  async requestNetworkRemoval(userId: string, targetId: string): Promise<void> {
    try {
      const target = await User.findOne({ uid: targetId });
      if (!target) throw new Error('Target user not found');

      // Add requester to target's removalRequest list if not already there
      if (!target.network.removalRequest.includes(userId)) {
        target.network.removalRequest.push(userId);
        await target.save();
      }
    } catch (error) {
      throw new Error(`Failed to request network removal: ${error}`);
    }
  }

  async approveNetworkRemoval(userId: string, requesterId: string): Promise<void> {
    try {
      const user = await User.findOne({ uid: userId });
      const requester = await User.findOne({ uid: requesterId });

      if (!user || !requester) throw new Error('User or requester not found');

      // Remove from removalRequest list
      user.network.removalRequest = user.network.removalRequest.filter(id => id !== requesterId);

      // Remove from myNetwork for both (Final disconnection)
      user.network.myNetwork = user.network.myNetwork.filter(id => id !== requesterId);
      requester.network.myNetwork = requester.network.myNetwork.filter(id => id !== userId);

      await user.save();
      await requester.save();
    } catch (error) {
      throw new Error(`Failed to approve network removal: ${error}`);
    }
  }

  async rejectNetworkRemoval(userId: string, requesterId: string): Promise<void> {
    try {
      const user = await User.findOne({ uid: userId });
      if (!user) throw new Error('User not found');

      // Just clear the request
      user.network.removalRequest = user.network.removalRequest.filter(id => id !== requesterId);
      await user.save();
    } catch (error) {
      throw new Error(`Failed to reject network removal: ${error}`);
    }
  }

async cancelNetworkRequest(userId: string, targetId: string): Promise<void> {
    try {
      const target = await User.findOne({ uid: targetId });
      if (!target) throw new Error('Target user not found');

      // Remove the current user from the target user's incoming request list
      target.network.request = target.network.request.filter((r: any) => r.userId !== userId);
      await target.save();
    } catch (error) {
      throw new Error(`Failed to cancel network request: ${error}`);
    }
  }


  async blockUser(userId: string, targetId: string): Promise<void> {
    try {
      const user = await User.findOne({ uid: userId });
      const target = await User.findOne({ uid: targetId });

      if (!user) throw new Error('User not found');

      // 1. Add to block list if not already there
      if (!user.network.block.includes(targetId)) {
        user.network.block.push(targetId);
      }

      // 2. Remove from myNetwork
      user.network.myNetwork = user.network.myNetwork.filter(id => id !== targetId);

      // 3. Remove from request list (both directions)
user.network.request = user.network.request.filter(r => r.userId !== targetId);
      
      if (target) {
target.network.request = target.network.request.filter(r => r.userId !== userId);
        target.network.myNetwork = target.network.myNetwork.filter(id => id !== userId);
        await target.save();
      }

      await user.save();
    } catch (error) {
      throw new Error(`Failed to block user: ${error}`);
    }
  }

  async unblockUser(userId: string, targetId: string): Promise<void> {
    try {
      const user = await User.findOne({ uid: userId });
      if (!user) throw new Error('User not found');

      user.network.block = user.network.block.filter(id => id !== targetId);
      await user.save();
    } catch (error) {
      throw new Error(`Failed to unblock user: ${error}`);
    }
  }

  async sendMessage(senderId: string, targetId: string, text: string): Promise<void> {
    try {
      const sender = await User.findOne({ uid: senderId });
      const target = await User.findOne({ uid: targetId });
      if (!sender || !target) throw new Error('User not found');

      const msg = {
        from: senderId,
        to: targetId,
        text: text.trim(),
        timestamp: new Date(),
        type: 'message' as const
      };

      // Add to sender's conversation with target
      let senderConvIndex = sender.network.messages?.findIndex((c: any) => c.withUserId === targetId);
      if (senderConvIndex === -1) {
        senderConvIndex = sender.network.messages?.length || 0;
        sender.network.messages = sender.network.messages || [];
        sender.network.messages!.push({ withUserId: targetId, messages: [] });
      }
      sender.network.messages![senderConvIndex].messages.push(msg);

      // Add to target's conversation with sender
      let targetConvIndex = target.network.messages?.findIndex((c: any) => c.withUserId === senderId);
      if (targetConvIndex === -1) {
        targetConvIndex = target.network.messages?.length || 0;
        target.network.messages = target.network.messages || [];
        target.network.messages!.push({ withUserId: senderId, messages: [] });
      }
      target.network.messages![targetConvIndex].messages.push(msg);

      await sender.save();
      await target.save();
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  async getMessagesWith(userId: string, targetId: string, limit: number = 100): Promise<any[]> {
    try {
      const user = await User.findOne({ uid: userId });
      if (!user) throw new Error('User not found');

      const conv = user.network.messages?.find((c: any) => c.withUserId === targetId);
      if (!conv || !conv.messages) return [];

      return conv.messages
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-limit);
    } catch (error) {
      throw new Error(`Failed to get messages: ${error}`);
    }
  }

  async getMessagesByConversationId(userId: string, conversationId: string, limit: number = 100): Promise<any[]> {
    try {
      const user = await User.findOne({ uid: userId });
      if (!user) throw new Error('User not found');

      const conv = user.network.messages?.find((c: any) => c.withUserId === conversationId);
      if (!conv || !conv.messages) {
        throw new Error('Conversation not found');
      }

      return conv.messages
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-limit);
    } catch (error) {
      throw new Error(`Failed to get messages: ${error}`);
    }
  }
}

