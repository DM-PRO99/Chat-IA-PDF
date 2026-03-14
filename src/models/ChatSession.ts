import mongoose, { type InferSchemaType, type Model } from "mongoose";

export type ChatRole = "user" | "assistant";

export interface ChatMessageFields {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export interface ChatSessionFields {
  documentIds: string[];
  messages: ChatMessageFields[];
  createdAt: Date;
  lastActivity: Date;
}

const ChatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    role: { type: String, required: true, enum: ["user", "assistant"] },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  { _id: false }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    documentIds: { type: [String], required: true, default: [] },
    messages: { type: [ChatMessageSchema], required: true, default: [] },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export type ChatSessionDoc = InferSchemaType<typeof ChatSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChatSessionModel: Model<ChatSessionDoc> =
  (mongoose.models.ChatSession as Model<ChatSessionDoc> | undefined) ??
  mongoose.model<ChatSessionDoc>("ChatSession", ChatSessionSchema);

