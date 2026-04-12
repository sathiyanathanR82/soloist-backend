import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soloist';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    console.log('Finding users missing network field...');
    const result = await User.updateMany(
      { network: { $exists: false } },
      { 
        $set: { 
          network: { 
            myNetwork: [], 
            request: [], 
            block: [],
            removalRequest: [],
            messages: []
          } 
        } 
      }
    );

    console.log(`Migration complete!`);
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);

    // Clean up invalid network request entries (missing userId)
    console.log('Cleaning up invalid network request entries...');
    const usersWithNetworkRequests = await User.find({
      'network.request': { $exists: true }
    });

    let cleanedCount = 0;
    for (const user of usersWithNetworkRequests) {
      const originalLength = user.network.request?.length || 0;
      user.network.request = (user.network.request || []).filter(
        (req: any) => req && req.userId
      );
      const newLength = user.network.request?.length || 0;
      
      if (originalLength !== newLength) {
        await user.save();
        cleanedCount++;
        console.log(`Cleaned user ${user._id}: removed ${originalLength - newLength} invalid entries`);
      }
    }
    console.log(`Cleanup complete! Fixed ${cleanedCount} users.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

migrate();
