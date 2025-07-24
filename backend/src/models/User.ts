import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  username: string;
  email: string;
  provider: 'kakao' | 'google';
  profile: {
    avatar: string;
    nickname: string;
    bio: string;
    level: number;
    exp: number;
    rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  };
  stats: {
    totalGames: number;
    wins: number;
    winRate: number;
    bestStreak: number;
    totalPoems: number;
  };
  createdAt: Date;
  lastLogin: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  provider: { type: String, enum: ['kakao', 'google'], required: true },
  profile: {
    avatar: { type: String, default: '' },
    nickname: { type: String, required: true },
    bio: { type: String, default: '' },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    rank: { 
      type: String, 
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], 
      default: 'bronze' 
    }
  },
  stats: {
    totalGames: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    totalPoems: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Calculate win rate before saving
UserSchema.pre('save', function(next) {
  if (this.stats.totalGames > 0) {
    this.stats.winRate = Math.round((this.stats.wins / this.stats.totalGames) * 100);
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);