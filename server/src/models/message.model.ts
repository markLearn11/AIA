import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text?: string;
  image?: string;
  video?: string;
  audio?: string;
  file?: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
  readBy: mongoose.Types.ObjectId[];
  replyTo?: mongoose.Types.ObjectId;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String
    },
    image: {
      type: String
    },
    video: {
      type: String
    },
    audio: {
      type: String
    },
    file: {
      url: String,
      name: String,
      size: Number,
      type: String
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', messageSchema); 