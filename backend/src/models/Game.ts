import mongoose from 'mongoose';

export interface IGame extends mongoose.Document {
  mode: 'rank' | 'friend' | 'tournament';
  players: mongoose.Types.ObjectId[];
  theme: string;
  status: 'waiting' | 'active' | 'voting' | 'finished';
  poems: mongoose.Types.ObjectId[];
  votes: Array<{
    voterId: string; // anonymous voter ID
    poemId: mongoose.Types.ObjectId;
  }>;
  winner?: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  settings: {
    timeLimit: number; // in seconds
    maxPlayers: number;
    isPrivate: boolean;
    roomCode?: string;
  };
}

const GameSchema = new mongoose.Schema<IGame>({
  mode: { 
    type: String, 
    enum: ['rank', 'friend', 'tournament'], 
    required: true 
  },
  players: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  theme: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'voting', 'finished'], 
    default: 'waiting' 
  },
  poems: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Poem' 
  }],
  votes: [{
    voterId: { type: String, required: true },
    poemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Poem', required: true }
  }],
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  settings: {
    timeLimit: { type: Number, default: 180 }, // 3 minutes
    maxPlayers: { type: Number, default: 2 },
    isPrivate: { type: Boolean, default: false },
    roomCode: { type: String }
  }
});

// Index for faster queries
GameSchema.index({ status: 1, mode: 1 });
GameSchema.index({ players: 1 });
GameSchema.index({ startTime: -1 });
GameSchema.index({ roomCode: 1 });

export const Game = mongoose.model<IGame>('Game', GameSchema);