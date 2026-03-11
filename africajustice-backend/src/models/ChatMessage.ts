import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  userId: string;
  sender: 'user' | 'bot';
  message: string;
  messageType: 'text' | 'voice' | 'audio-response';
  voiceUrl?: string;
  audioResponseUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  caseId?: string;
  isResolved?: boolean;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'bot'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'voice', 'audio-response'],
      default: 'text',
    },
    voiceUrl: {
      type: String,
      default: null,
    },
    audioResponseUrl: {
      type: String,
      default: null,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
    },
    caseId: {
      type: String,
      default: null,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ caseId: 1, createdAt: -1 });
chatMessageSchema.index({ createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
