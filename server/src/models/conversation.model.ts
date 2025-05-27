import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  lastMessage?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  admins?: mongoose.Types.ObjectId[];
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    type: {
      type: String,
      enum: ['private', 'group'],
      default: 'private'
    },
    name: {
      type: String,
      trim: true
    },
    avatar: {
      type: String
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    admins: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>('Conversation', conversationSchema); 