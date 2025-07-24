import mongoose from 'mongoose';

export interface IPoem extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  content: {
    line1: string;
    line2: string;
    line3: string;
  };
  theme: string;
  votes: number;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
}

const PoemSchema = new mongoose.Schema<IPoem>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  content: {
    line1: { type: String, required: true, maxlength: 50 },
    line2: { type: String, required: true, maxlength: 50 },
    line3: { type: String, required: true, maxlength: 50 }
  },
  theme: { type: String, required: true },
  votes: { type: Number, default: 0 },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
PoemSchema.index({ userId: 1, createdAt: -1 });
PoemSchema.index({ gameId: 1 });
PoemSchema.index({ theme: 1, isPublic: 1 });

export const Poem = mongoose.model<IPoem>('Poem', PoemSchema);