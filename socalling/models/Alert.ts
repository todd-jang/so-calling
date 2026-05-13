import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice?: number;
  isActive: boolean;
  lastChecked?: Date;
  priceHistory: Array<{
    price: number;
    timestamp: Date;
  }>;
}

const AlertSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: String, required: true, uppercase: true },
  destination: { type: String, required: true, uppercase: true },
  targetPrice: { type: Number, required: true },
  currentPrice: { type: Number },
  isActive: { type: Boolean, default: true },
  lastChecked: { type: Date },
  priceHistory: [{
    price: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }]
});

// Index for efficient worker polling
AlertSchema.index({ isActive: 1, lastChecked: 1 });

export default mongoose.model<IAlert>('Alert', AlertSchema);
